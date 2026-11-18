import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../scripts/jobflow30-shortlist.mjs';
import { assessManualBatch } from '../scripts/jobflow15-manual-batch.mjs';
import { buildResearchQueue } from '../scripts/jobflow15-research.mjs';

const evidence = [
  {id:'experience-ehr',source:'synthetic',kind:'experience',label:'Synthetic EHR support',terms:['Epic','EHR']},
  {id:'credential-sql',source:'synthetic',kind:'credential',label:'Synthetic SQL assessment',terms:['SQL']}
];
const evaluator = job => evaluate(job, evidence);
const posting = (i,changes={})=>({
  title:'Healthcare IT Analyst',company:'Synthetic '+i,url:'https://example.org/jobs/'+i,
  location:'Chicago, IL',description:'Epic EHR and SQL reporting duties with technical support and workflows. '.repeat(5),
  ...changes
});
test('real scoring with synthetic evidence produces at most 15 matches and 12 reserves',()=>{
  const result=assessManualBatch(Array.from({length:27},(_,i)=>posting(i)),{evaluator});
  assert.equal(result.recommended.length,15);
  assert.equal(result.reserve.length,12);
  assert.ok(result.recommended.every(j=>j.score_breakdown.role_alignment>0));
  assert.ok(result.recommended.every(j=>j.score_breakdown.evidence_alignment>0));
  assert.ok(result.recommended.every(j=>j.decision==='recommend'));
  const research=buildResearchQueue(result);
  assert.equal(research.count,15);
  assert.ok(research.contacts.every(c=>c.contact_name===null && c.message_sent===false));
});
test('real scoring excludes non-Chicago on-site jobs',()=>{
  const result=assessManualBatch([posting(1,{location:'San Francisco, CA'})],{evaluator});
  assert.equal(result.recommended.length,0);
  assert.equal(result.do_not_prioritize.length,1);
});
test('real scoring flags mandatory certifications that have not been verified',()=>{
  const result=assessManualBatch([posting(1,{description:'Must have Epic certification required. Epic EHR and SQL duties. '.repeat(5)})],{evaluator});
  assert.equal(result.recommended.length,0);
  assert.equal(result.needs_review.length,1);
  assert.ok(result.needs_review[0].review_reasons.some(r=>r.includes('mandatory credential')));
});
test('real scoring rejects postings without evidence instead of filling quota',()=>{
  const result=assessManualBatch([posting(1,{description:'Build Kubernetes systems and Terraform production clusters. '.repeat(5)})],{evaluator});
  assert.equal(result.recommended.length,0);
  assert.equal(result.needs_review.length,1);
});
