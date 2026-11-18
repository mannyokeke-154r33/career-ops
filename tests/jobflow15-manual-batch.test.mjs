import test from 'node:test';
import assert from 'node:assert/strict';
import { assessManualBatch } from '../scripts/jobflow15-manual-batch.mjs';

const job=(i,overrides={})=>({
  title:'Healthcare IT Analyst',
  company:'Example '+i,
  url:'https://example.org/jobs/'+i,
  location:'Chicago, IL',
  description:'The position involves Epic EHR, SQL, stakeholder analysis and technical support. '.repeat(5),
  ...overrides
});
const evaluated=(x)=>({
  ...x,score:Number(x.rating??80),status:x.allowed===false?'needs_review':'shortlisted',
  reasons:x.allowed===false?['eligibility restriction']:[],
  evidence_coverage_count:x.evidence===false?0:2,
  evidence_matches:x.evidence===false?[]:[{id:'synthetic',source:'test',matched_terms:['sql']}]
});

test('caps valid recommendations at 15 and retains overflow',()=>{
  const result=assessManualBatch(Array.from({length:27},(_,i)=>job(i)),{evaluator:evaluated});
  assert.equal(result.recommended.length,15);
  assert.equal(result.reserve.length,12);
  assert.equal(result.daily_limit,15);
});
test('does not force 15 matches when only 4 qualify',()=>{
  const input=Array.from({length:25},(_,i)=>job(i,{allowed:i<4}));
  const result=assessManualBatch(input,{evaluator:evaluated});
  assert.equal(result.recommended.length,4);
  assert.equal(result.needs_review.length,21);
});
test('requires complete job descriptions',()=>{
  const result=assessManualBatch([job(1,{description:'Short ad'})],{evaluator:evaluated});
  assert.equal(result.recommended.length,0);
  assert.match(result.needs_review[0].review_reasons.join(' '),/description/);
});
test('requires job-specific evidence',()=>{
  const result=assessManualBatch([job(1,{evidence:false})],{evaluator:evaluated});
  assert.equal(result.recommended.length,0);
  assert.match(result.needs_review[0].review_reasons.join(' '),/candidate evidence/);
});
test('deduplicates the same requisition at an employer',()=>{
  const result=assessManualBatch([job(1,{requisition_id:'123'}),job(2,{company:'Example 1',requisition_id:'123'})],{evaluator:evaluated});
  assert.equal(result.unique_count,1);
  assert.equal(result.duplicates_removed,1);
});
test('does not claim submitted application or recruiter contact',()=>{
  const result=assessManualBatch([job(1)],{evaluator:evaluated});
  assert.equal(result.recommended[0].application_status,'not_confirmed');
  assert.equal(result.recommended[0].outreach_status,'not_started');
});
test('rejects missing URL and invalid batch size',()=>{
  const result=assessManualBatch([job(1,{url:'javascript:alert(1)'})],{evaluator:evaluated});
  assert.equal(result.recommended.length,0);
  assert.throws(()=>assessManualBatch([], {limit:16}),RangeError);
});
