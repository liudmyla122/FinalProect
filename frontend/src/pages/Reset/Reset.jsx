import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Reset.css';

const Reset = () => {
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Reset - ICHGRAM';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!emailOrUsername.trim()) {
      setError('Please enter your email or username');
      setLoading(false);
      return;
    }

    try {
      await authAPI.resetPassword(emailOrUsername);
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-header">
        <h1 className="reset-page-title">Reset</h1>
      </div>
      
      <div className="reset-layout">
        <div className="reset-box">
          {!success ? (
            <>
              <div className="reset-logo">ICHGRAM</div>
              
              <div className="reset-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>

              <h2 className="reset-title">Trouble logging in?</h2>
              
              <p className="reset-description">
                Enter your email, phone, or username and we'll send you a link to get back into your account.
              </p>

              <form className="reset-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="reset-input"
                  placeholder="Email or Username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  disabled={loading}
                />

                {error && <div className="reset-error">{error}</div>}

                <button 
                  type="submit" 
                  className="reset-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Reset your password'}
                </button>
              </form>

              <div className="reset-or">
                <div className="reset-or-line"></div>
                <span className="reset-or-text">OR</span>
                <div className="reset-or-line"></div>
              </div>

              <Link to="/register" className="reset-create-account">
                Create new account
              </Link>

              <Link to="/login" className="reset-back-login">
                Back to login
              </Link>
            </>
          ) : (
            <>
              <div className="reset-logo">ICHGRAM</div>
              
              <div className="reset-icon reset-icon-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h2 className="reset-title">Check your email</h2>
              
              <p className="reset-description">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>

              <Link to="/login" className="reset-back-login">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reset;
