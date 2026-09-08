import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import SuperAdminDashboard from './pages/dashboard/Superadmindashboard';
import CompanyMaster from './pages/company/CompanyMaster';
import GlobalUsers from './pages/users/Globalusers';
import MemberList from './pages/members/MemberList';
import MemberForm from './pages/members/MemberForm';
import MemberProfile from './pages/members/MemberProfile';
import FollowUps from './pages/members/FollowUps';
import MembershipPlans from './pages/membership/MembershipPlans';
import AttendanceMarking from './pages/attendance/AttendanceMarking';
import QRScanner from './pages/attendance/QRScanner';
import Billing from './pages/billing/Billing';
import RevenueReport from './pages/reports/RevenueReport';
import UserManagement from './pages/users/UserManagement';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'superadmin' ? '/company-master' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <MemberList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/new"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <MemberForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/:id"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <MemberProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <FollowUps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <AttendanceMarking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/qr-scan"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <QRScanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/membership-plans"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer']}>
            <MembershipPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <RevenueReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <Billing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['owner']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <Settings />
          </ProtectedRoute>
        }
      />
         <Route
     path="/profile"
     element={
       <ProtectedRoute>
         <Profile />
       </ProtectedRoute>
     }
   />

      {/* --- Superadmin --- */}
      <Route
        path="/company-master"
        element={
          <ProtectedRoute roles={['superadmin']}>
            <CompanyMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/dashboard"
        element={
          <ProtectedRoute roles={['superadmin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/users"
        element={
          <ProtectedRoute roles={['superadmin']}>
            <GlobalUsers />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}