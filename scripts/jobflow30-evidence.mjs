// Evidence is private candidate-owned data and must never be committed.
// Provide CAREER_OPS_EVIDENCE_PATH or data/jobflow15-evidence.json locally.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const normalize = s => String(s ?? '').toLowerCase().replace(/[-_/]/g,' ').replace(/\s+/g,' ').trim();
function wordsMatch(haystack, needle) {
  const term = normalize(needle);
  if (!term) return false;
  const text = ' '+haystack.replace(/[^a-z0-9]+/g,' ')+' ';
  return text.includes(' '+term.replace(/[^a-z0-9]+/g,' ')+' ');
}
export function loadEvidence(path = process.env.CAREER_OPS_EVIDENCE_PATH || 'data/jobflow15-evidence.json') {
  try {
    const source = JSON.parse(readFileSync(resolve(path),'utf8'));
    if (!Array.isArray(source) || source.length > 1000) throw new Error('Evidence must be an array of at most 1000 items');
    return source.filter(x=>x && typeof x.id==='string' && typeof x.label==='string' && Array.isArray(x.terms) && x.terms.every(t=>typeof t==='string'));
  } catch(err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
export function matchEvidence(job, entries = loadEvidence()) {
  const text = normalize([job.title, job.description, ...(Array.isArray(job.requirements) ? job.requirements : [])].join(' '));
  const matched = entries.map(item=>({...item,matched_terms:item.terms.filter(term=>wordsMatch(text,term))})).filter(item=>item.matched_terms.length);
  const unique = [...new Set(matched.flatMap(item=>item.matched_terms))];
  return {
    evidence_matches:matched.map(({id,source,kind,label,matched_terms})=>({id,source,kind,label,matched_terms})),
    matched_skills:unique,
    evidence_coverage_count:unique.length,
    limitations:['Evidence is candidate-reported unless independently verified.','Term matches do not establish proficiency or duration.','Check mandatory requirements against the original job description.']
  };
}
