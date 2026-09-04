import React from 'react';
import { CalendarCheck, Clock } from 'lucide-react';

/**
 * LeaveBalanceCards
 * Displays the employee's current Vacation and Sick leave credits.
 */
const LeaveBalanceCards = ({ employee }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm group">
        <div>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Vacation Credits</p>
          <h2 className="text-5xl font-black text-primary flex items-baseline gap-2">
            {employee?.vacation_leave_balance || 0}
            <span className="text-[10px] opacity-30 tracking-widest uppercase">Days</span>
          </h2>
        </div>
        <CalendarCheck className="w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
      </div>

      <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm group">
        <div>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Sick Credits</p>
          <h2 className="text-5xl font-black text-secondary flex items-baseline gap-2">
            {employee?.sick_leave_balance || 0}
            <span className="text-[10px] opacity-30 tracking-widest uppercase">Days</span>
          </h2>
        </div>
        <Clock className="w-12 h-12 text-secondary/10 group-hover:text-secondary/20 transition-colors" />
      </div>
    </div>
  );
};

export default LeaveBalanceCards;
