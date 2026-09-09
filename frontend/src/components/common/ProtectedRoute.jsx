import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const landingPathForRole = (role) => (role === 'superadmin' ? '/company-master' : '/dashboard');

/**
 * requireCompanyContext: for tenant-scoped pages (members, attendance,
 * billing, etc). If a superadmin lands here without having picked a gym to
 * manage, send them to Company Master to pick one, instead of letting every
 * data call on the page fail with "select a gym" errors.
 */
export default function ProtectedRoute({ children, roles, requireCompanyContext = false }) {
  const { user, loading, managingCompany } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-subtle">
        <div className="h-8 w-8 border-[3px] border-black/10 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    const fallback = landingPathForRole(user.role);
    if (fallback === window.location.pathname) {
      return null;
    }
    return <Navigate to={fallback} replace />;
  }

  if (requireCompanyContext && user.role === 'superadmin' && !managingCompany) {
    return <Navigate to="/company-master" replace />;
  }

  return children;
}