#!/usr/bin/env node
// JobFlow 30 shortlist: conservative review queue from an existing JSON export.
// Usage: node scripts/jobflow30-shortlist.mjs input.json [output.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TERMS = [
  ['healthcare it', 35], ['clinical systems', 35], ['ehr', 30],
  ['informatics', 30], ['software engineer', 32], ['software developer', 30],
  ['data analyst', 28], ['business intelligence', 27], ['systems analyst', 30],
  ['business analyst', 24], ['application support', 26], ['technical support', 20],
  ['revenue cycle', 24], ['healthcare operations', 24], ['implementation specialist', 22],
  ['customer success', 16], ['data engineer', 24], ['quality improvement', 20]
];
const BLOCKED = /\b(senior|sr\.?|staff|principal|director|vice president|vp|chief|head of)\b/i;
const normalize = value => String(value ?? '').toLowerCase().trim();
export function evaluate(job) {
  const title = normalize(job.title), location = normalize(job.location);
  const description = normalize(job.description);
  const combined = title + ' ' + description;
  const remote = /\bremote\b/i.test(location) || job.remote === true;
  const chicago = /\bchicago\b/i.test(location);
  const explicitOtherCity = /\b(new york|san francisco|los angeles|boston|seattle|austin|denver|atlanta|dallas)\b/i.test(location);
  const illinoisAllowed = /\b(illinois|\bil\b|united states|usa|nationwide|anywhere in the us)\b/i.test(location + ' ' + description);
  const remoteOtherStateOnly = /\b(remote only in|residents of|must reside in|based in)\b/i.test(description) && !illinoisAllowed;
  const reasons = [];
  if (!title || !job.url || !job.company) reasons.push('missing job identity');
  if (BLOCKED.test(title)) reasons.push('senior leadership title');
  if (!remote && (!chicago || explicitOtherCity)) reasons.push('not Chicago on-site/hybrid');
  if (remote && remoteOtherStateOnly) reasons.push('remote geography requires review');
  if (remote && !illinoisAllowed) reasons.push('Illinois remote eligibility unverified');
  if (/\b(us citizenship required|security clearance required)\b/i.test(description)) reasons.push('additional eligibility verification');
  const matched = TERMS.filter(([term]) => combined.includes(term));
  if (!matched.length) reasons.push('job family match unverified');
  const score = Math.min(100, matched.reduce((n, [, weight]) => n + weight, 0) + (chicago ? 12 : 0) + (remote && illinoisAllowed ? 10 : 0));
  const status = reasons.length ? 'needs_review' : 'shortlisted';
  return { ...job, score, status, reasons };
}
export function shortlist(jobs, limit = 30) {
  if (!Array.isArray(jobs)) throw new TypeError('Expected JSON array of jobs');
  const seen = new Set();
  const evaluated = jobs.map(evaluate).filter(job => {
    const key = [normalize(job.company), normalize(job.requisition_id || job.id || job.url)].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (a.status === 'shortlisted' ? 0 : 1) - (b.status === 'shortlisted' ? 0 : 1) || b.score - a.score);
  return { generated_at: new Date().toISOString(), target: limit, shortlisted: evaluated.filter(j => j.status === 'shortlisted').slice(0, limit), needs_review: evaluated.filter(j => j.status === 'needs_review'), note: 'Shortlist only. No application submitted. Confirm work location, job requirements and posting liveness before applying.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , input, output] = process.argv;
  if (!input) { console.error('Usage: node scripts/jobflow30-shortlist.mjs jobs.json [queue.json]'); process.exit(2); }
  const data = shortlist(JSON.parse(readFileSync(input, 'utf8')));
  const result = JSON.stringify(data, null, 2) + '\n';
  if (output) writeFileSync(output, result); else process.stdout.write(result);
}
