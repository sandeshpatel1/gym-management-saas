import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { KeyRound, User as UserIcon, Info, UserRound } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { updateMeApi } from '../../api/auth';

const PHONE_PATTERN = /^[+]?[0-9]{10,15}$/;
const URL_PATTERN = /^https?:\/\/.+/i;

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-black/[0.04] dark:border-white/[0.06] last:border-0">
      <span className="text-ink-tertiary dark:text-zinc-500">{label}</span>
      <span className="text-ink dark:text-zinc-200 font-medium text-right">{value}</span>
    </div>
  );
}

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
  const { setValue: setProfileValue } = profileForm;

  const onSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const { user: updated } = await updateMeApi({
        name: values.name.trim(),
        phone: values.phone.trim(),
        avatarUrl: values.avatarUrl?.trim() || '',
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
          className="lg:col-span-1 space-y-6"
        >
          <Card glass className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 dark:from-brand/25 dark:to-brand/10 ring-1 ring-black/[0.04] dark:ring-white/[0.08] flex items-center justify-center overflow-hidden mb-4 text-ink-secondary dark:text-zinc-300">
                {avatarPreview && URL_PATTERN.test(avatarPreview) ? (
                  <img src={avatarPreview} alt={user?.name} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={38} />
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

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Info size={16} /> Account Overview
            </p>
            <div className="text-[13px]">
              <Row label="Email" value={user?.email || '—'} />
              <Row label="Phone" value={user?.phone || 'Not set'} />
              <Row label="Role" value={<span className="capitalize">{user?.role}</span>} />
              {user?.company && <Row label="Gym" value={user.company.name} />}
              <Row
                label="Status"
                value={
                  <Badge status={user?.isActive === false ? 'cancelled' : 'active'}>
                    {user?.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                }
              />
              <Row
                label="Member Since"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              />
              <Row
                label="Last Login"
                value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'This session'}
              />
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
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-1 flex items-center gap-2">
              <UserIcon size={16} /> Basic Information
            </p>
            <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 mb-4">
              Fields marked <span className="text-red-500">*</span> are required.
            </p>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <Input
                label="Full Name *"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name is too short' },
                })}
              />
              <Input
                label="Phone Number *"
                placeholder="9876543210"
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: PHONE_PATTERN, message: 'Enter a valid phone number' },
                })}
              />
              <ImagePicker
                  label="Avatar"
                  value={avatarPreview}
                  onChange={(val) => profileForm.setValue('avatarUrl', val, { shouldDirty: true, shouldValidate: true })}
                  shape="circle"
                  size={80}
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