import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Participant Pages
import ParticipantDashboard from './pages/ParticipantDashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';

// Organizer Pages
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';
import OrganizerProfile from './pages/OrganizerProfile';
import QRScanner from './pages/QRScanner';
import EventFeedback from './pages/EventFeedback';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ManageOrganizers from './pages/ManageOrganizers';
import PasswordRequests from './pages/PasswordRequests';

// Role-based dashboard redirect
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'organizer':
      return <Navigate to="/organizer/dashboard" replace />;
    default:
      return <Navigate to="/participant/dashboard" replace />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      {/* Participant Routes */}
      <Route path="/participant/dashboard" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <ParticipantDashboard />
        </ProtectedRoute>
      } />
      <Route path="/events" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <BrowseEvents />
        </ProtectedRoute>
      } />
      <Route path="/events/:id" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <EventDetails />
        </ProtectedRoute>
      } />
      <Route path="/events/:id/feedback" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <EventFeedback />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/clubs" element={
        <ProtectedRoute allowedRoles={['participant']}>
          <Clubs />
        </ProtectedRoute>
      } />
      
      {/* Organizer Routes */}
      <Route path="/organizer/dashboard" element={
        <ProtectedRoute allowedRoles={['organizer']}>
          <OrganizerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/create" element={
        <ProtectedRoute allowedRoles={['organizer']}>
          <CreateEvent />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/:id" element={
        <ProtectedRoute allowedRoles={['organizer']}>
          <ManageEvent />
        </ProtectedRoute>
      } />
      <Route path="/organizer/events/:id/scan" element={
        <ProtectedRoute allowedRoles={['organizer']}>
          <QRScanner />
        </ProtectedRoute>
      } />
      <Route path="/organizer/profile" element={
        <ProtectedRoute allowedRoles={['organizer']}>
          <OrganizerProfile />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/manage-organizers" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageOrganizers />
        </ProtectedRoute>
      } />
      <Route path="/password-requests" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PasswordRequests />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;