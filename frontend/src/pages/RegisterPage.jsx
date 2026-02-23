import { useState, useContext, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import AuthContext from '../context/AuthContext';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    participantType: 'IIIT',
    collegeName: '',
    interests: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Execute reCAPTCHA v3 and get token
      let captchaToken = '';
      if (executeRecaptcha) {
        captchaToken = await executeRecaptcha('register');
      }

      const payload = {
        ...formData,
        interests: formData.interests.split(',').map(i => i.trim()),
        captchaToken
      };

      const { data } = await api.post('/auth/register', payload);
      login(data, data.token);
      navigate('/onboarding');

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>Create Account</h2>
      <p style={{ textAlign: 'center', marginBottom: '25px', color: '#666', fontSize: '14px' }}>(Participants only)</p>
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input name="firstName" placeholder="First Name" onChange={handleChange} required style={{ flex: 1, padding: '8px' }} />
          <input name="lastName" placeholder="Last Name" onChange={handleChange} required style={{ flex: 1, padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input name="contactNumber" placeholder="Phone Number" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>I am from:</label>
          <select name="participantType" value={formData.participantType} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value="IIIT">IIIT Hyderabad</option>
            <option value="Non-IIIT">Other College / Outsider</option>
          </select>
        </div>

        {formData.participantType === 'Non-IIIT' && (
          <div style={{ marginBottom: '15px' }}>
            <input name="collegeName" placeholder="Enter your College Name" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <input name="interests" placeholder="Interests (e.g. Coding, Dance, Art)" onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#999' : '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px' }}
        >
          {loading ? 'Verifying...' : 'Register'}
        </button>

        <p style={{ fontSize: '11px', color: '#999', marginTop: '10px', textAlign: 'center' }}>
          This site is protected by reCAPTCHA and the Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#999' }}>Privacy Policy</a> and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#999' }}>Terms of Service</a> apply.
        </p>
      </form>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;