import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ParticipantDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/tickets/my-tickets');
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const upcomingTickets = tickets.filter(t => 
    t.status !== 'cancelled' && t.status !== 'rejected' && new Date(t.event?.eventStartDate) > now
  );
  const normalTickets = tickets.filter(t => t.event?.eventType === 'normal');
  const merchandiseTickets = tickets.filter(t => t.event?.eventType === 'merchandise');
  const completedTickets = tickets.filter(t => 
    t.status === 'attended' || new Date(t.event?.eventEndDate) < now
  );
  const cancelledTickets = tickets.filter(t => t.status === 'cancelled' || t.status === 'rejected');

  const tabStyle = (active) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: active ? '2px solid #333' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: active ? '#333' : '#666'
  });

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px'
  };

  const getDisplayTickets = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingTickets;
      case 'normal': return normalTickets;
      case 'merchandise': return merchandiseTickets;
      case 'completed': return completedTickets;
      case 'cancelled': return cancelledTickets;
      default: return upcomingTickets;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Welcome, {user?.firstName}!</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Here are your registered events and tickets.</p>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: '25px' }}>
          <button style={tabStyle(activeTab === 'upcoming')} onClick={() => setActiveTab('upcoming')}>
            Upcoming ({upcomingTickets.length})
          </button>
          <button style={tabStyle(activeTab === 'normal')} onClick={() => setActiveTab('normal')}>
            Normal ({normalTickets.length})
          </button>
          <button style={tabStyle(activeTab === 'merchandise')} onClick={() => setActiveTab('merchandise')}>
            Merchandise ({merchandiseTickets.length})
          </button>
          <button style={tabStyle(activeTab === 'completed')} onClick={() => setActiveTab('completed')}>
            Completed ({completedTickets.length})
          </button>
          <button style={tabStyle(activeTab === 'cancelled')} onClick={() => setActiveTab('cancelled')}>
            Cancelled ({cancelledTickets.length})
          </button>
        </div>

        {/* Tickets List */}
        {loading ? (
          <p>Loading...</p>
        ) : getDisplayTickets().length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No tickets in this category.</p>
            <Link to="/events" style={{ color: '#333' }}>Browse Events</Link>
          </div>
        ) : (
          <div>
            {getDisplayTickets().map((ticket) => (
              <div key={ticket._id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{ticket.event?.eventName}</h3>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                      {ticket.event?.organizer?.organizerName} • {ticket.event?.eventType}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>
                      {new Date(ticket.event?.eventStartDate).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>
                      Ticket ID: {ticket.ticketId}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: ticket.status === 'confirmed' ? '#e8f5e9' : 
                                       ticket.status === 'pending' ? '#fff3e0' :
                                       ticket.status === 'attended' ? '#e3f2fd' : '#ffebee',
                      color: ticket.status === 'confirmed' ? '#2e7d32' :
                             ticket.status === 'pending' ? '#ef6c00' :
                             ticket.status === 'attended' ? '#1565c0' : '#c62828'
                    }}>
                      {ticket.status}
                    </span>
                    {ticket.qrCode && (
                      <div style={{ marginTop: '10px' }}>
                        <img src={ticket.qrCode} alt="QR Code" style={{ width: '80px', height: '80px' }} />
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

export default ParticipantDashboard;
