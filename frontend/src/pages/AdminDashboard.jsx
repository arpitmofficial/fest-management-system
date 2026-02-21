import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '25px',
    textAlign: 'center',
    minWidth: '150px'
  };

  const linkCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '20px',
    textDecoration: 'none',
    color: '#333',
    display: 'block'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <Navbar />
        <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '30px' }}>Admin Dashboard</h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '600' }}>{stats?.totalOrganizers || 0}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Organizers</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '600' }}>{stats?.totalParticipants || 0}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Participants</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '600' }}>{stats?.totalEvents || 0}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Events</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '600' }}>{stats?.totalRegistrations || 0}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Registrations</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: '600', color: stats?.pendingPasswordResets > 0 ? '#ef6c00' : '#333' }}>
              {stats?.pendingPasswordResets || 0}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Pending Requests</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <Link to="/manage-organizers" style={linkCardStyle}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Manage Clubs</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Add, edit, or remove clubs and organizers</p>
          </Link>
          <Link to="/password-requests" style={linkCardStyle}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Password Requests</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Review pending password reset requests</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
