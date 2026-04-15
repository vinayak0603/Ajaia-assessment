import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import VerifyOtp from './components/VerifyOtp';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import RenderNotice from './components/RenderNotice';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-500/10">
        <RenderNotice />
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/verify-otp" element={!user ? <VerifyOtp /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} />
          <Route path="/editor/:id?" element={user ? <Editor user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
