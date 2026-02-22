import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ManageEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  
  // Form editing state
  const [editingForm, setEditingForm] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text',
    required: false,
    options: ''
  });

  useEffect(() => {
    fetchEvent();
    fetchParticipants();
    fetchAnalytics();
    fetchFeedbacks();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
      setCustomFields(data.customFields || []);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data } = await api.get(`/events/${id}/participants`);
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get(`/events/${id}/analytics`);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const handlePublish = async () => {
    try {
      await api.put(`/events/${id}/publish`);
      setMessage('Event published!');
      fetchEvent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to publish');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/events/${id}`, { status: newStatus });
      setMessage(`Event marked as ${newStatus}`);
      fetchEvent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePaymentAction = async (ticketId, status) => {
    try {
      await api.put(`/tickets/${ticketId}/payment`, { status });
      setMessage(`Payment ${status}`);
      fetchParticipants();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Action failed');
    }
  };

  const handleMarkAttendance = async (ticketId) => {
    try {
      await api.put(`/tickets/${ticketId}/attend`);
      setMessage('Attendance marked');
      fetchParticipants();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Contact', 'Registration Date', 'Status', 'Attended'];
    const rows = participants.map(t => [
      `${t.participant?.firstName} ${t.participant?.lastName}`,
      t.participant?.email,
      t.participant?.contactNumber,
      new Date(t.createdAt).toLocaleDateString(),
      t.status,
      t.attended ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.eventName}-participants.csv`;
    a.click();
  };

  // Form editing functions
  const addCustomField = () => {
    if (!newField.fieldName) return;
    const field = {
      ...newField,
      options: newField.options ? newField.options.split(',').map(o => o.trim()) : [],
      order: customFields.length
    };
    setCustomFields([...customFields, field]);
    setNewField({ fieldName: '', fieldType: 'text', required: false, options: '' });
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const saveFormChanges = async () => {
    try {
      console.log('Saving customFields:', customFields);
      await api.put(`/events/${id}`, { customFields });
      setMessage('Form updated successfully');
      setEditingForm(false);
      fetchEvent();
    } catch (error) {
      console.error('Save form error:', error.response?.data);
      setMessage(error.response?.data?.error || error.response?.data?.message || 'Failed to update form');
    }
  };

  const canEditForm = !event?.formLocked && event?.registrationCount === 0;

  const tabStyle = (active) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: active ? '2px solid #333' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: active ? '#333' : '#666'
  });

  const statCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '15px',
    textAlign: 'center',
    minWidth: '100px'
  };

  if (loading || !event) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>{event?.eventName}</h1>
            <p style={{ color: '#666', margin: 0 }}>{event?.eventType} • {event?.status}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {event?.status === 'draft' && (
              <button onClick={handlePublish} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Publish
              </button>
            )}
            {event?.status === 'published' && (
              <button onClick={() => handleStatusChange('ongoing')} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Mark Ongoing
              </button>
            )}
            {(event?.status === 'ongoing' || event?.status === 'published') && (
              <button onClick={() => handleStatusChange('completed')} style={{ padding: '8px 16px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Mark Completed
              </button>
            )}
          </div>
        </div>

        {message && (
          <p style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Overview</button>
            <button style={tabStyle(activeTab === 'participants')} onClick={() => setActiveTab('participants')}>Participants</button>
            <button style={tabStyle(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>Analytics</button>
            <button style={tabStyle(activeTab === 'form')} onClick={() => setActiveTab('form')}>Form</button>
          </div>
          <Link 
            to={`/organizer/events/${id}/scan`}
            style={{ padding: '8px 16px', backgroundColor: '#1565c0', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}
          >
            QR Scanner
          </Link>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Event Details</h3>
                <p><strong>Type:</strong> {event?.eventType}</p>
                <p><strong>Eligibility:</strong> {event?.eligibility}</p>
                <p><strong>Start:</strong> {new Date(event?.eventStartDate).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(event?.eventEndDate).toLocaleString()}</p>
                <p><strong>Deadline:</strong> {new Date(event?.registrationDeadline).toLocaleString()}</p>
                <p><strong>Fee:</strong> {event?.registrationFee > 0 ? `₹${event?.registrationFee}` : 'Free'}</p>
                <p><strong>Limit:</strong> {event?.registrationLimit || 'Unlimited'}</p>
              </div>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Description</h3>
                <p style={{ lineHeight: '1.6' }}>{event?.eventDescription}</p>
                {event?.eventTags?.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <strong>Tags:</strong> {event.eventTags.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ margin: 0 }}>{participants.length} registrations</p>
              <button onClick={exportCSV} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Export CSV
              </button>
            </div>

            {participants.length === 0 ? (
              <p style={{ color: '#666' }}>No registrations yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '14px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '14px' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '14px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px', fontSize: '14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((ticket) => (
                    <tr key={ticket._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', fontSize: '14px' }}>
                        {ticket.participant?.firstName} {ticket.participant?.lastName}
                      </td>
                      <td style={{ padding: '10px', fontSize: '14px' }}>{ticket.participant?.email}</td>
                      <td style={{ padding: '10px', fontSize: '14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: ticket.status === 'confirmed' ? '#e8f5e9' : 
                                           ticket.status === 'pending' ? '#fff3e0' :
                                           ticket.status === 'attended' ? '#e3f2fd' : '#ffebee'
                        }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '14px' }}>
                        {event?.eventType === 'merchandise' && ticket.merchandiseDetails?.paymentStatus === 'pending' && (
                          <>
                            <button onClick={() => handlePaymentAction(ticket._id, 'approved')} style={{ marginRight: '5px', padding: '4px 8px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Approve
                            </button>
                            <button onClick={() => handlePaymentAction(ticket._id, 'rejected')} style={{ padding: '4px 8px', backgroundColor: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Reject
                            </button>
                          </>
                        )}
                        {ticket.status === 'confirmed' && !ticket.attended && (
                          <button onClick={() => handleMarkAttendance(ticket._id)} style={{ padding: '4px 8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Mark Present
                          </button>
                        )}
                        {ticket.attended && <span style={{ color: '#2e7d32' }}>✓ Attended</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={statCardStyle}>
                <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{analytics.totalRegistrations}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Registrations</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{analytics.confirmedRegistrations}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Confirmed</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{analytics.attendedCount}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Attended</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>₹{analytics.revenue}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Revenue</p>
              </div>
              <div style={statCardStyle}>
                <p style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '600' }}>{analytics.viewCount}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Views</p>
              </div>
            </div>

            {/* Feedback Section */}
            {feedbacks.length > 0 && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>
                  Feedback ({feedbacks.length} reviews, Avg: {(feedbacks.reduce((a, f) => a + f.rating, 0) / feedbacks.length).toFixed(1)}★)
                </h3>
                {feedbacks.map((fb, i) => (
                  <div key={i} style={{ border: '1px solid #eee', borderRadius: '4px', padding: '15px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#f9a825' }}>{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    {fb.comment && <p style={{ margin: 0, fontSize: '14px' }}>{fb.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Tab */}
        {activeTab === 'form' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Custom Registration Form Fields</h3>
              {canEditForm && !editingForm && (
                <button 
                  onClick={() => setEditingForm(true)}
                  style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Edit Form
                </button>
              )}
            </div>

            {!canEditForm && (
              <p style={{ color: '#666', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
                Form editing is locked because {event?.formLocked ? 'the form has been locked manually' : 'there are registrations for this event'}.
              </p>
            )}

            {customFields.length === 0 && !editingForm ? (
              <p style={{ color: '#666' }}>No custom fields defined. Participants will only fill basic registration info.</p>
            ) : (
              <div>
                {customFields.map((field, index) => (
                  <div key={index} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>{field.fieldName} {field.required && <span style={{ color: 'red' }}>*</span>}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                        Type: {field.fieldType}
                        {field.options?.length > 0 && ` | Options: ${field.options.join(', ')}`}
                      </p>
                    </div>
                    {editingForm && (
                      <button 
                        onClick={() => removeCustomField(index)}
                        style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {editingForm && (
              <div style={{ marginTop: '20px', border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Add New Field</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Field Name</label>
                    <input 
                      type="text"
                      value={newField.fieldName}
                      onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      placeholder="e.g., College Name"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Type</label>
                    <select 
                      value={newField.fieldType}
                      onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                      Options (comma sep, for dropdown)
                    </label>
                    <input 
                      type="text"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      placeholder="Option1, Option2"
                      disabled={newField.fieldType !== 'dropdown' && newField.fieldType !== 'checkbox'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                      <input 
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                      />
                      Required
                    </label>
                    <button 
                      onClick={addCustomField}
                      style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={saveFormChanges}
                    style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                  <button 
                    onClick={() => { setEditingForm(false); setCustomFields(event?.customFields || []); }}
                    style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvent;
