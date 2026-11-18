import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichOne, enrichQueue } from '../scripts/jobflow15-enrich.mjs';
const job={company:'Example',title:'Healthcare IT Analyst',url:'https://example.org/jobs/123'};
test('reads JD using existing extractor without applying',()=>{
 const result=enrichOne(job,(_cmd,args)=>({status:0,stdout:JSON.stringify({text:'Relevant experience. '.repeat(20)})}));
 assert.equal(result.jd_status,'extracted');
 assert.equal(result.jd_verified,false);
 assert.match(result.description,/Relevant experience/);
});
test('marks failed extraction for review',()=>{
 const result=enrichOne(job,()=>({status:1,stdout:'{}'}));
 assert.equal(result.jd_status,'extraction_failed');
});
test('rejects non-http URLs without spawning',()=>{
 const result=enrichOne({...job,url:'file:///etc/passwd'},()=>{throw Error('should not run')});
 assert.equal(result.jd_status,'invalid_url');
});
test('retains shortlist shape',()=>{
 const result=enrichQueue({target:15,shortlisted:[job]},()=>({status:1,stdout:''}));
 assert.equal(result.shortlisted.length,0);
 assert.equal(result.needs_review.length,1);
 assert.equal(result.needs_review[0].jd_status,'extraction_failed');
 assert.equal(result.target,15);
});

test('moves newly discovered residency restriction to review',()=>{
 const input={target:15,shortlisted:[{...job,location:'Remote, United States'}],needs_review:[]};
 const text='Applicants must reside in California. The role involves healthcare IT systems. '.repeat(5);
 const result=enrichQueue(input,()=>({status:0,stdout:JSON.stringify({text})}));
 assert.equal(result.shortlisted.length,0);
 assert.equal(result.needs_review.length,1);
 assert.ok(result.needs_review[0].reasons.includes('remote residency restriction requires review'));
});
