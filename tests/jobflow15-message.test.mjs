import test from 'node:test';
import assert from 'node:assert/strict';
import { draftRecruiterMessage } from '../scripts/jobflow15-message.mjs';
test('requires confirmed application',()=>assert.throws(()=>draftRecruiterMessage({title:'Analyst',company:'Example'}),/Confirm application/));
test('produces role-specific message without claiming to send',()=>{
 const r=draftRecruiterMessage({title:'Clinical Systems Analyst',company:'Example Health',application_status:'applied',relevant_experience:'Epic EHR workflows and Python automation'}, {first_name:'Taylor'});
 assert.match(r.draft,/Hi Taylor,/);
 assert.match(r.draft,/Clinical Systems Analyst position at Example Health/);
 assert.match(r.draft,/Epic EHR workflows and Python automation/);
 assert.ok(r.warnings.some(w=>w.includes('No LinkedIn interaction')));
});
