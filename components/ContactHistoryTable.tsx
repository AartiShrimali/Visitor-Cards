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
    link.setAttribute('download', `mccia_contacts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const emailHistory = async () => {
    if (!userEmail || !userName) {
      alert("User email not found. Please log in again.");
      return;
    }

    setIsSending(true);
    try {
      await sendHistoryEmail(userEmail, userName, history);
      alert(`Email sent successfully to ${userEmail}! Check your Inbox and Spam folder.`);
    } catch (error) {
      console.error(error);
      alert("Failed to send email. Please check your network connection.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 px-2">
        <div>
          <h3 className="text-2xl font-bold text-[#003366] flex items-center gap-2">
            {/* Updated Icon Color to Green #10b981 */}
            <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Scanned History
          </h3>
          <p className="text-sm text-gray-500 mt-1">Your previously scanned cards are saved securely.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
            {history.length} {history.length === 1 ? 'Record' : 'Records'}
          </span>
          
          <div className="flex gap-2">
            <Button 
              onClick={emailHistory}
              variant="outline"
              isLoading={isSending}
              className="text-sm py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300"
              title="Send to email"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="hidden sm:inline">Email Report</span>
            </Button>

            <Button 
              onClick={downloadCSV}
              variant="outline"
              className="text-sm py-1.5 px-3 bg-white hover:bg-green-50 text-green-700 border-green-200 hover:border-green-300"
              title="Download Excel/CSV"
            >
              <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-hidden shadow-xl rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-[#003366] text-white">
              <tr>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Company</th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Role</th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider w-1/4">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((contact, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors duration-150 group">
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-bold text-gray-900">{contact.name}</div>
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-gray-900">{contact.company_name}</div>
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                    {contact.designation && (
                      // Updated Badge Style to Green theme
                      <span className="inline-flex text-[10px] leading-4 font-bold rounded bg-green-50 text-green-800 border border-green-100 px-2 py-0.5 uppercase tracking-wide">
                        {contact.designation}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                    {contact.email_1 ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                         <svg className="w-3.5 h-3.5 text-[#003366] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         <span className="truncate max-w-[140px]" title={contact.email_1}>{contact.email_1}</span>
                      </div>
                    ) : <span className="text-gray-300">-</span>}
                  </td>

                  <td className="px-4 py-4 align-top">
                    {contact.phone_1 ? (
                       <div className="flex items-center gap-1.5 text-sm text-gray-600">
                         <svg className="w-3.5 h-3.5 text-[#003366] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                         <span className="font-mono text-xs whitespace-nowrap">{contact.phone_1}</span>
                       </div>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                     <p className="text-xs text-gray-500 leading-relaxed line-clamp-3" title={contact.address}>
                       {contact.address || '-'}
                     </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};