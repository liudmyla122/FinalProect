import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setUserToLocalStorage } from '../../utils/storage';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'Sign up - ICHGRAM';
  }, []);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    username: '',
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
      const response = await authAPI.register(formData);
      // Сохраняем токен
      localStorage.setItem('token', response.token);
      setUserToLocalStorage(response.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-logo">ICHGRAM</h1>
        <p className="auth-subtitle">
          Sign up to see photos and videos from your friends.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
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
            minLength={6}
            className="auth-input"
          />

          <p className="auth-info">
            People who use our service may have uploaded your contact
            information to Instagram.{' '}
            <a href="#" className="auth-link">
              Learn More
            </a>
          </p>

          <p className="auth-info">
            By signing up, you agree to our{' '}
            <a href="#" className="auth-link">
              Terms
            </a>
            ,{' '}
            <a href="#" className="auth-link">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="#" className="auth-link">
              Cookies Policy
            </a>
            .
          </p>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
      </div>

      <div className="auth-switch-box">
        <p className="auth-switch">
          Have an account?{' '}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

