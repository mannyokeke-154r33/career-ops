import test from 'node:test';
import assert from 'node:assert/strict';
import {researchTask,researchQueue} from '../scripts/jobflow15-recruiter-research.mjs';
const job={company:'Example Health',title:'Clinical Systems Analyst',url:'https://example.org/job/123'};
test('creates search links, not invented contacts',()=>{
 const t=researchTask(job);
 assert.equal(t.contact_status,'unverified');
 assert.equal(t.contact_profile_url,null);
 assert.equal(t.searches.length,3);
 assert.ok(t.searches[0].url.includes('linkedin.com'));
});
test('rejects missing job URL',()=>assert.throws(()=>researchTask({...job,url:''})));
test('does not claim submission',()=>assert.equal(researchQueue({shortlisted:[job]}).jobs[0].application_status,'not_confirmed'));
