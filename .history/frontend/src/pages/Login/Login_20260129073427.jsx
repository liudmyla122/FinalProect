import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setUserToLocalStorage } from '../../utils/storage';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'Log in - ICHGRAM';
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      localStorage.setItem('token', response.token);
      // Сохраняем user без большого аватара (base64), чтобы не было QuotaExceededError
      setUserToLocalStorage(response.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <div className="auth-phones" />

        <div className="auth-right">
          <div className="auth-box">
            <h1 className="auth-logo">ICHGRAM</h1>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <input
                type="email"
                name="email"
                placeholder="Username, or email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input"
              />

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="auth-or">
              <div className="auth-or-line" />
              <span className="auth-or-text">OR</span>
              <div className="auth-or-line" />
            </div>

            <Link
              to="/reset"
              className="auth-link-button"
            >
              Forgot password?
            </Link>
          </div>

          <div className="auth-switch-box">
            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

