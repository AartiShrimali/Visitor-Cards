
import React, { useEffect, useState } from 'react';
import { fetchGlobalAnalytics } from '../services/firebaseService';

interface AnalyticsData {
  totalUsers: number;
  loggedInUsers?: number; // Optional as it's new
  activeUsers: number;
  totalScansGlobal: number;
  avgScansPerUser: string;
  medianScans: number;
  avgTimePerScanMs: number;
  globalMinTimeMs: number;
  globalMaxTimeMs: number;
}

export const AnalyticsDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchGlobalAnalytics();
        setData(stats);
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
      </div>
    );
  }

  if (!data) return null;

  const msToSec = (ms: number) => (ms / 1000).toFixed(2) + 's';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="bg-[#003366] p-6 flex justify-between items-center border-b-4 border-[#10b981]">
          <h2 className="text-2xl font-bold text-white tracking-wide">Admin Analytics Dashboard</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 bg-gray-50 overflow-y-auto max-h-[80vh]">
          
          {/* User Adoption */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider mb-4 border-l-4 border-[#10b981] pl-3">User Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="text-2xl font-black text-[#003366]">{data.totalUsers}</div>
                <div className="text-xs text-gray-500 font-medium">Total Signed Up</div>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="text-2xl font-black text-blue-600">{data.loggedInUsers ?? data.totalUsers}</div>
                <div className="text-xs text-gray-500 font-medium">Accessed App (Logins)</div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="text-2xl font-black text-[#10b981]">{data.activeUsers}</div>
                <div className="text-xs text-gray-500 font-medium">Active (Scanned &gt; 0)</div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="text-2xl font-black text-purple-600">{data.totalScansGlobal}</div>
                <div className="text-xs text-gray-500 font-medium">Total Scans</div>
              </div>
            </div>
          </div>

          {/* Averages */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider mb-4 border-l-4 border-[#10b981] pl-3">Usage Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-gray-800">{data.avgScansPerUser}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">Per User</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">Average Scans</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-gray-800">{data.medianScans}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">Median</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">Median Scans per User</div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <h3 className="text-lg font-bold text-gray-700 uppercase tracking-wider mb-4 border-l-4 border-[#10b981] pl-3">Performance (AI Scan Time)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                 <div className="text-2xl font-black text-green-700">{msToSec(data.globalMinTimeMs)}</div>
                 <div className="text-xs font-bold text-green-600 uppercase mt-1">Fastest Scan</div>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                 <div className="text-2xl font-black text-blue-700">{msToSec(data.avgTimePerScanMs)}</div>
                 <div className="text-xs font-bold text-blue-600 uppercase mt-1">Average Time</div>
              </div>
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                 <div className="text-2xl font-black text-red-700">{msToSec(data.globalMaxTimeMs)}</div>
                 <div className="text-xs font-bold text-red-600 uppercase mt-1">Slowest Scan</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center italic">
              Note: Metrics are aggregated from user activities recorded since the dashboard update.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
