# JobFlow 15: Manual daily job batches and recruiter outreach

**Operating agreement:** The candidate supplies approximately 20 to 30 vacancies per day. Assess those postings and recommend **at most 15**, with fewer if the evidence does not support 15 good matches. No automatic vacancy search is required. No application, LinkedIn interaction, or message is sent by this software.

**Privacy:** Candidate profiles, evidence, outreach records, and posting dumps belong in ignored local files. Do not commit `config/profile.yml`, `modes/_custom.md`, `data/jobflow15-evidence.json`, daily vacancy dumps, or recruiter details to the public repository. Matching loads evidence from `CAREER_OPS_EVIDENCE_PATH` or `data/jobflow15-evidence.json`; missing evidence produces zero matches, never invented claims.

## Candidate-controlled daily cycle

1. Supply the day's ~20 to 30 job links with the actual job description when possible. Screenshots and pasted text can be evaluated in chat; the CLI accepts structured JSON arrays of objects with `title`, `company`, `url`, `location`, and `description`. Optional fields include `requisition_id` and `requirements`.
2. Evaluate the batch using `node scripts/jobflow15-manual-batch.mjs data/today-jobs.json data/jobflow15-daily.json`.
3. Review `recommended` (maximum 15), `needs_review`, and `reserve`. Recommendation requires a full description, relevant candidate evidence, and an initial eligibility check. This is a heuristic decision, not a verified employer ATS score or application receipt.
4. For recommended vacancies, check the original posting is live, confirm all mandatory qualifications, and manually review a tailored resume and cover letter.
5. Research a relevant public LinkedIn recruiter or hiring manager profile and check their present employer and association with this role. Do not infer the recruiter owns the role merely from their title.
6. Submit each application only with candidate action/approval. Following confirmed submission, draft and manually send a genuine, personalized LinkedIn note. Never mass-like, mass-comment, or automatically message contacts.
7. Privately record what was submitted, whom you contacted, replies, and follow-ups. No recruiter contact is required for a role to be recommended.

## Private evidence format

Provide candidate-approved information locally as `data/jobflow15-evidence.json`, for example:

```json
[
  {"id":"ehr-example","source":"candidate","kind":"experience","label":"Documented EHR work","terms":["EHR","Epic"]},
  {"id":"sql-example","source":"candidate","kind":"credential","label":"SQL assessment","terms":["SQL"]}
]
```

These are illustrative entries, not claims about the candidate. The evidence matcher returns matched terms and source labels, but does not independently validate them. The candidate should confirm substantive claims before including them in applications.

## Optional local CLI and existing Career Ops integration

The historical scanner and `scripts/jobflow30-shortlist.mjs` remain available as optional tools, but **they are not the default for the manual daily batch workflow**.

```sh
node scripts/jobflow15-manual-batch.mjs data/today-jobs.json data/jobflow15-daily.json
node scripts/jobflow15-research.mjs data/jobflow15-daily.json data/jobflow15-research.json
node scripts/jobflow15-outreach.mjs list
```

The recruiter research script accepts both manual `recommended` lists and legacy `shortlisted` lists. It generates search leads only and does not access LinkedIn profiles.

The optional existing scanner path is:

```sh
node scan.mjs
node scripts/jobflow30-shortlist.mjs --pipeline data/pipeline.md data/jobflow15-queue.json
node scripts/jobflow15-enrich.mjs data/jobflow15-queue.json data/jobflow15-enriched.json
node scripts/jobflow15-research.mjs data/jobflow15-enriched.json data/jobflow15-research.json
```

A LinkedIn public search link is not proof of recruiter identification. All outreach remains manual.

## Validation

```sh
node --test tests/jobflow*.test.mjs
```

The dedicated CI workflow also runs syntax checks. Do not merge until the **latest commit** has passed the relevant checks. Repository-wide security and dependency failures must be resolved or appropriately assessed. No live job application, LinkedIn message, or real vacancy evaluation is performed by the tests.
