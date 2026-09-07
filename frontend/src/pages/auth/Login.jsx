import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerCompanyApi } from '../../api/auth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

// Single place that decides "where does this role land after auth" so
// Login, registration, and any future redirect all agree with each other
// and with RootRedirect / ProtectedRoute.
const landingPathForRole = (role) => (role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const { login } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm();
  const registerForm = useForm();
  const [loading, setLoading] = useState(false);

  const onLogin = async (values) => {
    setLoading(true);
    try {
      const user = await login(values.email, values.password);
      toast.success('Welcome back');
      navigate(landingPathForRole(user?.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      const data = await registerCompanyApi(values);
      localStorage.setItem('gym_token', data.token);
      localStorage.setItem('gym_user', JSON.stringify(data.user));
      toast.success('Gym account created');
      // Full reload so AuthContext bootstraps branding cleanly, then land
      // on the right page for the role (self-serve signup is always 'owner').
      window.location.href = landingPathForRole(data.user?.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand flex items-center justify-center mb-4 shadow-card">
            <Dumbbell className="text-white" size={26} />
          </div>
          <h1 className="text-[26px] font-semibold text-ink display-text">Gym Manager</h1>
          <p className="text-[14px] text-ink-secondary mt-1">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Set up your gym in a minute'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-7">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@gym.com"
                  error={loginForm.formState.errors.email?.message}
                  {...loginForm.register('email', { required: 'Email is required' })}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password', { required: 'Password is required' })}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Sign In
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-4"
              >
                <Input
                  label="Gym Name"
                  placeholder="Iron Paradise Fitness"
                  error={registerForm.formState.errors.companyName?.message}
                  {...registerForm.register('companyName', { required: 'Gym name is required' })}
                />
                <Input
                  label="Company Code"
                  placeholder="IRONPARADISE"
                  error={registerForm.formState.errors.companyCode?.message}
                  {...registerForm.register('companyCode', {
                    required: 'A short unique code is required',
                    minLength: { value: 3, message: 'At least 3 characters' },
                  })}
                />
                <Input
                  label="Your Name"
                  placeholder="Owner name"
                  error={registerForm.formState.errors.ownerName?.message}
                  {...registerForm.register('ownerName', { required: 'Your name is required' })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="owner@gym.com"
                  error={registerForm.formState.errors.email?.message}
                  {...registerForm.register('email', { required: 'Email is required' })}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Create Gym Account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[13px] text-ink-secondary mt-5">
          {mode === 'login' ? (
            <>
              New gym?{' '}
              <button onClick={() => setMode('register')} className="text-brand font-medium">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-brand font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}