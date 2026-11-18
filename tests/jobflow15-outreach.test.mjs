import test from 'node:test';
import assert from 'node:assert/strict';
import { updateRecord } from '../scripts/jobflow15-outreach.mjs';
test('tracks recruiter lookup without claiming application',()=>{
 const r=updateRecord({},'req-123','recruiter_url','https://www.linkedin.com/in/example');
 assert.equal(r['req-123'].application_status,'not_applied');
 assert.equal(r['req-123'].message_status,'not_drafted');
});
test('requires application confirmation before marking message sent',()=>{
 assert.throws(()=>updateRecord({},'req-123','message_status','sent'),/Confirm the application/);
});
test('records manually confirmed application then sent message',()=>{
 let r=updateRecord({},'req-123','application_status','applied');
 r=updateRecord(r,'req-123','message_status','sent');
 assert.equal(r['req-123'].message_status,'sent');
});
test('rejects unknown fields',()=>assert.throws(()=>updateRecord({},'req-123','password','secret'),/Unsupported field/));
