import React, { useState } from 'react';
import { AuthStep } from '../types';
import { Button } from './Button';
import { loginUser, registerUser } from '../services/firebaseService';

interface AuthProps {
  onLoginSuccess: () => void; // Parent just needs to know login happened, state is handled by listener
}

// SHARED STYLES
const inputClass = "w-full px-4 py-3 text-base text-black bg-white placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 outline-none transition-all shadow-sm font-medium";

// EXTRACTED COMPONENT: Prevents focus loss on re-renders
interface PasswordInputProps {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ name, placeholder, value, onChange, showPassword, toggleShowPassword }) => (
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name={name}
      value={value}
      onChange={onChange}
      className={inputClass}
      placeholder={placeholder}
      autoComplete="current-password"
    />
    <button
      type="button"
      onClick={toggleShowPassword}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
      tabIndex={-1} // Prevent tabbing to this button while typing
    >
      {showPassword ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  </div>
);

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<AuthStep>(AuthStep.LOGIN);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isMember: '', // 'yes' or 'no'
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  // MCCIA Brand Colors
  const brandBlue = "#003366";
  const brandGreen = "#10b981";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRadioChange = (val: string) => {
    setFormData({ ...formData, isMember: val });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(formData.email, formData.password);
      // Success is handled by the onAuthStateChanged listener in App.tsx
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Reset password or try later.");
      } else {
        setError(err.message || "Login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!formData.isMember) {
      setError("Please select if you are a member of MCCIA");
      return;
    }
    setStep(AuthStep.REGISTER_STEP_2);
    setError('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(formData.email, formData.password, formData.name, formData.phone, formData.isMember);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Registration Error:", err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak (min 6 chars).");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Enable 'Email/Password' in Firebase Console > Authentication.");
      } else if (err.message && err.message.includes("Firebase Auth not initialized")) {
        setError("System Error: API Keys missing. Check Vercel.");
      } else {
        setError(err.message || "Registration failed. Check console.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Password</label>
          <PasswordInput 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            showPassword={showPassword}
            toggleShowPassword={togglePasswordVisibility}
          />
        </div>
      </div>
      
      {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded border border-red-200 animate-pulse">{error}</div>}

      <Button 
        type="submit" 
        className="w-full py-3 text-lg font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all" 
        style={{ backgroundColor: brandBlue, color: 'white' }}
        isLoading={isLoading}
      >
        Log In
      </Button>

      <div className="text-center mt-6 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button 
            type="button"
            onClick={() => { setStep(AuthStep.REGISTER_STEP_1); setError(''); }}
            className="font-bold hover:underline"
            style={{ color: brandBlue }}
          >
            Register Here
          </button>
        </p>
      </div>
    </form>
  );

  const renderRegisterStep1 = () => (
    <form onSubmit={handleRegisterNext} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">Are you a member of MCCIA?</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="isMember" 
                value="yes"
                checked={formData.isMember === 'yes'}
                onChange={() => handleRadioChange('yes')}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-gray-700 font-medium">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="isMember" 
                value="no"
                checked={formData.isMember === 'no'}
                onChange={() => handleRadioChange('no')}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-gray-700 font-medium">No</span>
            </label>
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded border border-red-200">{error}</div>}

      <Button 
        type="submit" 
        className="w-full py-3 text-lg font-bold shadow-md hover:shadow-lg"
        style={{ backgroundColor: brandBlue, color: 'white' }}
      >
        Next Step
      </Button>

      <div className="text-center mt-4">
        <button 
          type="button"
          onClick={() => { setStep(AuthStep.LOGIN); setError(''); }}
          className="text-gray-500 text-sm hover:text-gray-800 font-medium"
        >
          ← Back to Login
        </button>
      </div>
      
      {/* Advisory Text */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 text-center">
        To be on the safer side, please use the <strong>Upload Image</strong> option for scanning.
      </div>
    </form>
  );

  const renderRegisterStep2 = () => (
    <form onSubmit={handleRegisterSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Create Password</label>
          <PasswordInput 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
            showPassword={showPassword}
            toggleShowPassword={togglePasswordVisibility}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">Confirm Password</label>
          <PasswordInput 
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            showPassword={showPassword}
            toggleShowPassword={togglePasswordVisibility}
          />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm text-center font-bold bg-red-50 p-3 rounded border border-red-200">{error}</div>}

      <Button 
        type="submit" 
        className="w-full py-3 text-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        style={{ backgroundColor: brandGreen, color: 'white' }}
        isLoading={isLoading}
      >
        Complete Registration
      </Button>

      <div className="text-center mt-4">
        <button 
          type="button"
          onClick={() => { setStep(AuthStep.REGISTER_STEP_1); setError(''); }}
          className="text-gray-500 text-sm hover:text-gray-800 font-medium"
        >
          ← Back
        </button>
      </div>
      
      {/* Advisory Text */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 text-center">
        To be on the safer side, please use the <strong>Upload Image</strong> option for scanning.
      </div>
    </form>
  );

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in-50 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4" style={{ borderColor: brandGreen }}>
        <div className="p-8 text-center relative" style={{ backgroundColor: brandBlue }}>
           <div className="absolute top-4 right-4 bg-white/10 px-2 py-0.5 rounded text-[10px] text-white font-medium tracking-wide border border-white/20">
             SECURE
           </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            {step === AuthStep.LOGIN ? 'MCCIA Secure Login' : 'Create Account'}
          </h2>
          <p className="text-blue-100 text-sm mt-2 opacity-90">
            {step === AuthStep.LOGIN 
              ? 'Access the MCCIA APPLIED AI STUDIO' 
              : step === AuthStep.REGISTER_STEP_1 
                ? 'Step 1: Personal Details' 
                : 'Step 2: Security'}
          </p>
        </div>

        <div className="p-8 bg-white">
          {step === AuthStep.LOGIN && renderLogin()}
          {step === AuthStep.REGISTER_STEP_1 && renderRegisterStep1()}
          {step === AuthStep.REGISTER_STEP_2 && renderRegisterStep2()}
        </div>
      </div>
    </div>
  );
};