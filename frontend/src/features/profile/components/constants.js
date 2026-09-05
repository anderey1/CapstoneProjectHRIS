import { 
  User, Users, GraduationCap, Award, History, Fingerprint, FileText 
} from 'lucide-react';

export const TABS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'family', label: 'Family Background', icon: Users },
  { id: 'education', label: 'Educational Background', icon: GraduationCap },
  { id: 'eligibility', label: 'Eligibility', icon: Award },
  { id: 'work', label: 'Work Experience', icon: History },
  { id: 'ids', label: 'Verified IDs', icon: Fingerprint },
  { id: 'documents', label: 'Required Documents', icon: FileText }
];

export const REQUIRED_DOCS_LIST = [
  { key: 'letter_of_intent', name: 'Letter of Intent', description: 'Addressed to Schools Division Superintendent Susan D. Orbiana.', mandatory: true },
  { key: 'pds_file', name: 'Personal Data Sheet (PDS)', description: 'Duly accomplished and notarized Current/Revised 2025 PDS.', mandatory: true },
  { key: 'tor', name: 'Transcript of Records (TOR)', description: 'Complete academic records including graduate/post-graduate units.', mandatory: true },
  { key: 'checklist', name: 'Checklist of Requirements', description: 'Duly signed Checklist of Requirements.', mandatory: true },
  { key: 'omnibus', name: 'Omnibus Sworn Statement', description: 'Notarized Omnibus Sworn Statement.', mandatory: true },
  { key: 'cav', name: 'Certification on the Authenticity (CAV)', description: 'CAV of submitted school documents.', mandatory: true },
  { key: 'privacy_consent', name: 'Data Privacy Consent Form', description: 'Signed Data Privacy Consent Form.', mandatory: true },
  { key: 'prc_documents', name: 'PRC ID / License', description: 'Photocopy of Professional Regulation Commission ID/License (if applicable).', mandatory: false },
  { key: 'eligibility_certificate', name: 'Eligibility Certificate', description: 'Photocopy of rating or certificate (if applicable).', mandatory: false },
  { key: 'employment_documents', name: 'Employment Documents', description: 'Service Record or Certificate of Employment.', mandatory: false },
  { key: 'latest_appointment', name: 'Latest Appointment', description: 'Copy of latest employment appointment.', mandatory: false },
  { key: 'performance_rating', name: 'Performance Rating', description: 'Performance rating for the latest period (if applicable).', mandatory: false },
  { key: 'certificates_of_training', name: 'Certificates of Training', description: 'Completed training certificates.', mandatory: false },
  { key: 'specialized_training', name: 'Specialized Training', description: 'Specialized training credentials.', mandatory: false }
];

export const GOVERNMENT_IDS_LIST = [
  { id: 'umid_id', label: 'UMID Card', desc: 'Unified Multi-Purpose ID' },
  { id: 'pagibig_id', label: 'Pag-IBIG ID', desc: 'HDMF Pag-IBIG Membership Card' },
  { id: 'philhealth_no', label: 'PhilHealth Member ID', desc: 'PhilHealth Identification Card' },
  { id: 'philsys_id', label: 'National ID (PhilSys)', desc: 'Philippine Identification System Card' },
  { id: 'tin_no', label: 'TIN / BIR ID', desc: 'Taxpayer Identification Number ID' },
  { id: 'agency_employee_no', label: 'Agency Employee ID', desc: 'DepEd Official Employee ID Card' }
];
