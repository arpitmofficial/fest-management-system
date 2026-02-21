import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const PasswordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [newCredentials, setNewCredentials] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/admin/password-reset-requests');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, status) => {
    const comment = prompt(`Add a comment for ${status === 'approved' ? 'approval' : 'rejection'}:`);
    
    try {
      const { data } = await api.put(`/admin/password-reset-requests/${id}`, { status, comment });
      setMessage(`Request ${status}`);
      
      if (data.newCredentials) {
        setNewCredentials(data.newCredentials);
      }
      
      fetchRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Action failed');
    }
  };

  const statusColors = {
    pending: '#ef6c00',
    approved: '#2e7d32',
    rejected: '#c62828'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Password Reset Requests</h1>

        {message && (
          <p style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        {/* New Credentials Display */}
        {newCredentials && (
          <div style={{ border: '2px solid #2e7d32', borderRadius: '4px', padding: '20px', marginBottom: '25px', backgroundColor: '#e8f5e9' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>New Credentials (Share these with the organizer)</h3>
            <p style={{ margin: '0 0 8px 0' }}><strong>Login Email:</strong> {newCredentials.email}</p>
            <p style={{ margin: '0' }}><strong>New Password:</strong> {newCredentials.password}</p>
            <button onClick={() => {
              navigator.clipboard.writeText(`Email: ${newCredentials.email}\nNew Password: ${newCredentials.password}`);
              alert('Copied to clipboard!');
            }} style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Copy Credentials
            </button>
            <button onClick={() => setNewCredentials(null)} style={{ marginTop: '15px', marginLeft: '10px', padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ color: '#666' }}>No password reset requests.</p>
        ) : (
          <div>
            {requests.map((req) => (
              <div key={req._id} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{req.organizer?.organizerName}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                      {req.organizer?.loginEmail}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                      <strong>Reason:</strong> {req.reason}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>
                      Requested: {new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.adminComment && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
                        <strong>Admin Comment:</strong> {req.adminComment}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      color: statusColors[req.status]
                    }}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <div style={{ marginTop: '15px' }}>
                        <button onClick={() => handleProcess(req._id, 'approved')} style={{ marginRight: '8px', padding: '6px 12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          Approve
                        </button>
                        <button onClick={() => handleProcess(req._id, 'rejected')} style={{ padding: '6px 12px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordRequests;
