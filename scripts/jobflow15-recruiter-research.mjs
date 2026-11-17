#!/usr/bin/env node
// Build manual recruiter research tasks without scraping LinkedIn or claiming contact ownership.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const compact = x => String(x ?? '').replace(/\s+/g,' ').trim();
export function researchTask(job) {
  if (!job || !compact(job.company) || !compact(job.title) || !/^https?:\/\//i.test(compact(job.url))) throw new Error('A company, job title, and HTTP(S) job URL are required');
  const company = compact(job.company), title = compact(job.title);
  const q = s => 'https://www.google.com/search?q='+encodeURIComponent(s);
  return {
    company,title,job_url:job.url,
    searches: [
      { purpose:'recruiter', url:q('site:linkedin.com/in/ '+JSON.stringify(company)+' recruiter talent acquisition '+JSON.stringify(title)) },
      { purpose:'hiring_manager', url:q('site:linkedin.com/in/ '+JSON.stringify(company)+' hiring manager '+JSON.stringify(title)) },
      { purpose:'relevant_public_posts', url:q('site:linkedin.com/posts/ '+JSON.stringify(company)+' '+JSON.stringify(title)) }
    ],
    contact_status:'unverified',contact_profile_url:null,role_connection_evidence:null,
    interaction_status:'not_reviewed',interaction_url:null,
    application_status:'not_confirmed',message_status:'not_drafted',
    instructions:'Open searches manually; verify employer, current role and connection to this vacancy. Do not assume a person is the hiring manager. Do not message until application is confirmed. No LinkedIn action performed.'
  };
}
export function researchQueue(queue) {
  if (!queue || !Array.isArray(queue.shortlisted)) throw new TypeError('Expected shortlist output');
  return {generated_at:new Date().toISOString(), jobs:queue.shortlisted.map(researchTask)};
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [,,input,output]=process.argv;
  if (!input || !output) { console.error('Usage: node scripts/jobflow15-recruiter-research.mjs queue.json research.json');process.exit(2); }
  try {writeFileSync(output,JSON.stringify(researchQueue(JSON.parse(readFileSync(input,'utf8'))),null,2)+'\n',{mode:0o600});console.log('Created recruiter research tasks. No profiles fetched or messages sent.');}
  catch(e){console.error(e.message);process.exitCode=1;}
}
