#!/usr/bin/env node
/**
 * JobFlow 15: manual batch intake. The user supplies 20-30 listings;
 * this tool never fetches jobs, applies, or contacts anyone.
 *
 * Usage: node scripts/jobflow15-manual-batch.mjs data/today-jobs.json data/jobflow15-daily.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { evaluate } from './jobflow30-shortlist.mjs';

const normalized = value => String(value ?? '').trim();
const uniqueKey = job => [normalized(job.company).toLowerCase(),normalized(job.requisition_id || job.id || job.url).toLowerCase()].join('|');
const isHttpUrl = url => {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' || parsed.protocol === 'http:'; }
  catch { return false; }
};

/**
 * The evaluator is injectable for deterministic offline tests.
 * "Recommend" is a shortlist for human verification, not a hiring guarantee.
 */
export function assessManualBatch(postings, { evaluator = evaluate, limit = 15 } = {}) {
  if (!Array.isArray(postings)) throw new TypeError('Expected an array of job postings');
  if (!Number.isInteger(limit) || limit < 1 || limit > 15) throw new RangeError('Daily recommendation limit must be 1 to 15');

  const seen = new Set();
  const records = [];
  let duplicates = 0;
  for (const [index, source] of postings.entries()) {
    const job = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
    const key = uniqueKey(job);
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);

    const problems = [];
    if (!normalized(job.title) || !normalized(job.company)) problems.push('missing job title or employer');
    if (!isHttpUrl(job.url)) problems.push('missing valid public job URL');
    const validDescription = typeof job.description === 'string' && job.description.trim().length >= 200;
    if (!validDescription) problems.push('full job description missing or too short for reliable comparison');

    // Do not pass malformed records into the underlying evaluator.
    const result = problems.some(p=>p.startsWith('missing job title') || p.startsWith('missing valid'))
      ? { ...job, status:'needs_review', score:0, reasons:[], evidence_matches:[], evidence_coverage_count:0 }
      : evaluator(job);
    if (result.status !== 'shortlisted') problems.push(...(result.reasons || ['eligibility or role matching requires review']));
    if (!result.evidence_coverage_count) problems.push('no candidate evidence linked to posting requirements');

    const decision = problems.length ? 'needs_review' : 'recommend';
    records.push({
      ...result,
      input_position:index+1,
      decision,
      review_reasons:[...new Set(problems)],
      application_status:'not_confirmed',
      outreach_status:'not_started'
    });
  }
  const rank = (a,b) => (Number(b.score)||0)-(Number(a.score)||0);
  const eligible = records.filter(x=>x.decision==='recommend').sort(rank);
  const recommended=eligible.slice(0,limit);
  const overflow=eligible.slice(limit).map(x=>({...x,decision:'reserve',review_reasons:['Daily recommendation cap reached']}));
  const needs_review=records.filter(x=>x.decision==='needs_review').sort(rank);
  return {
    generated_at:new Date().toISOString(),
    supplied_count:postings.length,
    unique_count:records.length,
    duplicates_removed:duplicates,
    daily_limit:limit,
    recommended,
    reserve:overflow,
    needs_review,
    note:'Manual batch decision support only. All fit evidence is candidate-reported unless independently corroborated. No live posting verification, job application, LinkedIn action or recruiter outreach was performed.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [,,input,output] = process.argv;
  if (!input || !output) { console.error('Usage: node scripts/jobflow15-manual-batch.mjs jobs.json results.json');process.exit(2); }
  try {
    const results=assessManualBatch(JSON.parse(readFileSync(input,'utf8')));
    writeFileSync(output,JSON.stringify(results,null,2)+'\n',{mode:0o600});
    console.log(`Reviewed ${results.unique_count} unique postings: ${results.recommended.length} recommendations, ${results.needs_review.length} need review, ${results.reserve.length} reserve. No applications sent.`);
  } catch(err) { console.error(err.message);process.exitCode=1; }
}
