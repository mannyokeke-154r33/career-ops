#!/usr/bin/env node
// Local-only recruiter outreach tracker. No network requests or message sending.
// Usage: node scripts/jobflow15-outreach.mjs list
//        node scripts/jobflow15-outreach.mjs set <job-id> <field> <value>
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fields = new Set(['company','title','job_url','recruiter_name','recruiter_role','recruiter_url','recruiter_relevance','public_post_url','interaction_note','application_status','application_date','message_draft','message_status','message_sent_date','reply_status','follow_up_date']);
const allowed = {
  recruiter_relevance: ['unverified','possible','confirmed'],
  application_status: ['not_applied','applied'],
  message_status: ['not_drafted','drafted','sent'],
  reply_status: ['none','replied','declined']
};
const defaultRecord = id => ({ id, recruiter_relevance:'unverified', application_status:'not_applied', message_status:'not_drafted', reply_status:'none' });
export function updateRecord(records, id, field, value) {
  if (!id || !/^[a-zA-Z0-9._-]{1,120}$/.test(id)) throw new Error('Job ID must contain only letters, numbers, dots, underscores or hyphens');
  if (!fields.has(field)) throw new Error('Unsupported field: '+field);
  if (typeof value !== 'string' || value.length > 3000) throw new Error('Invalid field value');
  if (allowed[field] && !allowed[field].includes(value)) throw new Error('Invalid status value');
  if (field === 'message_status' && value === 'sent' && records[id]?.application_status !== 'applied') throw new Error('Confirm the application before marking outreach sent');
  if (field === 'message_sent_date' && records[id]?.message_status !== 'sent') throw new Error('Mark message_status sent before recording sent date');
  const record = { ...defaultRecord(id), ...(records[id] || {}), [field]:value };
  return { ...records, [id]:record };
}
export function load(path) {
  try { const parsed = JSON.parse(readFileSync(path,'utf8')); if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Invalid tracker format'); return parsed; }
  catch (err) { if (err.code === 'ENOENT') return {}; throw err; }
}
export function save(path, data) {
  mkdirSync(dirname(path), {recursive:true});
  const temp = path+'.tmp-'+process.pid;
  writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{mode:0o600});
  renameSync(temp,path);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [,,cmd,id,field,...rest] = process.argv;
  const path = resolve(process.env.CAREER_OPS_OUTREACH_PATH || 'data/jobflow15-outreach.json');
  try {
    if (cmd === 'list' && !id) console.log(JSON.stringify(load(path),null,2));
    else if (cmd === 'set' && rest.length) {
      const updated = updateRecord(load(path),id,field,rest.join(' '));
      save(path,updated);
      console.log('Saved locally. No LinkedIn action performed.');
    } else { console.error('Usage: node scripts/jobflow15-outreach.mjs list | set <job-id> <field> <value>'); process.exitCode=2; }
  } catch(err) { console.error(err.message); process.exitCode=1; }
}
