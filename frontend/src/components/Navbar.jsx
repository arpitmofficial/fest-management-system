import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    borderBottom: '1px solid #eee',
    background: '#fff'
  };

  const linkStyle = {
    marginRight: '20px',
    color: '#333',
    textDecoration: 'none',
    fontSize: '14px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ ...linkStyle, fontWeight: '600', fontSize: '16px', marginRight: '40px' }}>
          Felicity
        </Link>

        {/* Participant Navigation */}
        {user.role === 'participant' && (
          <>
            <Link to="/participant/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/events" style={linkStyle}>Browse Events</Link>
            <Link to="/clubs" style={linkStyle}>Clubs</Link>
            <Link to="/profile" style={linkStyle}>Profile</Link>
          </>
        )}

        {/* Organizer Navigation */}
        {user.role === 'organizer' && (
          <>
            <Link to="/organizer/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/organizer/events/create" style={linkStyle}>Create Event</Link>
            <Link to="/organizer/profile" style={linkStyle}>Profile</Link>
          </>
        )}

        {/* Admin Navigation */}
        {user.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/manage-organizers" style={linkStyle}>Manage Clubs</Link>
            <Link to="/password-requests" style={linkStyle}>Password Requests</Link>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '15px', fontSize: '14px', color: '#666' }}>
          {user.firstName || user.organizerName || 'Admin'} ({user.role})
        </span>
        <button onClick={handleLogout} style={buttonStyle}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
