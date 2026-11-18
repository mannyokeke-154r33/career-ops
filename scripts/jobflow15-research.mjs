#!/usr/bin/env node
// Offline recruiter research checklist. Produces searches, never invents contacts.
// Usage: node scripts/jobflow15-research.mjs enriched.json research.json
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isMainModule } from '../lib/is-main-module.mjs';
const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
const search = terms => 'https://www.google.com/search?q='+encodeURIComponent(terms);
export function researchPlan(job) {
  const company=clean(job.company), title=clean(job.title);
  if (!company || !title) throw new Error('Missing company or job title');
  const query1='site:linkedin.com/in/ '+company+' recruiter '+title;
  const query2='site:linkedin.com/in/ '+company+' talent acquisition healthcare technology';
  const query3='site:linkedin.com/in/ '+company+' hiring manager '+title;
  return {
    company,title,job_url:job.url,
    recruiter_searches:[query1,query2,query3].map(query=>({query,url:search(query)})),
    contact_status:'not_researched',
    contact_name:null,contact_profile_url:null,
    contact_relevance:'unverified',
    public_activity_url:null,interaction_idea:null,
    application_confirmed:false,message_sent:false,
    cautions:['Search links are leads, not identified recruiters.','Verify current employer and responsibility for this requisition before contacting.','Do not claim a recent application until confirmed.','Only interact with public professional content genuinely relevant to the role.']
  };
}
export function buildResearchQueue(data) {
  const jobs = Array.isArray(data?.recommended) ? data.recommended : data?.shortlisted;
  if (!Array.isArray(jobs)) throw new TypeError('Expected recommended or shortlisted array');
  return {generated_at:new Date().toISOString(), count:jobs.length, contacts:jobs.map(researchPlan)};
}
if (isMainModule(import.meta.url)) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log("Usage: node scripts/jobflow15-research.mjs shortlist.json research.json");
    process.exit(0);
  }
  const [,,input,output]=process.argv;
  if (!input || !output) {console.error('Usage: node scripts/jobflow15-research.mjs shortlist.json research.json');process.exit(2);}
  try {
    const plan=buildResearchQueue(JSON.parse(readFileSync(input,'utf8')));
    writeFileSync(output,JSON.stringify(plan,null,2)+'\n',{mode:0o600});
    console.log('Prepared '+plan.count+' recruiter research checklists. No profile was accessed and no outreach was sent.');
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
