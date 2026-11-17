# JobFlow 30 search and review rules

## Daily goal
- Target up to 30 *qualified, verified* applications per workday; do not equate discovered jobs or drafted applications with submissions.
- Prioritize suitability over volume. Do not invent vacancies, qualifications, experience, salary, or submitted status.
- Use existing Career Ops discovery, evaluation, preparation, and tracker mechanisms before adding new infrastructure.

## Geography
- Search US-wide remote roles and on-site or hybrid roles physically located in Chicago, Illinois.
- Exclude Chicago suburbs by default.
- A US-remote label does not prove international remote eligibility. Flag US residency, state restrictions, timezone, payroll, and work-authorization requirements.
- Candidate identifies Chicago, Illinois as their permanent home and expects to return to Chicago soon. Current physical presence outside Chicago is temporary; the exact return date is not yet confirmed.
- Prioritize Chicago on-site/hybrid opportunities and US remote jobs compatible with a Chicago-based employee. Do not reject an otherwise suitable Chicago job solely because the candidate has not yet returned.
- Do not state that the candidate is already physically in Chicago or available to start on-site immediately. Flag start dates requiring confirmation.
- Candidate confirms authorization to work in the United States without employer visa sponsorship now or in the future. Do not publish citizenship details or answer unrelated self-identification questions without review.
- Candidate confirms availability for on-site and hybrid Chicago work starting in December 2026. Exact day is not confirmed; do not assert December 1 or an earlier start. For roles needing a precise start date, request confirmation.

## Education and job families
- Candidate-reported education: bachelor's degree in Healthcare Administration and master's degree in Information Technology specializing in Software Engineering.
- Search healthcare IT, clinical systems, EHR/EMR applications, software engineering, healthcare data analytics, business intelligence, systems/business analysis, application support, healthcare operations, revenue cycle, health-tech implementation and technical customer success.
- Consider adjacent jobs that accept either degree and weigh transferable healthcare/technical expertise. Do not require programming for healthcare operations roles.
- Exclude senior/lead/manager roles when minimum experience is not evidenced; do not treat degrees alone as proof of years of experience.

## Review and status
- Check hard requirements first, including location, work authorization, mandatory certifications, and years of experience.
- Rank remaining jobs using: technical skills 30%, relevant experience/responsibilities 25%, education fit 20%, location fit 15%, career progression/compensation 10%. These are internal heuristics, not employer ATS scores.
- Deduplicate by employer, requisition ID and canonical URL. Verify that postings are live.
- Prepare truthful ATS-friendly documents from verified CV facts. Ask before answering sensitive self-identification or authorization questions.
- Never auto-submit by default. Candidate reviews and presses Submit. Mark 'applied' only with user confirmation or a verifiable submission receipt.
- Track discovered, shortlisted, preparing, ready for review, applied, interviewing, rejected, offer, and withdrawn separately.
- Keep resumes, contact details, application answers, emails, tokens, and tracker records out of this public repository. Store user data in a local private data root.
- Write in concise professional English, with no em dashes or ellipses.

## LinkedIn-assisted matching and evidence
- Candidate LinkedIn profile: https://www.linkedin.com/in/emmanuel-g-c-emmanuelokeke-m-s-b1424825b
- Use LinkedIn's Experience, Education, Skills, and Projects sections as a cross-check against the user-approved CV and GitHub evidence, not as independently verified employment history.
- Require user-supplied LinkedIn export or confirmed profile text for comprehensive analysis; a public profile URL alone is insufficient evidence of dates, duties, skills, and achievements.
- Record discrepancies in employer names, titles, dates, degree names, and skills for candidate review. Never silently resolve a discrepancy by inventing a fact.
- Mark each matching signal as supported by CV, supported by LinkedIn, supported by GitHub, or unverified. Treat LinkedIn-only assertions as self-reported until corroborated.
- Do not scrape LinkedIn behind authentication, bypass access controls, or automatically publish profile exports or personal history to this public repository.
- The repository's linkedin-import.mjs imports LinkedIn *job alerts*, not candidate profile history. Do not treat it as a profile verifier.
