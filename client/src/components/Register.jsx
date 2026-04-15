import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-8 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-center text-slate-900 mb-2 tracking-tight">Create Account</h1>
        <p className="text-center text-slate-500 mb-10 font-medium">Join Ajaia and start collaborating</p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="work@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-xl shadow-blue-100 mt-4"
          >
            {loading ? 'Creating Account...' : 'Continue'}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-500 text-sm">
          Already have an account? <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
