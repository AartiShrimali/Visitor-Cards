import { ContactData } from "../types";

export const sendHistoryEmail = async (
  userEmail: string, 
  userName: string, 
  history: ContactData[]
): Promise<boolean> => {
  
  const env = (import.meta as any).env;
  const scriptUrl = env.VITE_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    console.error("Missing VITE_GOOGLE_SCRIPT_URL in environment variables");
    throw new Error("Email service not configured.");
  }

  // 1. Generate HTML Table for the Email Body
  const tableRows = history.map(c => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.company_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.designation}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.email_1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.phone_1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${c.address}</td>
    </tr>
  `).join('');

  const htmlBody = `
    <h2>MCCIA ID Scanner History</h2>
    <p>Dear ${userName},</p>
    <p>Here is the history of ID cards you have scanned.</p>
    <p><strong>A CSV file containing this data is attached to this email for your convenience.</strong></p>
    
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
      <thead>
        <tr style="background-color: #003366; color: white;">
          <th style="padding: 10px; border: 1px solid #ddd;">Name</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Company</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Role</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Email</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Phone</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Address</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <p>Best Regards,<br/>MCCIA APPLIED AI STUDIO</p>
  `;

  // 2. Generate CSV String for Attachment
  const csvHeaders = ["Name", "Company", "Role", "Email", "Phone", "Address"];
  const csvRows = history.map(contact => [
    `"${contact.name || ''}"`,
    `"${contact.company_name || ''}"`,
    `"${contact.designation || ''}"`,
    `"${contact.email_1 || ''}"`,
    `"${contact.phone_1 || ''}"`,
    `"${contact.address ? contact.address.replace(/\n/g, ' ') : ''}"`
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

  try {
    // Send data to Google Apps Script
    // We send 'csvContent' as a new field
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: userEmail,
        htmlBody: htmlBody,
        csvContent: csvContent // Sending the raw CSV data
      })
    });
    
    return true;

  } catch (error) {
    console.error("Failed to send email via Google Script:", error);
    throw error;
  }
};