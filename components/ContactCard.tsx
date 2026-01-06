import React, { useState } from 'react';
import { ContactData } from '../types';
import { Button } from './Button';

interface ContactCardProps {
  data: ContactData;
  onSave: (data: ContactData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({ data, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState<ContactData>(data);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openMap = () => {
    if (formData.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`;
      window.open(url, '_blank');
    }
  };

  // HIGH CONTRAST INPUTS
  const inputClasses = "w-full px-3 py-2 sm:px-4 sm:py-3 text-base sm:text-lg font-bold text-black bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none transition-all placeholder-gray-400 shadow-sm";
  const labelClasses = "block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5 ml-1";

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
      <div className="bg-[#003366] px-6 py-4 sm:px-8 sm:py-6 text-white flex justify-between items-center border-b-4 border-[#10b981]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Review Details</h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">Verify information before saving</p>
        </div>
        <span className="hidden sm:inline-block text-xs font-bold bg-[#10b981] text-white px-3 py-1.5 rounded shadow-sm">
          EDITABLE
        </span>
      </div>
      
      {/* 
         Mobile Fix: 
         1. Reduced padding (p-4)
         2. Increased gap (gap-6) to prevent overlapping labels 
         3. Specific grid-cols-1 for mobile
      */}
      <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-gray-50">
        <div className="col-span-1 md:col-span-2">
          <label className={labelClasses}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClasses}
            placeholder="John Doe"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Company</label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Company Name"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Job Title"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Email 1</label>
          <input
            type="email"
            name="email_1"
            value={formData.email_1}
            onChange={handleChange}
            className={inputClasses}
            placeholder="email@example.com"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Email 2</label>
          <input
            type="email"
            name="email_2"
            value={formData.email_2}
            onChange={handleChange}
            className={inputClasses}
            placeholder="secondary@example.com"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Phone 1</label>
          <input
            type="tel"
            name="phone_1"
            value={formData.phone_1}
            onChange={handleChange}
            className={inputClasses}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="col-span-1">
          <label className={labelClasses}>Phone 2</label>
          <input
            type="tel"
            name="phone_2"
            value={formData.phone_2}
            onChange={handleChange}
            className={inputClasses}
            placeholder="Secondary Phone"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className={`${labelClasses} flex justify-between items-center`}>
            <span>Address</span>
            {formData.address && (
              <button 
                type="button" 
                onClick={openMap}
                className="text-[#003366] text-xs hover:text-emerald-600 hover:underline flex items-center gap-1 transition-colors font-bold"
                title="Open in Google Maps"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                View Map
              </button>
            )}
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className={`${inputClasses} resize-none py-3`}
            placeholder="Full Office Address"
          />
        </div>
      </div>

      <div className="bg-white px-6 py-4 sm:px-8 sm:py-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 text-base border-gray-300 text-gray-700 hover:bg-gray-100 font-medium order-2 sm:order-1"
        >
          Discard
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onSave(formData)} 
          isLoading={isSaving}
          className="w-full sm:w-auto px-8 py-2.5 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-bold order-1 sm:order-2"
          style={{ backgroundColor: '#003366' }}
        >
          Upload Data
        </Button>
      </div>
    </div>
  );
};