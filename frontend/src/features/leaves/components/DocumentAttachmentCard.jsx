import React from 'react';
import { FileText } from 'lucide-react';

export const CSC_DOCUMENT_SPECS = [
  { key: 'supporting_document', title: 'Supporting Attachment', subtitle: 'CSC Form 6 Requirement', color: 'primary' },
  { key: 'travel_authority_document', title: 'Travel Authority', subtitle: 'Required for Travel Abroad / 30+ Days', color: 'secondary' },
  { key: 'clearance_document', title: 'Clearance Document', subtitle: 'Required for Travel Abroad / 30+ Days', color: 'accent' },
  { key: 'maternity_notice_allocation', title: 'Notice of Allocation (CS Form 6a)', subtitle: 'Maternity Leave Requirement', color: 'primary' },
  { key: 'paternity_marriage_contract', title: 'Marriage Contract', subtitle: 'Paternity Leave Requirement', color: 'primary' },
  { key: 'vawc_medical_cert', title: 'Medical Certificate', subtitle: 'VAWC Leave Requirement', color: 'primary' },
  { key: 'rehab_letter_request', title: 'Letter Request', subtitle: 'Rehabilitation Privilege Requirement', color: 'primary' },
  { key: 'rehab_police_report', title: 'Police Report', subtitle: 'Rehabilitation Privilege Requirement', color: 'primary' },
  { key: 'rehab_concurrence', title: 'Written Concurrence of Govt Physician', subtitle: 'Rehabilitation Privilege Requirement', color: 'primary' },
  { key: 'women_special_histopath', title: 'Histopathology Report', subtitle: 'Women Special Benefit Requirement', color: 'primary' },
  { key: 'women_special_operative_technique', title: 'Operative Technique', subtitle: 'Women Special Benefit Requirement', color: 'primary' },
];

const COLOR_MAP = {
  primary: {
    wrapper: 'bg-primary/5 border-primary/20 hover:bg-primary/10',
    iconBox: 'text-primary border-primary/10',
    label: 'text-primary',
    btn: 'border-primary bg-primary text-white hover:bg-secondary',
  },
  secondary: {
    wrapper: 'bg-secondary/5 border-secondary/20 hover:bg-secondary/10',
    iconBox: 'text-secondary border-secondary/10',
    label: 'text-secondary',
    btn: 'border-secondary bg-secondary text-white hover:bg-primary',
  },
  accent: {
    wrapper: 'bg-accent/5 border-accent/20 hover:bg-accent/10',
    iconBox: 'text-amber-800 border-amber-200',
    label: 'text-amber-900',
    btn: 'border-amber-300 bg-accent text-slate-900 hover:bg-amber-300',
  },
};

export const DocumentAttachmentCard = ({ title, subtitle, fileUrl, color = 'primary' }) => {
  const style = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className={`flex flex-col justify-between gap-3 rounded border p-3 sm:flex-row sm:items-center ${style.wrapper}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-white ${style.iconBox}`}>
          <FileText className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${style.label}`}>{title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
        </div>
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded border px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${style.btn}`}
      >
        Open Document
      </a>
    </div>
  );
};

export default DocumentAttachmentCard;
