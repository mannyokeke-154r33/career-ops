import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePipeline } from '../scripts/jobflow15-pipeline.mjs';
import { shortlist } from '../scripts/jobflow30-shortlist.mjs';
import { enrichQueue } from '../scripts/jobflow15-enrich.mjs';
import { buildResearchQueue } from '../scripts/jobflow15-research.mjs';
import { draftRecruiterMessage } from '../scripts/jobflow15-message.mjs';
import { updateRecord } from '../scripts/jobflow15-outreach.mjs';

// Synthetic postings only. All external requests are mocked.
const pipeline = `# Incoming
## Pending
- [ ] https://example.org/job/100 | Sample Health | Healthcare IT Analyst | Chicago, IL
- [ ] https://example.org/job/101 | Sample Systems | Technical Support Engineer | Remote, United States
- [ ] https://example.org/job/102 | Sample West | Software Engineer | Los Angeles, CA
## Processed
- [ ] https://example.org/job/103 | Sample Old | Data Analyst | Chicago, IL`;

test('pending scan -> shortlist -> JD review -> recruiter search -> manual outreach',()=>{
  const discovered = parsePipeline(pipeline);
  assert.equal(discovered.length,3);
  const queue = shortlist(discovered);
  assert.equal(queue.target,15);
  assert.equal(queue.shortlisted.length,2);
  assert.equal(queue.needs_review.length,1);
  const fullText='Required qualifications: Epic EHR experience, SQL and technical support. '.repeat(5);
  const enriched=enrichQueue(queue,(_cmd,args)=>({
    status:0,
    stdout:JSON.stringify({url:args[1],text:fullText})
  }));
  assert.equal(enriched.shortlisted.length,2);
  assert.ok(enriched.shortlisted.every(j=>j.jd_status==='extracted'));
  assert.ok(enriched.shortlisted.every(j=>j.outreach.application_confirmed===false));
  const research=buildResearchQueue(enriched);
  assert.equal(research.contacts.length,2);
  assert.ok(research.contacts.every(c=>c.contact_name===null && c.application_confirmed===false));
  const job=queue.shortlisted[0];
  assert.throws(()=>draftRecruiterMessage({...job,application_status:'not_applied'}),/Confirm application/);
  let records=updateRecord({},'sample-100','job_url',job.url);
  records=updateRecord(records,'sample-100','application_status','applied');
  const message=draftRecruiterMessage({title:job.title,company:job.company,application_status:records['sample-100'].application_status},{first_name:'Taylor'});
  assert.match(message.draft,/I recently applied/);
  assert.equal(records['sample-100'].message_status,'not_drafted');
});
