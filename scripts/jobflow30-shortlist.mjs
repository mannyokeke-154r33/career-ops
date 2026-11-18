#!/usr/bin/env node
// JobFlow 15 conservative shortlist. The daily manual batch is the default workflow.
// Legacy script path is retained for existing CLI integrations.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { matchEvidence } from './jobflow30-evidence.mjs';
import { readPipeline } from './jobflow15-pipeline.mjs';

// Job-family scores are triage priorities, NOT employment probabilities.
const ROLE_FAMILIES = [
  { name:'Healthcare IT and Clinical Systems', pattern:/\b(?:healthcare IT|clinical (?:systems|applications?|informatics)|EHR|EMR|Epic (?:analyst|support|application)|health(?:care)? informatics)\b/i, score:45 },
  { name:'IT Applications and Support', pattern:/\b(?:application (?:support|analyst|specialist)|technical support|IT support|help ?desk|service desk|desktop support|IT operations|systems administrator)\b/i, score:42 },
  { name:'Healthcare Data and Business Analytics', pattern:/\b(?:healthcare data|clinical data|data analyst|business intelligence|BI analyst|reporting analyst|revenue cycle|quality improvement)\b/i, score:43 },
  { name:'Software and API Engineering', pattern:/\b(?:software (?:engineer|developer)|backend|front.?end|full.?stack|API (?:engineer|developer)|integration (?:engineer|developer))\b/i, score:41 },
  { name:'Business and Systems Analysis', pattern:/\b(?:business (?:systems? )?analyst|systems analyst|implementation (?:analyst|specialist|consultant)|technical (?:customer success|implementation))\b/i, score:40 },
  { name:'AI Evaluation and Operations', pattern:/\b(?:AI (?:evaluator|evaluation|quality|trainer)|LLM (?:evaluator|evaluation)|data annotat(?:ion|or)|prompt engineer)\b/i, score:38 },
  { name:'Healthcare Operations and Administration', pattern:/\b(?:healthcare operations|healthcare administration|health services analyst|pharmacy operations|clinical operations)\b/i, score:38 }
];
const SENIOR_TITLE = /\b(?:senior|sr\.?|staff|principal|director|vice president|vp|chief|head of)\b/i;
const normalize = value => String(value ?? '').trim().toLowerCase();
const termsFor = text => String(text ?? '');
const residency = d => d.match(/\b(?:remote only in|residents of|must reside in|based in|remote positions available in)\s+([^.;\n]{1,120})/i)?.[1] ?? '';

function evidenceValue(match) {
  switch(match.kind) {
    case 'experience': return 12;
    case 'education': return 9;
    case 'credential': return 8;
    case 'training': return 4;
    default: return 6;
  }
}

