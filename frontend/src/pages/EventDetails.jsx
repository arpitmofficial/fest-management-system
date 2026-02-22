import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { downloadICS, openGoogleCalendar } from '../utils/calendar';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvent();
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

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setRegistering(true);
    setMessage('');

    try {
      if (event.eventType === 'merchandise') {
        // Purchase merchandise
        await api.post(`/tickets/purchase/${id}`, {
          variantId: formData.variantId,
          quantity: formData.quantity || 1
        });
      } else {
        // Normal registration
        console.log('Registering with formData:', formData);
        await api.post(`/tickets/register/${id}`, { formData });
      }
      setMessage('Registration successful! Check your tickets.');
      setTimeout(() => navigate('/participant/dashboard'), 2000);
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      setMessage(error.response?.data?.error || error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <Navbar />
        <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
        <Navbar />
        <div style={{ padding: '50px', textAlign: 'center' }}>Event not found</div>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
  const isLimitReached = event.registrationLimit && event.registrationCount >= event.registrationLimit;
  const canRegister = event.status === 'published' && !isDeadlinePassed && !isLimitReached && user?.role === 'participant';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <span style={{ 
            display: 'inline-block', 
            padding: '4px 10px', 
            backgroundColor: event.eventType === 'merchandise' ? '#e3f2fd' : '#e8f5e9',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '10px'
          }}>
            {event.eventType.toUpperCase()}
          </span>
          <h1 style={{ fontSize: '28px', margin: '10px 0' }}>{event.eventName}</h1>
          <p style={{ color: '#666', margin: '0' }}>
            Organized by <strong>{event.organizer?.organizerName}</strong> ({event.organizer?.category})
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#444' }}>{event.eventDescription}</p>

            {event.eventTags?.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Tags</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {event.eventTags.map((tag, i) => (
                    <span key={i} style={{ padding: '4px 10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '13px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom registration form for normal events */}
            {canRegister && event.eventType === 'normal' && event.customFields?.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Registration Form</h3>
                <form onSubmit={handleRegister}>
                  {event.customFields.map((field) => (
                    <div key={field._id} style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        {field.fieldName} {field.required && '*'}
                      </label>
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      )}
                      {field.fieldType === 'textarea' && (
                        <textarea
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
                        />
                      )}
                      {(field.fieldType === 'dropdown' || field.fieldType === 'select') && (
                        <select
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.fieldType === 'checkbox' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {field.options?.length > 0 ? (
                            field.options.map((opt, i) => (
                              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                <input
                                  type="checkbox"
                                  value={opt}
                                  onChange={(e) => {
                                    const current = formData[field.fieldName] || [];
                                    const updated = e.target.checked
                                      ? [...current, opt]
                                      : current.filter(v => v !== opt);
                                    setFormData({ ...formData, [field.fieldName]: updated });
                                  }}
                                />
                                {opt}
                              </label>
                            ))
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                              <input
                                type="checkbox"
                                onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.checked })}
                              />
                              Yes
                            </label>
                          )}
                        </div>
                      )}
                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      )}
                      {field.fieldType === 'date' && (
                        <input
                          type="date"
                          required={field.required}
                          onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={registering}
                    style={{ padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {registering ? 'Registering...' : 'Register Now'}
                  </button>
                </form>
              </div>
            )}

            {/* Merchandise variants */}
            {canRegister && event.eventType === 'merchandise' && event.merchandiseVariants?.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Select Variant</h3>
                <form onSubmit={handleRegister}>
                  <select
                    required
                    onChange={(e) => setFormData({ ...formData, variantId: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px' }}
                  >
                    <option value="">Select variant...</option>
                    {event.merchandiseVariants.map((v) => (
                      <option key={v._id} value={v._id} disabled={v.stock === 0}>
                        {v.size} {v.color} - ₹{v.price} ({v.stock} in stock)
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={registering}
                    style={{ padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {registering ? 'Processing...' : 'Purchase'}
                  </button>
                </form>
              </div>
            )}

            {/* Simple register button for events without custom form */}
            {canRegister && event.eventType === 'normal' && (!event.customFields || event.customFields.length === 0) && (
              <div style={{ marginTop: '30px' }}>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  style={{ padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              </div>
            )}

            {message && (
              <p style={{ marginTop: '15px', color: message.includes('successful') ? 'green' : 'red' }}>
                {message}
              </p>
            )}
          </div>

          <div>
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Event Details</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Start Date</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{new Date(event.eventStartDate).toLocaleDateString()}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>End Date</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{new Date(event.eventEndDate).toLocaleDateString()}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Registration Deadline</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{new Date(event.registrationDeadline).toLocaleDateString()}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Fee</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Eligibility</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{event.eligibility === 'all' ? 'Open to All' : event.eligibility}</p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Registrations</p>
                <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>
                  {event.registrationCount}{event.registrationLimit ? ` / ${event.registrationLimit}` : ''}
                </p>
              </div>

              {isDeadlinePassed && (
                <p style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '13px', color: '#c62828' }}>
                  Registration deadline has passed
                </p>
              )}

              {isLimitReached && (
                <p style={{ marginTop: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '13px', color: '#c62828' }}>
                  Registration limit reached
                </p>
              )}

              {/* Calendar Export */}
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>Add to Calendar</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => openGoogleCalendar(event)}
                    style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}
                  >
                    Google
                  </button>
                  <button
                    onClick={() => downloadICS(event)}
                    style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#fff' }}
                  >
                    .ics File
                  </button>
                </div>
              </div>

              {/* Feedback Link */}
              {event.status === 'completed' && (
                <Link
                  to={`/events/${id}/feedback`}
                  style={{ display: 'block', marginTop: '15px', padding: '10px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '4px', color: '#333', textDecoration: 'none', fontSize: '14px' }}
                >
                  Leave Feedback
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
