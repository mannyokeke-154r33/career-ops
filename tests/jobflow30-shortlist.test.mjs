import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, shortlist } from '../scripts/jobflow30-shortlist.mjs';
import { matchEvidence } from '../scripts/jobflow30-evidence.mjs';
const job = (overrides = {}) => ({ title: 'Healthcare IT Analyst', company: 'Example', url: 'https://example.org/jobs/1', location: 'Chicago, IL', ...overrides });
test('shortlists matching Chicago role', () => assert.equal(evaluate(job()).status, 'shortlisted'));
test('rejects other-city on-site role for manual review', () => assert.equal(evaluate(job({ location: 'New York, NY' })).status, 'needs_review'));
test('flags remote roles without Illinois evidence', () => assert.equal(evaluate(job({ location: 'Remote' })).status, 'needs_review'));
test('allows clearly US-wide remote roles', () => assert.equal(evaluate(job({ location: 'Remote, United States' })).status, 'shortlisted'));
test('deduplicates by requisition id', () => assert.equal(shortlist([job(), job({url:'https://example.org/jobs/2'})]).shortlisted.length, 2));
test('caps daily queue at 15', () => assert.equal(shortlist(Array.from({length:35},(_,i)=>job({url:'https://example.org/jobs/'+i}))).shortlisted.length,15));
test('does not pass senior roles', () => assert.equal(evaluate(job({title:'Senior Healthcare IT Analyst'})).status,'needs_review'));

test('explains requirement matches using locally supplied evidence', () => {
  const entries=[
    {id:'health-records',label:'Example clinical systems work',source:'candidate',kind:'experience',terms:['Epic','EHR']},
    {id:'sql-course',label:'SQL course',source:'candidate',kind:'training',terms:['SQL']},
    {id:'python-work',label:'Python work',source:'candidate',kind:'experience',terms:['Python']}
  ];
  const result=matchEvidence({description:'Requires SQL, Epic EHR and Python'},entries);
  assert.ok(result.evidence_matches.some(x=>x.id==='health-records' && x.matched_terms.includes('Epic')));
  assert.ok(result.evidence_matches.some(x=>x.id==='sql-course'));
  assert.ok(result.evidence_matches.some(x=>x.id==='python-work'));
});
test('does not invent evidence for unrelated skills', () => {
  const result=matchEvidence({description:'Requires Kubernetes'},[{id:'sql',label:'SQL training',source:'candidate',kind:'training',terms:['SQL']}]);
  assert.equal(result.evidence_coverage_count,0);
});

test('includes recruiter research and outreach states without claiming submission', () => {
  const result = evaluate(job());
  assert.equal(result.outreach.recruiter_lookup, 'not_started');
  assert.equal(result.outreach.application_confirmed, false);
  assert.equal(result.outreach.message_status, 'not_drafted');
});

test('flags state-restricted remote role despite United States label', () => {
  const result=evaluate(job({location:'Remote, United States',description:'Applicants must reside in California.'}));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('remote residency restriction requires review'));
});
test('permits explicit Illinois residency restriction', () => {
  const result=evaluate(job({location:'Remote, United States',description:'Applicants must reside in Illinois.'}));
  assert.equal(result.status,'shortlisted');
});
