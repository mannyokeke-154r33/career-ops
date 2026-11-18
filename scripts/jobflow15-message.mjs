// Deterministic draft only. User must verify and send manually.
const clean = (value, max = 160) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0,max);
export function draftRecruiterMessage(job, contact = {}) {
  const title = clean(job.title);
  const company = clean(job.company);
  if (!title || !company) throw new Error('Job title and company are required');
  if (job.application_status !== 'applied') throw new Error('Confirm application submission before drafting a post-application message');
  const name = clean(contact.first_name || contact.name);
  const greeting = name ? 'Hi '+name.split(' ')[0]+',' : 'Hello,';
  const proof = clean(job.relevant_experience,220);
  const interest = clean(job.specific_interest,220);
  const parts = [
    greeting,
    'I recently applied for the '+title+' position at '+company+' and wanted to introduce myself.',
    proof ? 'My experience includes '+proof+'.' : 'My background combines information technology, software engineering studies, and healthcare operations.',
    interest ? 'I was particularly interested in '+interest+'.' : '',
    'I would welcome the opportunity to learn more about the team and how I could contribute. Thank you for your consideration.'
  ].filter(Boolean);
  return { draft: parts.join('\n\n'), warnings: [
    'Verify the contact is relevant to this requisition.',
    'Check all experience claims and the job-specific detail before sending.',
    'No LinkedIn interaction or message was sent.'
  ] };
}
