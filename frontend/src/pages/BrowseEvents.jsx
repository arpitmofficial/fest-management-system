import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const BrowseEvents = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    eligibility: '',
    followed: false,
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTrending();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchTrending = async () => {
    try {
      const { data } = await api.get('/events?trending=true');
      setTrendingEvents(data);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.eligibility) params.append('eligibility', filters.eligibility);
      if (filters.followed) params.append('followed', 'true');
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

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

  const trendingCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    minWidth: '250px',
    maxWidth: '280px',
    backgroundColor: '#fff',
    textDecoration: 'none',
    color: '#333',
    display: 'block',
    flexShrink: 0
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Browse Events</h1>

        {/* Trending Section */}
        {trendingEvents.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>🔥 Trending Events</h2>
            <div style={{
              display: 'flex',
              gap: '15px',
              overflowX: 'auto',
              paddingBottom: '10px',
              scrollSnapType: 'x mandatory'
            }}>
              {trendingEvents.map((event) => (
                <Link key={event._id} to={`/events/${event._id}`} style={{ ...trendingCardStyle, scrollSnapAlign: 'start' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>{event.eventName}</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                    {event.organizer?.organizerName} • {event.eventType}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {event.registrationCount || 0} registrations
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: event.registrationFee > 0 ? '#333' : '#2e7d32' }}>
                      {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ marginBottom: '25px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search events, organizers, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
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

            {/* Date Range Filter */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#666' }}>From:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{ padding: '7px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
              <label style={{ fontSize: '13px', color: '#666' }}>To:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{ padding: '7px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>

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
                    {event.eventTags?.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {event.eventTags.map((tag, i) => (
                          <span key={i} style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            margin: '2px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '10px',
                            fontSize: '11px',
                            color: '#666'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
