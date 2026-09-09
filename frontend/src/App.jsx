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
import Kiosk from './pages/attendance/Kiosk';
import CheckIn from './pages/attendance/CheckIn';
import Billing from './pages/billing/Billing';
import RevenueReport from './pages/reports/RevenueReport';
import UserManagement from './pages/users/UserManagement';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';
import MemberEdit from './pages/members/MemberEdit';
import PhotoCapture from './pages/members/PhotoCapture';
import PlatformPaymentSettings from './pages/superadmin/PlatformPaymentSettings'; // add with other imports


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

      {/* Public - opened on a member's own phone after scanning the kiosk QR */}
      <Route path="/checkin" element={<CheckIn />} />
      {/* Public - opened on staff/member's phone after scanning the member photo QR */}
      <Route path="/photo-capture" element={<PhotoCapture />} />

      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <MemberList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/new"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'superadmin']} requireCompanyContext>
            <MemberForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members/:id"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <MemberProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/follow-ups"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <FollowUps />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <AttendanceMarking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/kiosk"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <Kiosk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/membership-plans"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'trainer', 'superadmin']} requireCompanyContext>
            <MembershipPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'superadmin']} requireCompanyContext>
            <RevenueReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'superadmin']} requireCompanyContext>
            <Billing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['owner', 'superadmin']} requireCompanyContext>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'superadmin']} requireCompanyContext>
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
      <Route
        path="/members/:id/edit"
        element={
          <ProtectedRoute roles={['owner', 'manager', 'superadmin']} requireCompanyContext>
            <MemberEdit />
          </ProtectedRoute>
        }
      />

      {/* --- Superadmin (platform-wide, not tied to one gym) --- */}
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
      <Route
  path="/superadmin/payment-methods"
  element={
    <ProtectedRoute roles={['superadmin']}>
      <PlatformPaymentSettings />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}