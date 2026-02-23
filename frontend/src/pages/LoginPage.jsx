import { useNavigate, Link } from 'react-router-dom';
import { useState, useContext, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import AuthContext from '../context/AuthContext';
import api from '../api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Execute reCAPTCHA v3 and get token
      let captchaToken = '';
      if (executeRecaptcha) {
        captchaToken = await executeRecaptcha('login');
      }

      const { data } = await api.post('/auth/login', { email, password, role, captchaToken });
      login(data, data.token);
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '350px', margin: '80px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Login</h2>
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>I am a:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="participant">Participant</option>
            <option value="organizer">Organizer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#999' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>

        <p style={{ fontSize: '11px', color: '#999', marginTop: '10px', textAlign: 'center' }}>
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#999' }}>Privacy Policy</a> and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#999' }}>Terms of Service</a> apply.
        </p>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
};

export default LoginPage;