export function evaluate(job, evidenceEntries) {
  const title = termsFor(job.title);
  const location = termsFor(job.location);
  const description = termsFor(job.description);
  const remote = /\bremote\b/i.test(location) || job.remote === true;
  // An address in Chicago Heights, Chicago Ridge, or a metro-area label is
  // not proof the workplace is physically inside the City of Chicago.
  const chicagoCity = /\bchicago\s*,\s*(?:IL|Illinois)\b/i.test(location) ||
    /\bchicago\s*\(\s*(?:IL|Illinois)\s*\)/i.test(location);
  const uncertainChicago = /\b(?:chicagoland|chicago\s+(?:heights|ridge|park|metro|metropolitan|suburbs?|area)|greater\s+chicago)\b/i.test(location);
  const chicago = chicagoCity && !uncertainChicago;
  const usRemote = remote && (chicago || /\b(?:united states|usa|u\.s\.|nationwide|illinois|IL)\b/i.test(location));
  const restriction = residency(description);
  const remoteRestricted = Boolean(remote && restriction && !/\b(?:illinois|IL)\b/i.test(restriction));
  const illinoisExcluded = remote && /\b(?:except|exclude(?:s|d|ing)?|not available in|not hiring in|cannot work from|not eligible in)\s+(?:the state of\s+)?(?:illinois|IL)\b/i.test(location+' '+description);
  const role = ROLE_FAMILIES.find(family => family.pattern.test(title));
  const reasons = [];
  if (!title || !job.url || !job.company) reasons.push('missing job identity');
  if (SENIOR_TITLE.test(title)) reasons.push('senior leadership title');
  if (!remote && uncertainChicago) reasons.push('Chicago city location requires verification');
  else if (!remote && !chicago) reasons.push('not Chicago on-site/hybrid');
  if (remote && !usRemote) reasons.push('Illinois remote eligibility unverified');
  if (remoteRestricted) reasons.push('remote residency restriction requires review');
  if (illinoisExcluded) reasons.push('Illinois explicitly excluded from remote location');
  if (/\b(?:active|current)\s+(?:RN|registered nurse)\s+(?:license|licensure)\s+(?:is\s+)?required\b/i.test(description)
    || /\b(?:Epic certification|PMP certification|security clearance)\s+(?:is\s+)?required\b/i.test(description)) {
    reasons.push('mandatory credential or clearance requires confirmation');
  }
  if (!role) reasons.push('job family match unverified');

  const evidence = matchEvidence(job, evidenceEntries);
  const experienceFit = Math.min(35, evidence.evidence_matches.reduce((sum, match) => sum + evidenceValue(match), 0));
  const roleFit = role?.score ?? 0;
  const locationFit = (chicago || usRemote) && !remoteRestricted && !illinoisExcluded ? 15 : 0;
  const score = Math.min(100, roleFit + locationFit + experienceFit);
  const status = reasons.length ? 'needs_review' : 'shortlisted';

  return {
    ...job, score, status, reasons,
    role_family:role?.name ?? null,
    score_breakdown:{role_alignment:roleFit, location_alignment:locationFit, evidence_alignment:experienceFit},
    outreach:{
      recruiter_lookup:'not_started',
      recruiter_profile_url:null,
      recruiter_role_confirmed:false,
      interaction_opportunity:null,
      application_confirmed:false,
      message_status:'not_drafted',
      message_sent_at:null, reply_status:'none', follow_up_due:null
    },
    ...evidence
  };
}

export function shortlist(jobs, limit = 15) {
  if (!Array.isArray(jobs)) throw new TypeError('Expected JSON array of jobs');
  if (!Number.isInteger(limit) || limit < 1 || limit > 15) throw new RangeError('Limit must be 1 through 15');
  const seen = new Set();
  const evaluated = jobs.map(evaluate).filter(job => {
    const key = [normalize(job.company), normalize(job.requisition_id || job.id || job.url)].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a,b) => (a.status === 'shortlisted' ? 0 : 1)-(b.status === 'shortlisted' ? 0 : 1) || b.score-a.score);
  return {
    generated_at:new Date().toISOString(),
    target:limit,
    shortlisted:evaluated.filter(job=>job.status==='shortlisted').slice(0,limit),
    needs_review:evaluated.filter(job=>job.status==='needs_review'),
    note:'Preliminary job matching only. Human review is required; no applications or LinkedIn actions were performed.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [,,input,output] = process.argv;
  if (!input) {console.error('Usage: node scripts/jobflow30-shortlist.mjs jobs.json [queue.json] | --pipeline data/pipeline.md [queue.json]');process.exit(2);}
  const pipelineMode = input === '--pipeline';
  const source = pipelineMode ? output : input;
  const destination = pipelineMode ? process.argv[4] : output;
  if (!source) {console.error('Missing pipeline path');process.exit(2);}
  const data = shortlist(pipelineMode ? readPipeline(source) : JSON.parse(readFileSync(source,'utf8')));
  const result = JSON.stringify(data,null,2)+'\n';
  if (destination) writeFileSync(destination,result,{mode:0o600});
  else process.stdout.write(result);
}
