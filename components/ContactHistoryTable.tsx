
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

  const formatTimestamp = (contact: ContactData) => {
    if (contact.createdAt?.toDate) return contact.createdAt.toDate().toLocaleString();
    if (contact.timestamp instanceof Date) return contact.timestamp.toLocaleString();
    if (typeof contact.timestamp === 'string') return new Date(contact.timestamp).toLocaleString();
    return 'Recent';
  };

  const downloadCSV = () => {
    const headers = ["Date", "Name", "Company", "Role", "Email", "Phone", "Address"];
    const rows = history.map(contact => [
      `"${formatTimestamp(contact)}"`,
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

  const emailHistory = () => {
    const subject = encodeURIComponent(`MCCIA BizScan Report - ${history.length} Business Contacts`);
    let bodyText = `Hello,\n\nI am sharing business contact details extracted using MCCIA BizScan.\n\n`;
    bodyText += `--- REPORT OVERVIEW ---\n`;
    bodyText += `Total Records: ${history.length}\n`;
    bodyText += `Generated At: ${new Date().toLocaleString()}\n\n`;
    
    history.forEach((c, i) => {
      bodyText += `[Contact #${i + 1}]\n`;
      bodyText += `Date: ${formatTimestamp(c)}\n`;
      bodyText += `Name: ${c.name || 'N/A'}\n`;
      bodyText += `Company: ${c.company_name || 'N/A'}\n`;
      bodyText += `Role: ${c.designation || 'N/A'}\n`;
      bodyText += `Email: ${c.email_1 || 'N/A'}\n`;
      bodyText += `Phone: ${c.phone_1 || 'N/A'}\n`;
      bodyText += `--------------------------------\n\n`;
    });
    
    bodyText += `\nExtracted using MCCIA APPLIED AI STUDIO BizScan Engine.`;
    const mailtoLink = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4 border-b border-slate-100 bg-slate-50/10">
        <div>
          <h3 className="text-xl font-black text-[#003366] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Cloud Records
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{history.length} Verified Contacts</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={emailHistory}
            variant="outline"
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider py-2.5 px-5 bg-white border-slate-200 text-[#003366] hover:bg-slate-50 shadow-sm"
          >
            Email Report
          </Button>

          <Button 
            onClick={downloadCSV}
            variant="outline"
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-wider py-2.5 px-5 bg-emerald-50 border-emerald-100 text-[#059669] hover:bg-emerald-100 shadow-sm"
          >
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / Name</th>
              <th scope="col" className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Company / Role</th>
              <th scope="col" className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Details</th>
              <th scope="col" className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {history.map((contact, index) => (
              <tr key={contact.id || index} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-6 py-5 align-top">
                  <div className="text-[9px] text-slate-400 font-bold mb-1">{formatTimestamp(contact)}</div>
                  <div className="text-sm font-black text-[#003366]">{contact.name}</div>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="text-[11px] font-bold text-slate-700 leading-tight mb-1">{contact.company_name}</div>
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded">{contact.designation}</span>
                </td>
                <td className="px-6 py-5 align-top">
                  <div className="text-[10px] text-slate-600 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 line-clamp-1">
                      {contact.email_1}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {contact.phone_1}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 align-top max-w-[200px]">
                   <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-2">{contact.address}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
