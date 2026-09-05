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
    btn: 'btn-primary',
  },
  secondary: {
    wrapper: 'bg-secondary/5 border-secondary/20 hover:bg-secondary/10',
    iconBox: 'text-secondary border-secondary/10',
    label: 'text-secondary',
    btn: 'btn-secondary',
  },
  accent: {
    wrapper: 'bg-accent/5 border-accent/20 hover:bg-accent/10',
    iconBox: 'text-accent border-accent/10',
    label: 'text-accent',
    btn: 'btn-accent',
  },
};

export const DocumentAttachmentCard = ({ title, subtitle, fileUrl, color = 'primary' }) => {
  const style = COLOR_MAP[color] || COLOR_MAP.primary;
  return (
    <div className={`group relative p-4 border rounded-xl flex items-center justify-between transition-all ${style.wrapper}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border ${style.iconBox}`}>
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${style.label}`}>{title}</p>
          <p className="text-[9px] font-bold opacity-40 uppercase">{subtitle}</p>
        </div>
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`btn btn-sm rounded-lg font-black text-[9px] uppercase tracking-widest px-6 ${style.btn}`}
      >
        Open Document
      </a>
    </div>
  );
};

export default DocumentAttachmentCard;
