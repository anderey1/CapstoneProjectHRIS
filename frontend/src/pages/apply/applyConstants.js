export const POSITIONS = [
  'Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II', 'SPED Teacher I',
  'Administrative Officer I', 'Administrative Officer II', 'Administrative Assistant I', 'Administrative Assistant II',
  'Registrar I', 'Accountant I', 'School Principal I'
];

export const SECTIONS = [
  {
    id: 'personal',
    title: 'Personal Documents',
    fields: [
      {
        key: 'letter_of_intent',
        name: 'Letter of Intent',
        description: 'Addressed to SUSAN D. ORBIANA, Schools Division Superintendent, Division of Lucena City.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'pds_file',
        name: 'Personal Data Sheet (PDS)',
        description: 'Duly accomplished and notarized. Include Current and Revised 2025 PDS.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'resume',
        name: 'Resume / CV',
        description: 'Your updated Curriculum Vitae or Resume.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional.'
      }
    ]
  },
  {
    id: 'professional',
    title: 'Professional Credentials',
    fields: [
      {
        key: 'prc_documents',
        name: 'PRC Documents',
        description: 'Photocopy of Professional Regulation Commission (PRC) ID and/or License.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if not applicable.'
      },
      {
        key: 'eligibility_certificate',
        name: 'Eligibility Certificate',
        description: 'Photocopy of Certificate of Eligibility or Report of Rating.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'tor',
        name: 'Transcript of Records (TOR)',
        description: 'Include completion of graduate and post-graduate units/degrees if applicable.',
        mandatory: true,
        multiple: false
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment Records',
    fields: [
      {
        key: 'employment_documents',
        name: 'Employment Documents',
        description: 'Upload any of the following: Certificate of Employment, Contract of Service, or Service Record.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'latest_appointment',
        name: 'Latest Appointment',
        description: 'Copy of your latest appointment.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'performance_rating',
        name: 'Performance Rating',
        description: 'Latest available period. Must cover one year of performance in the current/latest position.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      }
    ]
  },
  {
    id: 'supporting',
    title: 'Supporting Documents',
    fields: [
      {
        key: 'certificates_of_training',
        name: 'Certificates of Training',
        description: 'Upload one or more training certificates.',
        mandatory: false,
        multiple: true
      },
      {
        key: 'specialized_training',
        name: 'Specialized Training Certificates',
        description: 'Upload specialized training certificates. Multiple uploads allowed.',
        mandatory: false,
        multiple: true
      }
    ]
  },
  {
    id: 'forms',
    title: 'Required Forms',
    fields: [
      {
        key: 'checklist',
        name: 'Checklist of Requirements',
        description: 'Duly signed Checklist of Requirements.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'omnibus',
        name: 'Omnibus Sworn Statement',
        description: 'Omnibus Sworn Statement.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'cav',
        name: 'Certification on the Authenticity and Veracity (CAV)',
        description: 'Certification on the Authenticity and Veracity (CAV) of submitted documents.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'privacy_consent',
        name: 'Data Privacy Consent Form',
        description: 'Signed Data Privacy Consent Form.',
        mandatory: true,
        multiple: false
      }
    ]
  }
];

export const INITIAL_FILES = {
  letter_of_intent: null,
  pds_file: null,
  resume: null,
  prc_documents: null,
  eligibility_certificate: null,
  tor: null,
  certificates_of_training: [],
  employment_documents: null,
  latest_appointment: null,
  performance_rating: null,
  specialized_training: [],
  checklist: null,
  omnibus: null,
  cav: null,
  privacy_consent: null
};
