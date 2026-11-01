export const LEAVE_TYPES = [
  ['vacation', 'Vacation leave'], ['forced', 'Mandatory / Forced leave'], ['sick', 'Sick leave'],
  ['maternity', 'Maternity leave'], ['paternity', 'Paternity leave'],
  ['special_privilege', 'Special privilege leave'], ['solo_parent', 'Solo parent leave'],
  ['study', 'Study leave'], ['vawc', 'VAWC leave'], ['rehabilitation', 'Rehabilitation privilege'],
  ['women_special', 'Special leave benefits for women'], ['emergency', 'Special emergency / Calamity leave'],
  ['adoption', 'Adoption leave'], ['others', 'Other leave'],
];

// These requirements mirror the validations in core/views/leave.py.
export function getLeaveDocuments(type, days, withinPhilippines) {
  const documents = [{ name: 'supporting_document', label: 'Supporting document', required: false, help: 'Attach a document that supports your application, if available.' }];
  const support = documents[0];
  const add = (name, label, help, required = true) => documents.push({ name, label, help, required });
  if (type === 'sick') {
    Object.assign(support, { label: 'Medical certificate', required: days > 5, help: days > 5 ? 'Required because this application exceeds 5 working days.' : 'Optional for applications of 5 working days or fewer.' });
  } else if (type === 'maternity') {
    Object.assign(support, { label: 'Proof of pregnancy', required: true, help: "Upload an ultrasound result or doctor's certificate." });
    add('maternity_notice_allocation', 'Notice of allocation (Form 6a)', 'Attach if you are allocating maternity leave credits.', false);
  } else if (type === 'paternity') {
    Object.assign(support, { label: "Proof of child's delivery", required: true, help: 'Upload a birth certificate or medical certificate.' });
    add('paternity_marriage_contract', 'Marriage contract', 'Attach the marriage contract.');
  } else if (type === 'vawc') {
    Object.assign(support, { label: 'Protection order or police report', required: true, help: 'Upload the BPO, TPO, PPO, or police report.' });
    add('vawc_medical_cert', 'Medical certificate', 'Attach the supporting medical certificate.');
  } else if (type === 'rehabilitation') {
    Object.assign(support, { label: 'Medical certificate', required: true, help: 'Attach the medical certificate for this application.' });
    add('rehab_letter_request', 'Letter of request', 'Attach your written request.');
    add('rehab_police_report', 'Police report', 'Attach the incident report.');
    add('rehab_concurrence', 'Government physician concurrence', 'Attach the government physician’s written concurrence.');
  } else if (type === 'women_special') {
    Object.assign(support, { label: 'Medical certificate / Clinical summary', required: true, help: 'Attach your medical certificate or clinical summary.' });
    add('women_special_histopath', 'Histopathology report', 'Attach the histopathology report.');
    add('women_special_operative_technique', 'Operative technique', 'Attach the operative technique report.');
  }
  if (['vacation', 'special_privilege'].includes(type) && (!withinPhilippines || days >= 30)) {
    add('travel_authority_document', 'Travel authority', 'Required for travel abroad or leave of 30 or more working days.');
    add('clearance_document', 'Clearance', 'Attach the clearance for this application.');
  }
  return documents;
}

export const localDateString = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function getMinimumLeaveDate(type) {
  const date = new Date();
  const offset = ['sick', 'emergency', 'rehabilitation'].includes(type) ? -30 : ['vacation', 'solo_parent'].includes(type) ? 5 : 0;
  date.setDate(date.getDate() + offset);
  return localDateString(date);
}

export function calendarDaysBetween(start, end) {
  if (!start || !end || start > end) return 0;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
}
