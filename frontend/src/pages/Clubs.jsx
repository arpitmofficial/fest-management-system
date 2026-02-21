import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Clubs = () => {
  const { user } = useContext(AuthContext);
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    fetchOrganizers();
    fetchProfile();
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

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/participants/profile');
      setFollowedIds(data.followedOrganizers?.map(o => o._id || o) || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      const { data } = await api.put(`/participants/follow/${organizerId}`);
      setFollowedIds(data.followedOrganizers);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const cardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '20px',
    marginBottom: '15px'
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: '1px solid #333',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Clubs & Organizers</h1>

        {loading ? (
          <p>Loading...</p>
        ) : organizers.length === 0 ? (
          <p style={{ color: '#666' }}>No clubs found.</p>
        ) : (
          <div>
            {organizers.map((org) => {
              const isFollowing = followedIds.includes(org._id);
              return (
                <div key={org._id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{org.organizerName}</h3>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>{org.category}</p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{org.description || 'No description available.'}</p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>
                        Contact: {org.contactEmail}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleFollow(org._id)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: isFollowing ? '#fff' : '#333',
                          color: isFollowing ? '#333' : '#fff'
                        }}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
