import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CompanyLogo from '../../components/common/CompanyLogo';
import { useAuth } from '../../context/AuthContext';
import { updateCompanyApi } from '../../api/companies';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (user?.company) {
      reset({
        name: user.company.name,
        logoUrl: user.company.branding?.logoUrl || '',
        primaryColor: user.company.branding?.primaryColor || '#0A84FF',
        tagline: user.company.branding?.tagline || '',
      });
    }
  }, [user, reset]);

  const onSave = async (values) => {
    setSaving(true);
    try {
      const { data } = await updateCompanyApi(user.company.id, {
        name: values.name,
        branding: {
          logoUrl: values.logoUrl,
          primaryColor: values.primaryColor,
          tagline: values.tagline,
        },
      });
      const updatedUser = { ...user, company: { ...user.company, name: data.name, branding: data.branding } };
      localStorage.setItem('gym_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      document.documentElement.style.setProperty('--brand-color', data.branding.primaryColor);
      toast.success('Branding updated — refresh to see it everywhere');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Gym Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <p className="text-[14px] font-semibold text-ink mb-4">Branding</p>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <Input label="Gym Name" {...register('name', { required: true })} />
            <Input label="Logo URL" placeholder="https://…" {...register('logoUrl')} />
            <Input label="Tagline" placeholder="Stronger every day" {...register('tagline')} />
            <label className="block">
              <span className="block text-[13px] font-medium text-ink-secondary mb-1.5">
                Brand Color
              </span>
              <input
                type="color"
                {...register('primaryColor')}
                className="h-11 w-20 rounded-lg border border-black/10 cursor-pointer"
              />
            </label>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </Card>

        <Card className="p-6 h-fit">
          <p className="text-[14px] font-semibold text-ink mb-4">Preview</p>
          <div className="flex items-center gap-3 p-4 bg-surface-subtle rounded-xl">
            <CompanyLogo company={user?.company} size={48} />
            <div>
              <p className="text-[14px] font-semibold text-ink">{user?.company?.name}</p>
              <p className="text-[12px] text-ink-tertiary">This is how your logo appears in the sidebar</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
