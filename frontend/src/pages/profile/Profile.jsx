import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { KeyRound, User as UserIcon } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { updateMeApi } from '../../api/auth';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });
  const passwordForm = useForm();

  const avatarPreview = profileForm.watch('avatarUrl');

  const onSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const { user: updated } = await updateMeApi({
        name: values.name,
        phone: values.phone,
        avatarUrl: values.avatarUrl,
      });
      const merged = { ...user, ...updated };
      localStorage.setItem('gym_user', JSON.stringify(merged));
      setUser(merged);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await updateMeApi({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <Card glass className="p-6 h-fit">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-[32px] font-semibold text-brand overflow-hidden mb-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user?.name} className="h-full w-full object-cover" />
                ) : (
                  (user?.name || '?')[0]?.toUpperCase()
                )}
              </div>
              <p className="text-[16px] font-semibold text-ink dark:text-zinc-100">{user?.name}</p>
              <p className="text-[13px] text-ink-tertiary dark:text-zinc-500">{user?.email}</p>
              <span className="mt-3 inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium capitalize bg-brand/10 text-brand dark:bg-brand/20">
                {user?.role}
              </span>
              {user?.company && (
                <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 mt-3">
                  {user.company.name}
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 22 }}
          className="lg:col-span-2 space-y-6"
        >
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4 flex items-center gap-2">
              <UserIcon size={16} /> Basic Information
            </p>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <Input
                label="Full Name"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register('name', { required: 'Name is required' })}
              />
              <Input label="Phone" {...profileForm.register('phone')} />
              <Input
                label="Avatar URL"
                placeholder="https://…"
                {...profileForm.register('avatarUrl')}
              />
              <Input label="Email" value={user?.email || ''} disabled />
              <Button type="submit" loading={savingProfile}>
                Save Changes
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4 flex items-center gap-2">
              <KeyRound size={16} /> Change Password
            </p>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword', {
                  required: 'Enter your current password',
                })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword', {
                    required: 'Enter a new password',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword', {
                    required: 'Confirm your new password',
                  })}
                />
              </div>
              <Button type="submit" variant="secondary" loading={savingPassword}>
                Update Password
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
