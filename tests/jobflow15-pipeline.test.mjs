import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePipeline } from '../scripts/jobflow15-pipeline.mjs';
test('reads only pending scanner rows',()=>{
 const jobs=parsePipeline('# Jobs\n## Pending\n- [ ] https://example.org/1 | Example Health | Healthcare IT Analyst | Chicago, IL | posted: 2026-11-17\n## Processed\n- [ ] https://example.org/2 | Old | Software Engineer | Chicago, IL');
 assert.equal(jobs.length,1); assert.equal(jobs[0].location,'Chicago, IL');
});
test('does not mistake posted date for location',()=>{
 const jobs=parsePipeline('## Pending\n- [ ] https://example.org/1 | Example | Data Analyst | posted: 2026-11-17');
 assert.equal(jobs[0].location,'');
});
test('skips malformed rows and non-http URLs',()=>{
 assert.deepEqual(parsePipeline('## Pending\n- [ ] javascript:alert(1) | X | IT Analyst\n- [ ] https://example.org/1 | Missing'),[]);
});
