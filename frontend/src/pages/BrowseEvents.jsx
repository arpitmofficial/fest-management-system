import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const BrowseEvents = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    eligibility: '',
    followed: false
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.eligibility) params.append('eligibility', filters.eligibility);
      if (filters.followed) params.append('followed', 'true');

      const { data } = await api.get(`/events?${params.toString()}`);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: '#fff'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Browse Events</h1>

        {/* Search and Filters */}
        <div style={{ marginBottom: '25px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Types</option>
              <option value="normal">Normal Events</option>
              <option value="merchandise">Merchandise</option>
            </select>

            <select
              value={filters.eligibility}
              onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">All Eligibility</option>
              <option value="all">Open to All</option>
              <option value="iiit-only">IIIT Only</option>
              <option value="non-iiit-only">Non-IIIT Only</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={filters.followed}
                onChange={(e) => setFilters({ ...filters, followed: e.target.checked })}
              />
              Followed Clubs Only
            </label>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: '#666' }}>No events found.</p>
        ) : (
          <div>
            {events.map((event) => (
              <div key={event._id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{event.eventName}</h3>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                      {event.organizer?.organizerName} • {event.eventType}
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                      {event.eventDescription?.substring(0, 150)}...
                    </p>
                    <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>
                      {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                      {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                    </p>
                    <Link
                      to={`/events/${event._id}`}
                      style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
                    >
                      View Details
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

export default BrowseEvents;
