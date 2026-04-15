import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Sparkles, Key } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-950 p-4">
      <div className="w-full max-w-md p-10 bg-[#001a4d] rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-8 bg-blue-600 rounded-xl">
            <Key className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-center text-white mb-3 tracking-tight">Sign In</h1>
        <p className="text-center text-slate-400 mb-10 font-medium">Enter your credentials to access Ajaia</p>
        
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-navy-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200"
              placeholder="work@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-navy-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-500 text-sm">
          New to Ajaia? <Link to="/register" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">Create account</Link>
        </p>
      </div>
    </div>
  );
}
