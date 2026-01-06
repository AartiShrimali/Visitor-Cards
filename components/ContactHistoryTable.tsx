
import React from 'react';
import { ContactData } from '../types';
import { Button } from './Button';

interface ContactHistoryTableProps {
  history: ContactData[];
  userEmail?: string;
  userName?: string;
}

export const ContactHistoryTable: React.FC<ContactHistoryTableProps> = ({ history, userEmail, userName }) => {

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
    link.setAttribute('download', `mccia_bizscan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emailHistory = () => {
    const subject = encodeURIComponent("Business Card Contacts - MCCIA BizScan Report");
    let body = "Hello,\n\nHere are the business contacts extracted using MCCIA BizScan:\n\n";
    
    history.forEach((c, i) => {
      body += `--- Contact ${i + 1} ---\n`;
      body += `Name: ${c.name || 'N/A'}\n`;
      body += `Company: ${c.company_name || 'N/A'}\n`;
      body += `Role: ${c.designation || 'N/A'}\n`;
      body += `Email: ${c.email_1 || 'N/A'}\n`;
      body += `Phone: ${c.phone_1 || 'N/A'}\n`;
      body += `Address: ${c.address || 'N/A'}\n\n`;
    });
    
    body += "\nSent via MCCIA APPLIED AI STUDIO BizScan Engine.";
    
    const mailtoLink = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-3 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-black text-[#003366] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Scanned Records
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{history.length} Saved Entries</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={emailHistory}
            variant="outline"
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider py-2 px-4 bg-slate-50 border-slate-200 text-[#003366] hover:bg-blue-50"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email Report
          </Button>

          <Button 
            onClick={downloadCSV}
            variant="outline"
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider py-2 px-4 bg-emerald-50 border-emerald-100 text-[#059669] hover:bg-emerald-100"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" /></svg>
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Company</th>
              <th scope="col" className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</th>
              <th scope="col" className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
              <th scope="col" className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {history.map((contact, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 align-top">
                  <div className="text-xs font-black text-[#003366]">{contact.name}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="text-[11px] font-bold text-slate-700">{contact.company_name}</div>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">{contact.designation}</span>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="text-[10px] text-slate-600 space-y-0.5">
                    <div className="font-bold">{contact.email_1}</div>
                    <div className="text-slate-400">{contact.phone_1}</div>
                  </div>
                </td>
                <td className="px-4 py-4 align-top max-w-[150px]">
                   <p className="text-[10px] text-slate-400 line-clamp-1 italic">{contact.address}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
