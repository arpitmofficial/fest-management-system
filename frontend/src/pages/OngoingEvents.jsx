import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const OngoingEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOngoingEvents();
    }, []);

    const fetchOngoingEvents = async () => {
        try {
            const { data } = await api.get('/organizers/dashboard');
            const ongoing = (data.events || []).filter(e => e.status === 'ongoing' || e.status === 'published');
            setEvents(ongoing);
        } catch (error) {
            console.error('Error fetching ongoing events:', error);
        } finally {
            setLoading(false);
        }
    };

    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '20px',
        marginBottom: '15px'
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
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
                <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Ongoing & Published Events</h1>

                {events.length === 0 ? (
                    <p style={{ color: '#666' }}>No ongoing or published events.</p>
                ) : (
                    <div>
                        {events.map((event) => (
                            <div key={event._id} style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{event.eventName}</h3>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
                                            {event.eventType} • {event.registrationCount || 0} registrations
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
                                            backgroundColor: event.status === 'ongoing' ? '#e3f2fd' : '#e8f5e9',
                                            color: event.status === 'ongoing' ? '#1565c0' : '#2e7d32'
                                        }}>
                                            {event.status}
                                        </span>
                                        <Link to={`/organizer/events/${event._id}`} style={{ color: '#333', fontSize: '14px' }}>
                                            Manage →
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

export default OngoingEvents;
