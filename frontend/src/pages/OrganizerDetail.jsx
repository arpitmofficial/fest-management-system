import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const OrganizerDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [organizer, setOrganizer] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        fetchOrganizer();
        fetchOrganizerEvents();
        fetchFollowStatus();
    }, [id]);

    const fetchOrganizer = async () => {
        try {
            const { data } = await api.get(`/participants/organizers`);
            const org = data.find(o => o._id === id);
            setOrganizer(org);
        } catch (error) {
            console.error('Error fetching organizer:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizerEvents = async () => {
        try {
            const { data } = await api.get(`/events?organizer=${id}`);
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchFollowStatus = async () => {
        try {
            const { data } = await api.get('/participants/profile');
            const followedIds = (data.followedOrganizers || []).map(o => o._id || o);
            setIsFollowing(followedIds.includes(id));
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const handleFollow = async () => {
        try {
            const { data } = await api.put(`/participants/follow/${id}`);
            setIsFollowing(data.followedOrganizers.includes(id));
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.eventStartDate) > now);
    const pastEvents = events.filter(e => new Date(e.eventEndDate) < now || e.status === 'completed');

    const tabStyle = (active) => ({
        padding: '10px 20px',
        border: 'none',
        borderBottom: active ? '2px solid #333' : '2px solid transparent',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        color: active ? '#333' : '#666'
    });

    const eventCardStyle = {
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '15px',
        marginBottom: '10px',
        textDecoration: 'none',
        color: '#333',
        display: 'block'
    };

    const buttonStyle = {
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        border: '1px solid #333'
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
                <Navbar />
                <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
            </div>
        );
    }

    if (!organizer) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
                <Navbar />
                <div style={{ padding: '50px', textAlign: 'center' }}>Organizer not found.</div>
            </div>
        );
    }

    const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
            <Navbar />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
                <Link to="/clubs" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
                    ← Back to Clubs
                </Link>

                {/* Organizer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '20px', marginBottom: '25px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>{organizer.organizerName}</h1>
                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>{organizer.category}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{organizer.description || 'No description available.'}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Contact: {organizer.contactEmail}</p>
                    </div>
                    <button
                        onClick={handleFollow}
                        style={{
                            ...buttonStyle,
                            backgroundColor: isFollowing ? '#fff' : '#333',
                            color: isFollowing ? '#333' : '#fff'
                        }}
                    >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                </div>

                {/* Events Tabs */}
                <div style={{ borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                    <button style={tabStyle(activeTab === 'upcoming')} onClick={() => setActiveTab('upcoming')}>
                        Upcoming ({upcomingEvents.length})
                    </button>
                    <button style={tabStyle(activeTab === 'past')} onClick={() => setActiveTab('past')}>
                        Past ({pastEvents.length})
                    </button>
                </div>

                {/* Events List */}
                {displayEvents.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '30px' }}>
                        No {activeTab} events.
                    </p>
                ) : (
                    <div>
                        {displayEvents.map((event) => (
                            <Link key={event._id} to={`/events/${event._id}`} style={eventCardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{event.eventName}</h3>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                                            {event.eventType} • {event.eligibility}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '13px' }}>
                                            {new Date(event.eventStartDate).toLocaleDateString()} – {new Date(event.eventEndDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        backgroundColor: '#f5f5f5',
                                        color: event.registrationFee > 0 ? '#333' : '#2e7d32'
                                    }}>
                                        {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerDetail;
