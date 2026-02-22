import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Onboarding = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [interests, setInterests] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [followedIds, setFollowedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const interestOptions = [
        'Coding', 'Music', 'Dance', 'Art', 'Sports',
        'Photography', 'Drama', 'Quiz', 'Robotics', 'Gaming',
        'Debate', 'Literature', 'Design', 'Fashion', 'Film',
        'Astronomy', 'Entrepreneurship', 'Social Service'
    ];

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const { data } = await api.get('/participants/organizers');
            setOrganizers(data);
        } catch (error) {
            console.error('Error fetching organizers:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleFollow = (orgId) => {
        setFollowedIds(prev =>
            prev.includes(orgId)
                ? prev.filter(id => id !== orgId)
                : [...prev, orgId]
        );
    };

    const handleFinish = async () => {
        try {
            // Save interests
            await api.put('/participants/profile', { interests });

            // Follow selected organizers
            for (const orgId of followedIds) {
                await api.put(`/participants/follow/${orgId}`);
            }

            navigate('/participant/dashboard');
        } catch (error) {
            console.error('Onboarding error:', error);
            navigate('/participant/dashboard');
        }
    };

    const chipStyle = (selected) => ({
        display: 'inline-block',
        padding: '8px 16px',
        margin: '5px',
        borderRadius: '20px',
        border: selected ? '2px solid #333' : '1px solid #ddd',
        backgroundColor: selected ? '#333' : '#fff',
        color: selected ? '#fff' : '#333',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s ease'
    });

    const buttonStyle = {
        padding: '12px 24px',
        backgroundColor: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '10px'
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
            <Navbar />
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome to Felicity! 🎉</h1>
                    <p style={{ color: '#666', fontSize: '16px' }}>Let&apos;s personalize your experience</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: step >= 1 ? '#333' : '#ddd' }} />
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: step >= 2 ? '#333' : '#ddd' }} />
                    </div>
                </div>

                {/* Step 1: Select Interests */}
                {step === 1 && (
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>What are you interested in?</h2>
                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                            Select your interests so we can recommend relevant events.
                        </p>

                        <div style={{ marginBottom: '25px' }}>
                            {interestOptions.map((interest) => (
                                <span
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    style={chipStyle(interests.includes(interest))}
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>

                        <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
                            {interests.length} selected
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={() => navigate('/participant/dashboard')}
                                style={{ ...buttonStyle, backgroundColor: '#999' }}
                            >
                                Skip for now
                            </button>
                            <button onClick={() => setStep(2)} style={buttonStyle}>
                                Next: Follow Clubs →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Follow Clubs */}
                {step === 2 && (
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Follow Clubs & Organizers</h2>
                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                            Follow clubs to see their events first in your feed.
                        </p>

                        {loading ? (
                            <p>Loading clubs...</p>
                        ) : (
                            <div>
                                {organizers.map((org) => {
                                    const isFollowed = followedIds.includes(org._id);
                                    return (
                                        <div
                                            key={org._id}
                                            onClick={() => handleFollow(org._id)}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '15px',
                                                border: isFollowed ? '2px solid #333' : '1px solid #ddd',
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                                cursor: 'pointer',
                                                backgroundColor: isFollowed ? '#f5f5f5' : '#fff',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div>
                                                <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '16px' }}>
                                                    {org.organizerName}
                                                </p>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                                                    {org.category} • {org.description?.substring(0, 60) || 'No description'}
                                                </p>
                                            </div>
                                            <span style={{
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                backgroundColor: isFollowed ? '#333' : '#fff',
                                                color: isFollowed ? '#fff' : '#333',
                                                border: '1px solid #333'
                                            }}>
                                                {isFollowed ? '✓ Following' : 'Follow'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <p style={{ color: '#888', fontSize: '13px', margin: '15px 0' }}>
                            {followedIds.length} clubs followed
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                            <button onClick={() => setStep(1)} style={{ ...buttonStyle, backgroundColor: '#666' }}>
                                ← Back
                            </button>
                            <button onClick={handleFinish} style={buttonStyle}>
                                Get Started! 🚀
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
