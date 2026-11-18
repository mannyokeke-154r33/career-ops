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

test('explicit Chicago remote location is preliminarily eligible', () => {
  const result = evaluate(job({ location:'Remote, Chicago, IL' }));
  assert.equal(result.status,'shortlisted');
});
test('role, geography and experience contribute separately to score', () => {
  const experience = [{id:'example',source:'synthetic',kind:'experience',label:'Synthetic healthcare IT work',terms:['epic']}];
  const result = evaluate(job({description:'Position requires Epic support and workflow analysis'}), experience);
  assert.equal(result.role_family,'Healthcare IT and Clinical Systems');
  assert.equal(result.score_breakdown.role_alignment,45);
  assert.equal(result.score_breakdown.location_alignment,15);
  assert.equal(result.score_breakdown.evidence_alignment,12);
  assert.equal(result.score,72);
  assert.equal(result.evidence_matches[0].source,'synthetic');
});

test('Chicago Heights and Chicago Ridge are outside the target city', () => {
  for (const location of ['Chicago Heights, IL', 'Chicago Ridge, IL']) {
    const result = evaluate(job({location}));
    assert.equal(result.status, 'needs_review');
    assert.ok(result.reasons.includes('not Chicago on-site/hybrid'));
  }
});
test('Greater Chicago metro label needs city verification', () => {
  const result = evaluate(job({location:'Greater Chicago Area'}));
  assert.equal(result.status, 'needs_review');
  assert.ok(result.reasons.includes('Chicago city location requires verification'));
});
test('explicit Illinois remote exclusion needs review', () => {
  const result = evaluate(job({
    location:'Remote, United States',
    description:'Work from anywhere in the USA, excluding Illinois.'
  }));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('Illinois explicitly excluded from remote location'));
});

test('remote role with Illinois exclusion phrased as excludes is flagged', () => {
  const result = evaluate(job({
    location: 'Remote, USA',
    description: 'Remote position excludes Illinois.'
  }));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('Illinois explicitly excluded from remote location'));
});

test('remote location excludes Illinois with excluding wording', () => {
  const result = evaluate(job({
    location: 'Remote, United States',
    description: 'Remote work is available in the USA, excluding Illinois.'
  }));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('Illinois explicitly excluded from remote location'));
});

test('Chicago Heights is not treated as Chicago city', () => {
  const result=evaluate(job({location:'Chicago Heights, IL'}));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('not Chicago on-site/hybrid'));
});
test('Greater Chicago Area is not assumed within city limits', () => {
  const result=evaluate(job({location:'Greater Chicago Area'}));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('Chicago city location requires verification'));
});
test('remote jobs excluding Illinois are held for review', () => {
  const result=evaluate(job({location:'Remote, United States',description:'This position is not available in Illinois.'}));
  assert.equal(result.status,'needs_review');
  assert.ok(result.reasons.includes('Illinois explicitly excluded from remote location'));
});

test('generic Analyst I maps to healthcare analytics only with multiple duties', () => {
  const result = evaluate(job({
    title:'Analyst I',
    location:'Remote, United States',
    description:'Healthcare data collection, routine data quality validation, statistical analysis, KPI dashboards, and reporting. '
  }));
  assert.equal(result.role_family,'Healthcare Data and Business Analytics');
  assert.equal(result.status,'shortlisted');
});
test('generic Analyst I with unrelated duties does not infer healthcare analytics', () => {
  const result = evaluate(job({
    title:'Analyst I',
    location:'Remote, United States',
    description:'Financial trading and derivatives execution support for an investment desk.'
  }));
  assert.equal(result.role_family,null);
  assert.equal(result.status,'needs_review');
});
test('generic Analyst I cannot infer healthcare analytics from a single vague term', () => {
  const result = evaluate(job({
    title:'Analyst I',
    location:'Remote, United States',
    description:'Healthcare team, prepare reports as requested.'
  }));
  assert.equal(result.role_family,null);
  assert.equal(result.status,'needs_review');
});
