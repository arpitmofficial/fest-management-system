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
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(null); // ticket ID
  const [overrideReason, setOverrideReason] = useState('');
  const [activeView, setActiveView] = useState('scanner'); // scanner | dashboard
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    fetchAttendanceStats();
    const interval = setInterval(fetchAttendanceStats, 10000); // Poll every 10s
    return () => { stopCamera(); clearInterval(interval); };
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

  const fetchAttendanceStats = async () => {
    try {
      const { data } = await api.get(`/tickets/attendance/${id}`);
      setAttendanceStats(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
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
    }
    if (scanning) requestAnimationFrame(scanQRCode);
  };

  const verifyTicket = async (codeInput) => {
    try {
      let ticketId = codeInput;
      try { const parsed = JSON.parse(codeInput); ticketId = parsed.ticketId || codeInput; } catch { }

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
      }, ...prev.slice(0, 19)]);
    } catch (error) {
      setResult({ success: false, message: error.response?.data?.message || 'Invalid ticket' });
      setRecentScans(prev => [{ name: 'Invalid scan', time: new Date().toLocaleTimeString(), success: false }, ...prev.slice(0, 19)]);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) { verifyTicket(manualCode.trim()); setManualCode(''); }
  };

  const markAttendance = async () => {
    if (!result?.details?._id) return;
    try {
      await api.put(`/tickets/${result.details._id}/attend`);
      setResult(prev => ({ ...prev, message: `✓ ${result.details.participant.firstName} ${result.details.participant.lastName} - Attendance Marked!`, alreadyAttended: true }));
      fetchAttendanceStats();
    } catch (error) {
      setResult(prev => ({ ...prev, message: prev.message + ' - Already attended' }));
    }
  };

  const handleManualOverride = async (ticketObjectId) => {
    if (!overrideReason.trim()) return;
    try {
      await api.put(`/tickets/${ticketObjectId}/manual-attend`, { reason: overrideReason });
      setShowOverrideModal(null);
      setOverrideReason('');
      fetchAttendanceStats();
    } catch (error) {
      console.error('Override failed:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/tickets/attendance/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `attendance_${event?.eventName || 'report'}.csv`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' };
  const buttonStyle = { padding: '12px 24px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' };
  const statCard = { border: '1px solid #ddd', borderRadius: '4px', padding: '15px', textAlign: 'center', flex: 1, minWidth: '100px' };

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}><Navbar /><div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div></div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      <Navbar />
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>QR Scanner</h1>
            <p style={{ color: '#666', margin: 0 }}>{event?.eventName}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveView('scanner')} style={{ ...buttonStyle, backgroundColor: activeView === 'scanner' ? '#333' : '#e0e0e0', color: activeView === 'scanner' ? 'white' : '#333', padding: '8px 16px' }}>Scanner</button>
            <button onClick={() => setActiveView('dashboard')} style={{ ...buttonStyle, backgroundColor: activeView === 'dashboard' ? '#333' : '#e0e0e0', color: activeView === 'dashboard' ? 'white' : '#333', padding: '8px 16px' }}>Live Dashboard</button>
          </div>
        </div>

        {/* Live Stats Bar */}
        {attendanceStats && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={statCard}>
              <p style={{ margin: '0 0 3px 0', fontSize: '22px', fontWeight: '600' }}>{attendanceStats.scannedCount}/{attendanceStats.total}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Scanned</p>
            </div>
            <div style={statCard}>
              <p style={{ margin: '0 0 3px 0', fontSize: '22px', fontWeight: '600' }}>{attendanceStats.notScannedCount}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Remaining</p>
            </div>
            <div style={statCard}>
              <p style={{ margin: '0 0 3px 0', fontSize: '22px', fontWeight: '600', color: '#2e7d32' }}>{attendanceStats.percentage}%</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Attendance</p>
            </div>
          </div>
        )}

        {/* Scanner View */}
        {activeView === 'scanner' && (
          <>
            {/* Camera Scanner */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Camera Scanner</h3>
              {scanning ? (
                <div>
                  <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <video ref={videoRef} style={{ width: '100%', borderRadius: '4px' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                  <button onClick={stopCamera} style={{ ...buttonStyle, backgroundColor: '#c62828' }}>Stop Camera</button>
                </div>
              ) : (
                <button onClick={startCamera} style={buttonStyle}>Start Camera</button>
              )}
              <p style={{ fontSize: '13px', color: '#888', marginTop: '10px' }}>Note: For best results, ensure good lighting and hold the QR code steady.</p>
            </div>

            {/* Manual Entry */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Manual Entry</h3>
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Enter ticket code or QR data" style={inputStyle} />
                <button type="submit" style={buttonStyle}>Verify</button>
              </form>
            </div>

            {/* Result */}
            {result && (
              <div style={{
                border: `2px solid ${result.success ? '#2e7d32' : '#c62828'}`,
                borderRadius: '4px', padding: '20px', marginBottom: '20px',
                backgroundColor: result.success ? '#e8f5e9' : '#ffebee'
              }}>
                <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 10px 0' }}>{result.message}</p>
                {result.success && result.details && (
                  <div>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Ticket: {result.details.ticketId}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Email: {result.details.participant?.email}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>Status: {result.details.status}</p>
                    {!result.alreadyAttended && (
                      <button onClick={markAttendance} style={{ ...buttonStyle, marginTop: '10px', backgroundColor: '#2e7d32' }}>Mark Attendance</button>
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
          </>
        )}

        {/* Live Dashboard View */}
        {activeView === 'dashboard' && attendanceStats && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', margin: 0 }}>Live Attendance Dashboard</h3>
              <button onClick={handleExportCSV} style={{ ...buttonStyle, padding: '8px 16px', fontSize: '13px' }}>Export CSV</button>
            </div>

            {/* Progress Bar */}
            <div style={{ backgroundColor: '#e0e0e0', borderRadius: '4px', height: '30px', marginBottom: '20px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                backgroundColor: '#2e7d32', height: '100%', borderRadius: '4px',
                width: `${attendanceStats.percentage}%`, transition: 'width 0.5s ease'
              }} />
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: '600', fontSize: '13px' }}>
                {attendanceStats.scannedCount} / {attendanceStats.total} ({attendanceStats.percentage}%)
              </span>
            </div>

            {/* Not Yet Scanned */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#c62828' }}>
                ✗ Not Yet Scanned ({attendanceStats.notScannedCount})
              </h4>
              {attendanceStats.notScanned.length === 0 ? (
                <p style={{ color: '#666', fontSize: '13px' }}>All participants scanned! 🎉</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Ticket</th>
                      <th style={{ textAlign: 'right', padding: '6px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStats.notScanned.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '6px' }}>{p.name}</td>
                        <td style={{ padding: '6px', color: '#666' }}>{p.email}</td>
                        <td style={{ padding: '6px', fontSize: '12px', fontFamily: 'monospace' }}>{p.ticketId}</td>
                        <td style={{ padding: '6px', textAlign: 'right' }}>
                          <button onClick={() => { setShowOverrideModal(p.ticketObjectId); setOverrideReason(''); }} style={{ padding: '3px 8px', backgroundColor: '#ff8f00', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>
                            Override
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Already Scanned */}
            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px' }}>
              <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#2e7d32' }}>
                ✓ Scanned ({attendanceStats.scannedCount})
              </h4>
              {attendanceStats.scanned.length === 0 ? (
                <p style={{ color: '#666', fontSize: '13px' }}>No participants scanned yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Ticket</th>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Scanned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStats.scanned.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '6px' }}>{p.name}</td>
                        <td style={{ padding: '6px', color: '#666' }}>{p.email}</td>
                        <td style={{ padding: '6px', fontSize: '12px', fontFamily: 'monospace' }}>{p.ticketId}</td>
                        <td style={{ padding: '6px', color: '#666' }}>{new Date(p.attendedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Manual Override Modal */}
        {showOverrideModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '25px', maxWidth: '400px', width: '90%' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Manual Attendance Override</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>This action will be logged for auditing purposes. Please provide a reason.</p>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for manual override (required)..."
                rows={3}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowOverrideModal(null)} style={{ ...buttonStyle, backgroundColor: '#e0e0e0', color: '#333', padding: '8px 16px' }}>Cancel</button>
                <button onClick={() => handleManualOverride(showOverrideModal)} disabled={!overrideReason.trim()} style={{ ...buttonStyle, backgroundColor: overrideReason.trim() ? '#ff8f00' : '#ccc', padding: '8px 16px' }}>Confirm Override</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
