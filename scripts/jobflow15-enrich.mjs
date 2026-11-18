#!/usr/bin/env node
// Read-only JD enrichment through the existing Career Ops browser-extract.mjs.
// Usage: node scripts/jobflow15-enrich.mjs data/jobflow15-queue.json data/jobflow15-enriched.json
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { evaluate } from './jobflow30-shortlist.mjs';
import { fileURLToPath } from 'node:url';
import { isMainModule } from '../lib/is-main-module.mjs';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXTRACTOR = join(ROOT, 'browser-extract.mjs');
export function enrichOne(job, run = spawnSync) {
  if (!job || typeof job.url !== 'string' || !/^https?:\/\//i.test(job.url)) {
    return { ...job, jd_status:'invalid_url', jd_verified:false };
  }
  const result = run(process.execPath, [EXTRACTOR, job.url, '--mode', 'jd', '--max-chars', '12000', '--timeout', '15000'], { encoding:'utf8', timeout:22000, maxBuffer:1024*1024 });
  if (result.error || result.status !== 0) return { ...job, jd_status:'extraction_failed', jd_verified:false };
  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch { return { ...job, jd_status:'invalid_extractor_output', jd_verified:false }; }
  if (!parsed || typeof parsed.text !== 'string' || parsed.text.trim().length < 200) return { ...job, jd_status:'insufficient_text', jd_verified:false };
  // Extractor text is posting-page content, not independent verification of hiring requirements.
  return { ...job, description:parsed.text, jd_status:'extracted', jd_verified:false, jd_extracted_at:new Date().toISOString() };
}
export function enrichQueue(queue, run = spawnSync) {
  if (!queue || !Array.isArray(queue.shortlisted)) throw new TypeError('Expected shortlist output with shortlisted array');
  const evaluated = queue.shortlisted.map(job => {
    const enriched = enrichOne(job, run);
    if (enriched.jd_status !== 'extracted') {
      return { ...job, ...enriched, status:'needs_review', reasons:[...new Set([...(job.reasons || []), 'job description extraction unsuccessful'])] };
    }
    const scored = evaluate(enriched);
    return { ...scored, jd_status:enriched.jd_status, jd_verified:enriched.jd_verified, jd_extracted_at:enriched.jd_extracted_at };
  });
  return {
    ...queue,
    shortlisted:evaluated.filter(job=>job.status==='shortlisted').sort((a,b)=>b.score-a.score),
    needs_review:[...(queue.needs_review || []), ...evaluated.filter(job=>job.status==='needs_review')],
    note:'Read-only job description extraction. Failed or restricted postings move to needs_review; verify requirements and availability manually. No application or LinkedIn action performed.'
  };
}
if (isMainModule(import.meta.url)) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log("Usage: node scripts/jobflow15-enrich.mjs shortlist.json enriched.json");
    process.exit(0);
  }
  const [,,input,output] = process.argv;
  if (!input || !output) { console.error('Usage: node scripts/jobflow15-enrich.mjs shortlist.json enriched.json'); process.exit(2); }
  try {
    const enriched = enrichQueue(JSON.parse(readFileSync(input,'utf8')));
    writeFileSync(output,JSON.stringify(enriched,null,2)+'\n',{mode:0o600});
    console.log('Enriched '+enriched.shortlisted.length+' jobs. Review failures and verify job descriptions manually.');
  } catch(e) { console.error(e.message); process.exitCode=1; }
}
