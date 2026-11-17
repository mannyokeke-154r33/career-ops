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
 assert.equal(result.shortlisted.length,1);
 assert.equal(result.target,15);
});
