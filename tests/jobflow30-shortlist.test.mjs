import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, shortlist } from '../scripts/jobflow30-shortlist.mjs';
const job = (overrides = {}) => ({ title: 'Healthcare IT Analyst', company: 'Example', url: 'https://example.org/jobs/1', location: 'Chicago, IL', ...overrides });
test('shortlists matching Chicago role', () => assert.equal(evaluate(job()).status, 'shortlisted'));
test('rejects other-city on-site role for manual review', () => assert.equal(evaluate(job({ location: 'New York, NY' })).status, 'needs_review'));
test('flags remote roles without Illinois evidence', () => assert.equal(evaluate(job({ location: 'Remote' })).status, 'needs_review'));
test('allows clearly US-wide remote roles', () => assert.equal(evaluate(job({ location: 'Remote, United States' })).status, 'shortlisted'));
test('deduplicates by requisition id', () => assert.equal(shortlist([job(), job({url:'https://example.org/jobs/2'})]).shortlisted.length, 2));
test('caps daily queue at 15', () => assert.equal(shortlist(Array.from({length:35},(_,i)=>job({url:'https://example.org/jobs/'+i}))).shortlisted.length,15));
test('does not pass senior roles', () => assert.equal(evaluate(job({title:'Senior Healthcare IT Analyst'})).status,'needs_review'));

test('explains SQL and EHR evidence from job requirements', () => {
  const result = evaluate(job({ description: 'Requires SQL, Epic EHR and Python' }));
  assert.ok(result.evidence_matches.some(x => x.id === 'pharmacy' && x.matched_terms.includes('epic')));
  assert.ok(result.evidence_matches.some(x => x.id === 'hackerrank-sql'));
  assert.ok(result.evidence_matches.some(x => x.id === 'techhub'));
});
test('does not invent evidence for an unrelated skill', () => {
  const result = evaluate(job({ description: 'Requires Kubernetes', title:'Healthcare IT Analyst' }));
  assert.ok(!result.matched_skills.includes('kubernetes'));
});

test('includes recruiter research and outreach states without claiming submission', () => {
  const result = evaluate(job());
  assert.equal(result.outreach.recruiter_lookup, 'not_started');
  assert.equal(result.outreach.application_confirmed, false);
  assert.equal(result.outreach.message_status, 'not_drafted');
});
