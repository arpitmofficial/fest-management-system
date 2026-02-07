import { useState, useContext } from 'react';
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
    participantType: 'IIIT', // Default to IIIT
    collegeName: '',
    interests: '' // Comma separated string for now
  });
  
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Convert "Interests" string to Array (e.g., "Coding, Music" -> ["Coding", "Music"])
      const payload = {
        ...formData,
        interests: formData.interests.split(',').map(i => i.trim())
      };

      // 2. Send to Backend
      const { data } = await api.post('/register', payload);

      // 3. Auto-Login the user
      login(data, data.token);

      // 4. Redirect to Dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Create Participant Account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        {/* Name Fields */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input name="firstName" placeholder="First Name" onChange={handleChange} required style={{ flex: 1, padding: '8px' }} />
          <input name="lastName" placeholder="Last Name" onChange={handleChange} required style={{ flex: 1, padding: '8px' }} />
        </div>

        {/* Contact Fields */}
        <div style={{ marginBottom: '15px' }}>
          <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input name="contactNumber" placeholder="Phone Number" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '15px' }}>
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        {/* Participant Type Dropdown */}
        <div style={{ marginBottom: '15px' }}>
          <label>I am from:</label>
          <select name="participantType" value={formData.participantType} onChange={handleChange} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
            <option value="IIIT">IIIT Hyderabad</option>
            <option value="Non-IIIT">Other College / Outsider</option>
          </select>
        </div>

        {/* CONDITIONAL: College Name (Only shows if Non-IIIT) */}
        {formData.participantType === 'Non-IIIT' && (
          <div style={{ marginBottom: '15px' }}>
            <input name="collegeName" placeholder="Enter your College Name" onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
          </div>
        )}

        {/* Interests */}
        <div style={{ marginBottom: '15px' }}>
          <input name="interests" placeholder="Interests (e.g. Coding, Dance, Art)" onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Register
        </button>
      </form>

      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;