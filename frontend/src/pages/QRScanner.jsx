import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';

const QRScanner = () => {
  const { id } = useParams(); // Event ID
  const [event, setEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    return () => stopCamera();
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      scanQRCode();
    } catch (error) {
      setResult({ success: false, message: 'Camera access denied. Use manual entry.' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use jsQR library if available, otherwise manual entry only
      // For simplicity, we'll rely on manual entry or integrate jsQR later
    }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const verifyTicket = async (codeInput) => {
    try {
      // Try to parse as JSON (from QR code scan)
      let ticketId = codeInput;
      try {
        const parsed = JSON.parse(codeInput);
        ticketId = parsed.ticketId || codeInput;
      } catch {
        // Not JSON, use as-is (manual ticket code entry)
      }

      const { data } = await api.post('/tickets/verify', { ticketId, eventId: id });
      const ticket = data.ticket;
      setResult({
        success: true,
        message: data.alreadyAttended 
          ? `⚠ ${ticket.participant.firstName} ${ticket.participant.lastName} - Already attended`
          : `✓ ${ticket.participant.firstName} ${ticket.participant.lastName}`,
        details: ticket,
        alreadyAttended: data.alreadyAttended
      });
      setRecentScans(prev => [{
        name: `${ticket.participant.firstName} ${ticket.participant.lastName}`,
        time: new Date().toLocaleTimeString(),
        success: true
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Invalid ticket'
      });
      setRecentScans(prev => [{
        name: 'Invalid scan',
        time: new Date().toLocaleTimeString(),
        success: false
      }, ...prev.slice(0, 9)]);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyTicket(manualCode.trim());
      setManualCode('');
    }
  };

  const markAttendance = async () => {
    if (!result?.details?._id) return;
    try {
      await api.put(`/tickets/${result.details._id}/attend`);
      setResult(prev => ({
        ...prev,
        message: `✓ ${result.details.participant.firstName} ${result.details.participant.lastName} - Attendance Marked!`,
        alreadyAttended: true
      }));
    } catch (error) {
      setResult(prev => ({
        ...prev,
        message: prev.message + ' - Already attended'
      }));
    }
  };

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' };
  const buttonStyle = { padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' };

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
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px 20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>QR Scanner</h1>
        <p style={{ color: '#666', marginBottom: '25px' }}>{event?.eventName}</p>

        {/* Camera Scanner */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Camera Scanner</h3>
          
          {scanning ? (
            <div>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <video ref={videoRef} style={{ width: '100%', borderRadius: '4px' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <button onClick={stopCamera} style={{ ...buttonStyle, backgroundColor: '#c62828' }}>
                Stop Camera
              </button>
            </div>
          ) : (
            <button onClick={startCamera} style={buttonStyle}>
              Start Camera
            </button>
          )}
          
          <p style={{ fontSize: '13px', color: '#888', marginTop: '10px' }}>
            Note: For best results, ensure good lighting and hold the QR code steady.
          </p>
        </div>

        {/* Manual Entry */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Manual Entry</h3>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter ticket code or QR data"
              style={inputStyle}
            />
            <button type="submit" style={buttonStyle}>Verify</button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            border: `2px solid ${result.success ? '#2e7d32' : '#c62828'}`,
            borderRadius: '4px',
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: result.success ? '#e8f5e9' : '#ffebee'
          }}>
            <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 10px 0' }}>
              {result.message}
            </p>
            {result.success && result.details && (
              <div>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  Ticket: {result.details.ticketId}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  Email: {result.details.participant?.email}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  Status: {result.details.status}
                </p>
                {!result.alreadyAttended && (
                  <button onClick={markAttendance} style={{ ...buttonStyle, marginTop: '10px', backgroundColor: '#2e7d32' }}>
                    Mark Attendance
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Recent Scans</h3>
            {recentScans.map((scan, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < recentScans.length - 1 ? '1px solid #eee' : 'none' }}>
                <span style={{ color: scan.success ? '#2e7d32' : '#c62828' }}>{scan.name}</span>
                <span style={{ color: '#888', fontSize: '13px' }}>{scan.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
