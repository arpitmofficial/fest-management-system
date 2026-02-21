import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState(null);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: 'Technical',
    collegeName: 'IIIT Hyderabad',
    description: '',
    contactEmail: '',
    contactNumber: ''
  });

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const { data } = await api.get('/admin/organizers');
      setOrganizers(data);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    setCredentials(null);

    try {
      const { data } = await api.post('/admin/organizers', formData);
      setMessage('Organizer created successfully!');
      setCredentials(data.credentials);
      setFormData({
        organizerName: '',
        category: 'Technical',
        collegeName: 'IIIT Hyderabad',
        description: '',
        contactEmail: '',
        contactNumber: ''
      });
      fetchOrganizers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create organizer');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await api.delete(`/admin/organizers/${id}`);
      setMessage('Organizer deleted');
      fetchOrganizers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete');
    }
  };

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' };
  const labelStyle = { display: 'block', marginBottom: '15px' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Manage Clubs & Organizers</h1>
          <button onClick={() => setShowForm(!showForm)} style={buttonStyle}>
            {showForm ? 'Cancel' : 'Add New'}
          </button>
        </div>

        {message && (
          <p style={{ padding: '10px', backgroundColor: message.includes('success') ? '#e8f5e9' : '#ffebee', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        {/* Credentials Display */}
        {credentials && (
          <div style={{ border: '2px solid #2e7d32', borderRadius: '4px', padding: '20px', marginBottom: '25px', backgroundColor: '#e8f5e9' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Generated Credentials (Share these with the organizer)</h3>
            <p style={{ margin: '0 0 8px 0' }}><strong>Login Email:</strong> {credentials.email}</p>
            <p style={{ margin: '0' }}><strong>Password:</strong> {credentials.password}</p>
            <button onClick={() => {
              navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
              alert('Copied to clipboard!');
            }} style={{ ...buttonStyle, marginTop: '15px', backgroundColor: '#2e7d32' }}>
              Copy Credentials
            </button>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Add New Organizer</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <label style={labelStyle}>
                  Organization Name *
                  <input type="text" value={formData.organizerName} onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })} style={inputStyle} required />
                </label>
                <label style={labelStyle}>
                  Category *
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                    <option value="Cultural">Cultural</option>
                    <option value="Technical">Technical</option>
                    <option value="Sports">Sports</option>
                    <option value="Fest Team">Fest Team</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  College/Organization *
                  <input type="text" value={formData.collegeName} onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })} style={inputStyle} required />
                </label>
                <label style={labelStyle}>
                  Contact Email *
                  <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} style={inputStyle} required />
                </label>
                <label style={labelStyle}>
                  Contact Number
                  <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} style={inputStyle} placeholder="Optional" />
                </label>
              </div>
              <label style={labelStyle}>
                Description
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, minHeight: '80px' }} />
              </label>
              <button type="submit" style={buttonStyle}>Create Organizer</button>
            </form>
          </div>
        )}

        {/* Organizers List */}
        {loading ? (
          <p>Loading...</p>
        ) : organizers.length === 0 ? (
          <p style={{ color: '#666' }}>No organizers yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Login Email</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Contact</th>
                <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{org.organizerName}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{org.category}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{org.loginEmail}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{org.contactEmail}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <button onClick={() => handleDelete(org._id, org.organizerName)} style={{ padding: '5px 10px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageOrganizers;
