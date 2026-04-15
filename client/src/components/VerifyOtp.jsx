import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { ShieldCheck } from 'lucide-react';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
        setError('No email provided. Please register again.');
        return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      alert('Account verified! You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-8 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
            <CheckCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Verify Identity</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">We've sent a security code to your email. Enter it below to unlock your workspace.</p>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Security Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-4xl font-black tracking-[0.5em] px-4 py-6 bg-slate-50 border border-slate-200 rounded-2xl text-blue-600 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all duration-300"
              placeholder="000000"
              maxLength="6"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all duration-300 shadow-xl shadow-blue-100 uppercase tracking-widest text-sm"
          >
            {loading ? 'Verifying...' : 'Validate Access'}
          </button>
        </form>

        <p className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
          Didn't receive the code? <button className="text-blue-600 hover:underline">Resend</button>
        </p>
      </div>
    </div>
  );
}
