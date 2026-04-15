import { useState, useEffect } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';

export default function RenderNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('ajaia-render-notice');
    if (!hasSeenNotice) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ajaia-render-notice', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-blue-50 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
             <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="pr-4">
            <h4 className="text-slate-900 font-bold mb-1 tracking-tight">System Performance</h4>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              We're currently using a community tier for our backend. Please allow <span className="text-blue-600 font-bold">30-60 seconds</span> for the initial login while the server wakes up.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
            <button 
                onClick={handleDismiss}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all"
            >
                Understood
            </button>
        </div>
      </div>
    </div>
  );
}
