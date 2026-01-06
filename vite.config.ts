import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // We still provide process.env polyfills as a backup, but the code now prefers import.meta.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ""),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID || env.REACT_APP_GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ""),
      // Expose the Google Script URL
      'process.env.VITE_GOOGLE_SCRIPT_URL': JSON.stringify(env.VITE_GOOGLE_SCRIPT_URL || ""),
      'process.env': {}
    }
  };
});
