import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResearchQueue,researchPlan } from '../scripts/jobflow15-research.mjs';
test('generates searches without inventing recruiter',()=>{
 const plan=researchPlan({company:'Example Health',title:'Clinical Systems Analyst',url:'https://example.org/job'});
 assert.equal(plan.contact_name,null);
 assert.equal(plan.contact_relevance,'unverified');
 assert.ok(plan.recruiter_searches.every(s=>s.url.startsWith('https://www.google.com/search?q=')));
 assert.match(decodeURIComponent(plan.recruiter_searches[0].url),/Example Health/);
});
test('produces one checklist per shortlisted job',()=>{
 const q=buildResearchQueue({shortlisted:[{company:'Example',title:'Analyst',url:'https://example.org'}]});
 assert.equal(q.count,1);
 assert.equal(q.contacts[0].application_confirmed,false);
});
