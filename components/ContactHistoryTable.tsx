
import React, { useState } from 'react';
import { ContactData } from '../types';
import { Button } from './Button';
import { sendHistoryEmail } from '../services/emailService';

interface ContactHistoryTableProps {
  history: ContactData[];
  userEmail?: string;
  userName?: string;
}

export const ContactHistoryTable: React.FC<ContactHistoryTableProps> = ({ history, userEmail, userName }) => {
  const [isSending, setIsSending] = useState(false);

  if (!history || history.length === 0) {
    return null;
  }

  const downloadCSV = () => {
    const headers = ["Name", "Company", "Role", "Email", "Phone", "Address"];
    const rows = history.map(contact => [
      `"${contact.name || ''}"`,
      `"${contact.company_name || ''}"`,
      `"${contact.designation || ''}"`,
      `"${contact.email_1 || ''}"`,
      `"${contact.phone_1 || ''}"`,
      `"${contact.address ? contact.address.replace(/\n/g, ' ') : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mccia_bizscan_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emailHistory = async () => {
    if (!userEmail || !userName) {
      alert("System identification error. Please refresh.");
      return;
    }

    setIsSending(true);
    try {
      await sendHistoryEmail(userEmail, userName, history);
      alert(`Report dispatched successfully to ${userEmail}.`);
    } catch (error) {
      console.error(error);
      alert("Email delivery failed. Verify configuration.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 gap-4 border-b border-slate-100">
        <div>
          <h3 className="text-2xl font-black text-[#003366] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            Scanned History
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-bold uppercase tracking-wider">SECURE ARCHIVE • {history.length} {history.length === 1 ? 'Record' : 'Records'}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={emailHistory}
            variant="outline"
            isLoading={isSending}
            className="flex-1 sm:flex-none text-xs font-black uppercase tracking-widest py-3 px-6 bg-slate-50 border-slate-200 text-[#003366] hover:bg-blue-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email Report
          </Button>

          <Button 
            onClick={downloadCSV}
            variant="outline"
            className="flex-1 sm:flex-none text-xs font-black uppercase tracking-widest py-3 px-6 bg-emerald-50 border-emerald-100 text-[#059669] hover:bg-emerald-100"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" /></svg>
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</th>
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Company / Brand</th>
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Designation</th>
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Channels</th>
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/4">Business Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {history.map((contact, index) => (
              <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-6 align-top">
                  <div className="text-sm font-black text-[#003366] group-hover:text-emerald-700 transition-colors">{contact.name}</div>
                </td>
                
                <td className="px-6 py-6 align-top">
                  <div className="text-sm font-bold text-slate-700">{contact.company_name}</div>
                </td>
                
                <td className="px-6 py-6 align-top">
                  {contact.designation && (
                    <span className="inline-flex text-[9px] font-black rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 uppercase tracking-widest shadow-sm">
                      {contact.designation}
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-6 align-top">
                  <div className="space-y-1.5">
                    {contact.email_1 && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                         <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         <span className="truncate max-w-[150px]">{contact.email_1}</span>
                      </div>
                    )}
                    {contact.phone_1 && (
                       <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 font-mono">
                         <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                         {contact.phone_1}
                       </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-6 align-top">
                   <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 italic" title={contact.address}>
                     {contact.address || '—'}
                   </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
