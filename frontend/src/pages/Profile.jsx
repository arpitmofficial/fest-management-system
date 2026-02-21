import { useState, useEffect, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/participants/profile');
      setProfile(data);
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        collegeName: data.collegeName,
        interests: data.interests?.join(', ') || ''
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
      const payload = {
        ...formData,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };
      await api.put('/participants/profile', payload);
      setMessage('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      await api.put('/participants/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Password change failed');
    }
  };

  if (loading) {
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
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>My Profile</h1>

        {message && (
          <p style={{ padding: '10px', backgroundColor: message.includes('success') ? '#e8f5e9' : '#ffebee', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Account Information</h3>
          
          {editing ? (
            <form onSubmit={handleUpdate}>
              <label style={labelStyle}>
                First Name
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Last Name
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Contact Number
                <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} style={inputStyle} />
              </label>
              {profile.participantType !== 'IIIT' && (
                <label style={labelStyle}>
                  College Name
                  <input type="text" value={formData.collegeName} onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })} style={inputStyle} />
                </label>
              )}
              <label style={labelStyle}>
                Interests (comma separated)
                <input type="text" value={formData.interests} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} style={inputStyle} placeholder="e.g., Coding, Music, Dance" />
              </label>
              <div style={{ marginTop: '20px' }}>
                <button type="submit" style={buttonStyle}>Save Changes</button>
                <button type="button" onClick={() => setEditing(false)} style={{ ...buttonStyle, backgroundColor: '#666' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
              <p style={{ marginBottom: '12px' }}><strong>Email:</strong> {profile.email} <span style={{ color: '#888', fontSize: '13px' }}>(cannot be changed)</span></p>
              <p style={{ marginBottom: '12px' }}><strong>Contact:</strong> {profile.contactNumber}</p>
              <p style={{ marginBottom: '12px' }}><strong>Type:</strong> {profile.participantType} <span style={{ color: '#888', fontSize: '13px' }}>(cannot be changed)</span></p>
              <p style={{ marginBottom: '12px' }}><strong>College:</strong> {profile.collegeName}</p>
              <p style={{ marginBottom: '12px' }}><strong>Interests:</strong> {profile.interests?.join(', ') || 'None set'}</p>
              <p style={{ marginBottom: '12px' }}><strong>Following:</strong> {profile.followedOrganizers?.length || 0} clubs</p>
              <button onClick={() => setEditing(true)} style={{ ...buttonStyle, marginTop: '15px' }}>Edit Profile</button>
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <label style={labelStyle}>
              Current Password
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              New Password
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              Confirm New Password
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} style={inputStyle} required />
            </label>
            <button type="submit" style={buttonStyle}>Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
