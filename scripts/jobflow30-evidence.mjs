// Candidate-reported evidence from supplied LinkedIn screenshots.
// Public-safe summaries only; no credential IDs, contact details, or private records.
export const evidence = [
  { id:'walden-ms', source:'linkedin_screenshot', kind:'education', label:'Walden University, MS Information Technology (Software Engineering specialization)', terms:['software engineering','information technology','object-oriented programming','etl'] },
  { id:'capella-bs', source:'user_confirmed_and_linkedin_screenshot', kind:'education', label:'Capella University, BS Healthcare Administration', terms:['healthcare administration','healthcare management','healthcare operations'] },
  { id:'school-it', source:'linkedin_screenshot', kind:'experience', label:'MEP Anuban Phatthalung School: IT Specialist, May 2026-present', terms:['it support','technical support','hardware','software troubleshooting','web platform','programming instruction'] },
  { id:'school-teaching', source:'linkedin_screenshot', kind:'experience', label:'MEP Anuban Phatthalung School: Technology and Mathematics Instructor, May 2026-present', terms:['training','teaching','mathematics','programming instruction'] },
  { id:'alignerr-ai', source:'linkedin_screenshot', kind:'experience', label:'Alignerr: freelance Generative AI Engineer, Dec 2025-present', terms:['llm evaluation','prompt engineering','rlhf','data annotation','ai evaluation','healthcare ai'] },
  { id:'pharmacy', source:'linkedin_screenshot', kind:'experience', label:'IDHS Chicago READ MHC: Pharmacy Technician, Jan 2024-Jun 2026', terms:['epic','ehr','emr','hipaa','pharmacy','medication management','healthcare data','data entry'] },
  { id:'techhub', source:'linkedin_screenshot', kind:'experience', label:'TechHub Campus Repair: IT Support Assistant, Apr 2022-Aug 2025', terms:['python','automation','troubleshooting','technical support','system health checks','software installation'] },
  { id:'galvani', source:'linkedin_screenshot', kind:'experience', label:'Galvani Capital: IT Assistant, Jun 2019-Jun 2023', terms:['help desk','it support','data maintenance','system configuration','documentation','technical support'] },
  { id:'hackerrank-sql', source:'linkedin_screenshot', kind:'credential', label:'HackerRank SQL (Advanced) and SQL (Basic)', terms:['sql','mysql'] },
  { id:'hackerrank-api', source:'linkedin_screenshot', kind:'credential', label:'HackerRank REST API', terms:['rest api','api integration'] },
  { id:'hackerrank-python', source:'linkedin_screenshot', kind:'credential', label:'HackerRank Introduction to Programming Using Python', terms:['python'] },
  { id:'fortinet', source:'linkedin_screenshot', kind:'training', label:'Fortinet introductory firewall, cybersecurity and cloud courses', terms:['cybersecurity fundamentals','cloud fundamentals','firewall fundamentals'] },
  { id:'anthropic', source:'linkedin_screenshot', kind:'training', label:'Anthropic Claude Code 101 and AI Fluency courses', terms:['claude code','ai tools','generative ai'] },
  { id:'aws-prompt', source:'linkedin_screenshot', kind:'training', label:'AWS Foundations of Prompt Engineering course', terms:['prompt engineering'] }
];
const normalize = s => String(s ?? '').toLowerCase().replace(/[-_/]/g,' ').replace(/\s+/g,' ').trim();
const includesTerm = (text, term) => new RegExp('(^|[^a-z0-9])'+normalize(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^a-z0-9])').test(text);
export function matchEvidence(job) {
  const text = normalize([job.title, job.description, ...(Array.isArray(job.requirements)?job.requirements:[])].join(' '));
  const matched = evidence.map(item => ({ ...item, matched_terms:item.terms.filter(t=>includesTerm(text,t)) })).filter(item=>item.matched_terms.length);
  const unique = [...new Set(matched.flatMap(item=>item.matched_terms))];
  return {
    evidence_matches:matched.map(({id,source,kind,label,matched_terms})=>({id,source,kind,label,matched_terms})),
    matched_skills:unique,
    evidence_coverage_count:unique.length,
    limitations:['Candidate-reported LinkedIn screenshots are not independent employer or issuer verification.','Keyword overlap does not establish years of experience or proficiency.','Unspecified mandatory requirements must be checked against the original posting.']
  };
}
