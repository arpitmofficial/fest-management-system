import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <h1>Welcome, {user.firstName || user.organizerName || 'Admin'}!</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* CONDITIONAL RENDERING BASED ON ROLE */}
      <main>
        {user.role === 'admin' && (
          <div>
            <h2>Admin Dashboard</h2>
            <p>You have full control over the system.</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
               <div style={cardStyle}>Manage Users</div>
               <div style={cardStyle}>System Analytics</div>
               <div style={cardStyle}>Site Settings</div>
            </div>
          </div>
        )}

        {user.role === 'organizer' && (
          <div>
             <h2>Organizer Dashboard</h2>
             <p>Manage your events and track registrations.</p>
             <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
               <div style={cardStyle}>Create New Event</div>
               <div style={cardStyle}>My Events</div>
               <div style={cardStyle}>Sales Report</div>
            </div>
          </div>
        )}

        {user.role === 'participant' && (
          <div>
            <h2>Participant Dashboard</h2>
            <p>Explore events and view your tickets.</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
               <div style={cardStyle}>Browse Events</div>
               <div style={cardStyle}>My Tickets</div>
               <div style={cardStyle}>Profile</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Simple card styling for the boxes
const cardStyle = {
  border: '1px solid #ddd',
  padding: '20px',
  borderRadius: '8px',
  width: '200px',
  textAlign: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

export default Dashboard;