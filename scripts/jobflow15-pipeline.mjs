// Adapter for the existing scan.mjs Pending pipeline format.
// Scanner rows: - [ ] URL | company | title | location? | compensation? | posted: ...
import { readFileSync } from 'node:fs';
const safeUrl = s => { try { const u = new URL(s); return ['https:','http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
export function parsePipeline(text) {
  if (typeof text !== 'string') throw new TypeError('Pipeline must be text');
  let pending = false;
  const jobs = [];
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) { pending = /^pending\b/i.test(heading[1].trim()); continue; }
    if (!pending || !/^\s*- \[ \] /.test(line)) continue;
    const cells = line.replace(/^\s*- \[ \] /,'').split(/\s+\|\s+/).map(s=>s.trim());
    if (cells.length < 3) continue;
    const url = safeUrl(cells[0]);
    if (!url || !cells[1] || !cells[2]) continue;
    const optional = cells.slice(3);
    const location = optional.find(s=>!(/^(posted|trust|yrs|note):/i.test(s)) && !/^[\$€£]|\b(?:usd|hour|year|annum)\b/i.test(s)) || '';
    jobs.push({url,company:cells[1],title:cells[2],location,source:'career_ops_pipeline'});
  }
  return jobs;
}
export function readPipeline(path) { return parsePipeline(readFileSync(path,'utf8')); }
