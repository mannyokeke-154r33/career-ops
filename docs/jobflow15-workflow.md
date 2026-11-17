# JobFlow 15: Recruiter engagement workflow

This feature targets **up to 15 reviewed applications per day**. No application or LinkedIn action is automatic.

## Daily process

1. Run the existing Career Ops scanner: `node scan.mjs`. It writes new offers to `data/pipeline.md` in its Pending section.
2. Run `node scripts/jobflow30-shortlist.mjs --pipeline data/pipeline.md data/jobflow15-queue.json`. The legacy filename is retained for compatibility, but the default limit is 15. Alternatively provide a JSON array of jobs as the first argument. Scanner pipeline rows do not include full job descriptions, so verify qualifications manually before relying on evidence matches.
3. Verify the original posting, eligibility, relevant experience, and actual application requirements. Review the tailored resume and submit the application manually.
4. For each role, identify a recruiter or hiring manager using public professional information. Record whether their connection to the requisition is confirmed, possible, or unverified. Avoid assuming a contact owns a requisition based only on their title.
5. Look for a genuine role-related public interaction opportunity. Do not mass-like, comment, or connect automatically.
6. After confirming submission, draft a concise personal message with the exact role and one relevant evidence-backed experience example. Review and send manually.
7. Log outreach and follow-up. Do not claim a message was sent unless it was actually sent.

## Local tracker

All commands run from the repository root. Default storage: `data/jobflow15-outreach.json`, which is ignored by Git.

```sh
node scripts/jobflow15-outreach.mjs set acme-123 company "Acme"
node scripts/jobflow15-outreach.mjs set acme-123 title "Clinical Systems Analyst"
node scripts/jobflow15-outreach.mjs set acme-123 recruiter_url "https://www.linkedin.com/in/example"
node scripts/jobflow15-outreach.mjs set acme-123 recruiter_relevance possible
node scripts/jobflow15-outreach.mjs set acme-123 application_status applied
node scripts/jobflow15-outreach.mjs set acme-123 message_status drafted
node scripts/jobflow15-outreach.mjs list
```

Mark `message_status sent` only after actually sending the message. You may also record `message_sent_date`, `reply_status`, and `follow_up_date`. Dates are entered manually. This tool does not schedule reminders or message anyone.

## Test commands

```sh
node --test tests/jobflow30-shortlist.test.mjs tests/jobflow15-outreach.test.mjs tests/jobflow15-message.test.mjs tests/jobflow15-pipeline.test.mjs tests/jobflow15-enrich.test.mjs tests/jobflow15-recruiter-research.test.mjs tests/jobflow15-recruiter-research.test.mjs
```

The shortlist uses heuristic keyword and candidate-reported evidence matching, not verified hiring-manager ownership or an employer ATS score. A Pending-pipeline adapter is implemented, but scanner output does not include full descriptions and no end-to-end run has been verified. Manual LinkedIn-focused search links are generated, but no contact is automatically identified or verified. No LinkedIn recruiter lookup API, automatic application submission, or scheduled follow-up has been implemented yet.
