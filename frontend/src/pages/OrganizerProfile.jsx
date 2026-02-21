import { useState, useEffect, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const OrganizerProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/organizers/profile');
      setProfile(data);
      setFormData({
        organizerName: data.organizerName,
        category: data.category,
        description: data.description,
        contactEmail: data.contactEmail,
        contactNumber: data.contactNumber,
        discordWebhook: data.discordWebhook || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.put('/organizers/profile', formData);
      setMessage('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  const handleRequestPasswordReset = async () => {
    const reason = prompt('Please provide a reason for password reset:');
    if (!reason) return;

    try {
      await api.post('/organizers/request-password-reset', { reason });
      setMessage('Password reset request submitted. Admin will review it.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Request failed');
    }
  };

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <Navbar />
        <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' };
  const labelStyle = { display: 'block', marginBottom: '15px' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Organization Profile</h1>

        {message && (
          <p style={{ padding: '10px', backgroundColor: message.includes('success') ? '#e8f5e9' : '#ffebee', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Organization Information</h3>
          
          {editing ? (
            <form onSubmit={handleUpdate}>
              <label style={labelStyle}>
                Organization Name
                <input type="text" value={formData.organizerName} onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Category
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                  <option value="Cultural">Cultural</option>
                  <option value="Technical">Technical</option>
                  <option value="Sports">Sports</option>
                  <option value="Fest Team">Fest Team</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label style={labelStyle}>
                Description
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} />
              </label>
              <label style={labelStyle}>
                Contact Email
                <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Contact Number
                <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Discord Webhook URL (for auto-posting events)
                <input type="text" value={formData.discordWebhook} onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })} style={inputStyle} placeholder="https://discord.com/api/webhooks/..." />
              </label>
              <div style={{ marginTop: '20px' }}>
                <button type="submit" style={buttonStyle}>Save Changes</button>
                <button type="button" onClick={() => setEditing(false)} style={{ ...buttonStyle, backgroundColor: '#666' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}><strong>Name:</strong> {profile.organizerName}</p>
              <p style={{ marginBottom: '12px' }}><strong>Login Email:</strong> {profile.loginEmail} <span style={{ color: '#888', fontSize: '13px' }}>(cannot be changed)</span></p>
              <p style={{ marginBottom: '12px' }}><strong>Category:</strong> {profile.category}</p>
              <p style={{ marginBottom: '12px' }}><strong>Description:</strong> {profile.description || 'Not set'}</p>
              <p style={{ marginBottom: '12px' }}><strong>Contact Email:</strong> {profile.contactEmail}</p>
              <p style={{ marginBottom: '12px' }}><strong>Contact Number:</strong> {profile.contactNumber}</p>
              <p style={{ marginBottom: '12px' }}><strong>Discord Webhook:</strong> {profile.discordWebhook ? 'Configured ✓' : 'Not set'}</p>
              <button onClick={() => setEditing(true)} style={{ ...buttonStyle, marginTop: '15px' }}>Edit Profile</button>
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Security</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Password changes must be requested from the Admin.
          </p>
          <button onClick={handleRequestPasswordReset} style={buttonStyle}>
            Request Password Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfile;
