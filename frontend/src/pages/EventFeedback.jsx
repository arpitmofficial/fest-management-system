import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const EventFeedback = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvent();
    fetchFeedbacks();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get(`/feedback/${id}`);
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await api.post(`/feedback/${id}`, formData);
      setMessage('Feedback submitted anonymously. Thank you!');
      setSubmitted(true);
      setFormData({ rating: 5, comment: '' });
      fetchFeedbacks();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const calculateAverage = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

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
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '30px 20px' }}>
        <Link to={`/events/${id}`} style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Event
        </Link>
        
        <h1 style={{ fontSize: '24px', marginTop: '15px', marginBottom: '5px' }}>Feedback</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>{event?.eventName}</p>

        {/* Summary */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', textAlign: 'center', minWidth: '100px' }}>
            <p style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 5px 0', color: '#f9a825' }}>{calculateAverage()}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Average Rating</p>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', textAlign: 'center', minWidth: '100px' }}>
            <p style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 5px 0' }}>{feedbacks.length}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Reviews</p>
          </div>
        </div>

        {/* Submit Feedback */}
        {!submitted && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px', marginBottom: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Share Your Experience (Anonymous)</h3>
            
            {message && (
              <p style={{ padding: '10px', backgroundColor: message.includes('Thank') ? '#e8f5e9' : '#ffebee', borderRadius: '4px', marginBottom: '15px' }}>
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', marginBottom: '15px' }}>
                Rating
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        padding: '8px 12px',
                        border: formData.rating >= star ? '2px solid #f9a825' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: formData.rating >= star ? '#fff8e1' : '#fff',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </label>

              <label style={{ display: 'block', marginBottom: '20px' }}>
                Comment (optional)
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Share your thoughts about the event..."
                  style={{ ...inputStyle, minHeight: '100px' }}
                />
              </label>

              <button type="submit" style={buttonStyle}>Submit Feedback</button>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                Your feedback is completely anonymous.
              </p>
            </form>
          </div>
        )}

        {/* Feedback List */}
        <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>All Reviews</h3>
        {feedbacks.length === 0 ? (
          <p style={{ color: '#666' }}>No feedback yet. Be the first to share!</p>
        ) : (
          <div>
            {feedbacks.map((feedback, i) => (
              <div key={i} style={{ border: '1px solid #eee', borderRadius: '4px', padding: '15px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#f9a825', fontSize: '16px' }}>{renderStars(feedback.rating)}</span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {feedback.comment && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{feedback.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFeedback;
