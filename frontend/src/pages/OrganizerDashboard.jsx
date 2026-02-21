import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const OrganizerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/organizers/dashboard');
      setDashboard(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    minWidth: '120px'
  };

  const eventCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px'
  };

  const statusColors = {
    draft: '#666',
    published: '#2e7d32',
    ongoing: '#1565c0',
    completed: '#6a1b9a',
    closed: '#c62828'
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Organizer Dashboard</h1>
          <Link
            to="/organizer/events/create"
            style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
          >
            Create Event
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{dashboard?.stats?.totalEvents || 0}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Events</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{dashboard?.stats?.publishedEvents || 0}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Published</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{dashboard?.stats?.draftEvents || 0}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Drafts</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{dashboard?.stats?.totalRegistrations || 0}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Registrations</p>
          </div>
          <div style={statCardStyle}>
            <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{dashboard?.stats?.totalViews || 0}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Views</p>
          </div>
        </div>

        {/* Events List */}
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>My Events</h2>
        {dashboard?.events?.length === 0 ? (
          <p style={{ color: '#666' }}>No events created yet. <Link to="/organizer/events/create">Create your first event</Link></p>
        ) : (
          <div>
            {dashboard?.events?.map((event) => (
              <div key={event._id} style={eventCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{event.eventName}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                      {event.eventType} • {event.registrationCount} registrations
                    </p>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                      {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: '#f5f5f5',
                      color: statusColors[event.status] || '#333'
                    }}>
                      {event.status}
                    </span>
                    <Link to={`/organizer/events/${event._id}`} style={{ color: '#333', fontSize: '14px' }}>
                      Manage
                    </Link>
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

export default OrganizerDashboard;
