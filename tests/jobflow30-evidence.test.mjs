import test from 'node:test';
import assert from 'node:assert/strict';
import { matchEvidence } from '../scripts/jobflow30-evidence.mjs';

const entries = [
  {id:'cpp',source:'synthetic',kind:'experience',label:'C++ work',terms:['C++']},
  {id:'csharp',source:'synthetic',kind:'experience',label:'C# work',terms:['C#']},
  {id:'node',source:'synthetic',kind:'experience',label:'Node.js work',terms:['Node.js']},
  {id:'sql',source:'synthetic',kind:'credential',label:'SQL assessment',terms:['SQL']}
];

test('preserves punctuation when matching languages and frameworks', () => {
  const result = matchEvidence({description:'Work with C++, C# and Node.js'}, entries);
  assert.deepEqual(result.matched_skills, ['C++','C#','Node.js']);
});
test('does not confuse C programming with C++ or C#', () => {
  const result = matchEvidence({description:'Experience with C programming and web servers'}, entries);
  assert.equal(result.evidence_coverage_count, 0);
});
test('keeps whole-term matching for SQL', () => {
  const result = matchEvidence({description:'Requires SQL reporting'}, entries);
  assert.deepEqual(result.matched_skills, ['SQL']);
});
