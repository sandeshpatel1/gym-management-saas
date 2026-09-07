import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Same rule App.jsx / RootRedirect uses: superadmin lives under Company
// Master, everyone else lives under the tenant dashboard. Keeping this in
// one place means a mis-scoped route can never redirect a user back into
// itself (which is what caused the blank /dashboard screen for superadmin).
const landingPathForRole = (role) => (role === 'superadmin' ? '/company-master' : '/dashboard');

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

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
    // Guard against redirecting to the very route we're already on
    // (would otherwise re-render this same guard and blank the page).
    if (fallback === window.location.pathname) {
      return null;
    }
    return <Navigate to={fallback} replace />;
  }

  return children;
}