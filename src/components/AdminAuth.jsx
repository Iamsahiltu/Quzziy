import { useState, useEffect } from 'react';
import { getAdminAccount, createAdminAccount, verifyAdminCredentials } from '../services/db';

export default function AdminAuth({ onAuthenticated }) {
  const [adminExists, setAdminExists] = useState(() => !!getAdminAccount());
  const [loginId,    setLoginId]    = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [createId,   setCreateId]   = useState('');
  const [createPass, setCreatePass] = useState('');
  const [loginError,  setLoginError]  = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const handler = () => setAdminExists(!!getAdminAccount());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      const id = createId.trim();
      if (!id || !createPass) throw new Error('Admin ID and password are required');
      createAdminAccount(id, createPass);
      setAdminExists(true);
      onAuthenticated();
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (verifyAdminCredentials(loginId.trim(), loginPass)) {
      onAuthenticated();
    } else {
      setLoginError('Invalid admin credentials');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-grid">

        {/* ── Login ── */}
        <div className="auth-panel">
          <h3 className="auth-panel-title">Admin Login</h3>
          <form onSubmit={handleLogin} className="auth-form">
            <label className="auth-label">Admin ID</label>
            <input value={loginId}   onChange={(e) => setLoginId(e.target.value)}   className="form-input" required />
            <label className="auth-label">Password</label>
            <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} type="password" className="form-input" required />
            <div className="auth-actions">
              <button className="btn-primary" type="submit">Sign In</button>
            </div>
            {loginError && <p className="form-error">{loginError}</p>}
          </form>
        </div>

        {/* ── Create / Info ── */}
        <div className="auth-panel">
          <h3 className="auth-panel-title">
            {adminExists ? 'Admin Account Exists' : 'Create Admin Account'}
          </h3>
          {adminExists ? (
            <p className="auth-note">
              An admin account already exists. To recreate it, remove the{' '}
              <code>quiz_contest_admin</code> key from localStorage manually.
            </p>
          ) : (
            <form onSubmit={handleCreate} className="auth-form">
              <label className="auth-label">Admin ID</label>
              <input value={createId}   onChange={(e) => setCreateId(e.target.value)}   className="form-input" required />
              <label className="auth-label">Password</label>
              <input value={createPass} onChange={(e) => setCreatePass(e.target.value)} type="password" className="form-input" required />
              <div className="auth-actions">
                <button className="btn-primary" type="submit">Create Admin</button>
              </div>
              {createError && <p className="form-error">{createError}</p>}
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
