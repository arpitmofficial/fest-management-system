import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CreateEvent = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [eventData, setEventData] = useState({
    eventName: '',
    eventDescription: '',
    eventType: 'normal',
    eligibility: 'all',
    registrationDeadline: '',
    eventStartDate: '',
    eventEndDate: '',
    registrationLimit: '',
    registrationFee: 0,
    eventTags: '',
    customFields: [],
    merchandiseVariants: []
  });

  const [newField, setNewField] = useState({
    fieldName: '',
    fieldType: 'text',
    required: false,
    options: ''
  });

  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    stock: 0,
    price: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const addCustomField = () => {
    if (!newField.fieldName) return;
    setEventData({
      ...eventData,
      customFields: [
        ...eventData.customFields,
        {
          ...newField,
          options: newField.options.split(',').map(o => o.trim()).filter(o => o),
          order: eventData.customFields.length
        }
      ]
    });
    setNewField({ fieldName: '', fieldType: 'text', required: false, options: '' });
  };

  const removeField = (index) => {
    setEventData({
      ...eventData,
      customFields: eventData.customFields.filter((_, i) => i !== index)
    });
  };

  const addVariant = () => {
    if (!newVariant.price) return;
    setEventData({
      ...eventData,
      merchandiseVariants: [...eventData.merchandiseVariants, newVariant]
    });
    setNewVariant({ size: '', color: '', stock: 0, price: 0 });
  };

  const removeVariant = (index) => {
    setEventData({
      ...eventData,
      merchandiseVariants: eventData.merchandiseVariants.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (publish = false) => {
    setMessage('');
    try {
      const payload = {
        ...eventData,
        registrationLimit: eventData.registrationLimit ? parseInt(eventData.registrationLimit) : null,
        registrationFee: parseFloat(eventData.registrationFee) || 0,
        eventTags: eventData.eventTags.split(',').map(t => t.trim()).filter(t => t)
      };

      const { data } = await api.post('/events', payload);

      if (publish) {
        await api.put(`/events/${data._id}/publish`);
        setMessage('Event created and published!');
      } else {
        setMessage('Event saved as draft!');
      }

      setTimeout(() => navigate('/organizer/dashboard'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to create event');
    }
  };

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' };
  const labelStyle = { display: 'block', marginBottom: '15px', fontSize: '14px' };
  const buttonStyle = { padding: '10px 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '25px' }}>Create Event</h1>

        {message && (
          <p style={{ padding: '10px', backgroundColor: message.includes('!') ? '#e8f5e9' : '#ffebee', borderRadius: '4px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Basic Information</h3>
            
            <label style={labelStyle}>
              Event Name *
              <input type="text" name="eventName" value={eventData.eventName} onChange={handleChange} style={inputStyle} required />
            </label>

            <label style={labelStyle}>
              Description *
              <textarea name="eventDescription" value={eventData.eventDescription} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px' }} required />
            </label>

            <label style={labelStyle}>
              Event Type *
              <select name="eventType" value={eventData.eventType} onChange={handleChange} style={inputStyle}>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </label>

            <label style={labelStyle}>
              Eligibility
              <select name="eligibility" value={eventData.eligibility} onChange={handleChange} style={inputStyle}>
                <option value="all">Open to All</option>
                <option value="iiit-only">IIIT Students Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
              </select>
            </label>

            <label style={labelStyle}>
              Tags (comma separated)
              <input type="text" name="eventTags" value={eventData.eventTags} onChange={handleChange} style={inputStyle} placeholder="e.g., technical, workshop, coding" />
            </label>

            <button onClick={() => setStep(2)} style={buttonStyle}>Next: Schedule & Pricing</button>
          </div>
        )}

        {/* Step 2: Schedule & Pricing */}
        {step === 2 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Schedule & Pricing</h3>

            <label style={labelStyle}>
              Event Start Date *
              <input type="datetime-local" name="eventStartDate" value={eventData.eventStartDate} onChange={handleChange} style={inputStyle} required />
            </label>

            <label style={labelStyle}>
              Event End Date *
              <input type="datetime-local" name="eventEndDate" value={eventData.eventEndDate} onChange={handleChange} style={inputStyle} required />
            </label>

            <label style={labelStyle}>
              Registration Deadline *
              <input type="datetime-local" name="registrationDeadline" value={eventData.registrationDeadline} onChange={handleChange} style={inputStyle} required />
            </label>

            <label style={labelStyle}>
              Registration Limit (leave empty for unlimited)
              <input type="number" name="registrationLimit" value={eventData.registrationLimit} onChange={handleChange} style={inputStyle} min="1" />
            </label>

            <label style={labelStyle}>
              Registration Fee (₹)
              <input type="number" name="registrationFee" value={eventData.registrationFee} onChange={handleChange} style={inputStyle} min="0" />
            </label>

            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setStep(1)} style={{ ...buttonStyle, backgroundColor: '#666' }}>Back</button>
              <button onClick={() => setStep(3)} style={buttonStyle}>
                Next: {eventData.eventType === 'merchandise' ? 'Variants' : 'Registration Form'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Custom Form / Merchandise Variants */}
        {step === 3 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '25px' }}>
            {eventData.eventType === 'normal' ? (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Custom Registration Form (Optional)</h3>
                
                {/* Existing Fields */}
                {eventData.customFields.map((field, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                    <span>{field.fieldName} ({field.fieldType}) {field.required && '*'}</span>
                    <button onClick={() => removeField(index)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}

                {/* Add New Field */}
                <div style={{ border: '1px dashed #ddd', borderRadius: '4px', padding: '15px', marginTop: '15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '500' }}>Add Field</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Field Name" value={newField.fieldName} onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })} style={inputStyle} />
                    <select value={newField.fieldType} onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })} style={inputStyle}>
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  {(newField.fieldType === 'dropdown' || newField.fieldType === 'checkbox' || newField.fieldType === 'radio') && (
                    <input type="text" placeholder="Options (comma separated)" value={newField.options} onChange={(e) => setNewField({ ...newField, options: e.target.value })} style={{ ...inputStyle, marginTop: '10px' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                      <input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />
                      Required
                    </label>
                    <button onClick={addCustomField} style={{ ...buttonStyle, padding: '8px 15px' }}>Add Field</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Merchandise Variants</h3>
                
                {/* Existing Variants */}
                {eventData.merchandiseVariants.map((variant, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                    <span>{variant.size} {variant.color} - ₹{variant.price} ({variant.stock} in stock)</span>
                    <button onClick={() => removeVariant(index)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>Remove</button>
                  </div>
                ))}

                {/* Add New Variant */}
                <div style={{ border: '1px dashed #ddd', borderRadius: '4px', padding: '15px', marginTop: '15px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '500' }}>Add Variant</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} style={inputStyle} />
                    <input type="text" placeholder="Color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} style={inputStyle} />
                    <input type="number" placeholder="Stock" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })} style={inputStyle} min="0" />
                    <input type="number" placeholder="Price" value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })} style={inputStyle} min="0" />
                  </div>
                  <button onClick={addVariant} style={{ ...buttonStyle, padding: '8px 15px', marginTop: '10px' }}>Add Variant</button>
                </div>
              </>
            )}

            <div style={{ marginTop: '25px' }}>
              <button onClick={() => setStep(2)} style={{ ...buttonStyle, backgroundColor: '#666' }}>Back</button>
              <button onClick={() => handleSubmit(false)} style={{ ...buttonStyle, backgroundColor: '#666' }}>Save as Draft</button>
              <button onClick={() => handleSubmit(true)} style={buttonStyle}>Create & Publish</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
