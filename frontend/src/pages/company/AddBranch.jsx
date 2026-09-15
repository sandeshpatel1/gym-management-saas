import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Layers } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ImagePicker from '../../components/common/ImagePicker';
import { getOwnersApi } from '../../api/users';
import { createBranchForOwnerApi } from '../../api/companies';

export default function AddBranch() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { primaryColor: '#0A84FF', defaultGstRate: 18 } });

  const logoUrl = watch('logoUrl');

  useEffect(() => {
    getOwnersApi()
      .then(({ data }) => setOwners(data))
      .catch(() => toast.error('Could not load owners'))
      .finally(() => setLoadingOwners(false));
  }, []);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const { data, owner } = await createBranchForOwnerApi({
        ownerId: values.ownerId,
        name: values.name,
        code: values.code.toUpperCase(),
        contact: {
          address: values.address,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          phone: values.phone,
          email: values.email,
        },
        branding: {
          logoUrl: values.logoUrl,
          primaryColor: values.primaryColor,
          tagline: values.tagline,
        },
        invoiceSettings: {
          gstin: values.gstin,
          panNumber: values.panNumber,
          defaultGstRate: Number(values.defaultGstRate) || 0,
          footerNote: values.footerNote,
          termsAndConditions: values.termsAndConditions
            ? values.termsAndConditions.split('\n').map((t) => t.trim()).filter(Boolean)
            : [],
        },
      });
      toast.success(`${data.name} created and linked to ${owner.name}`);
      navigate('/company-master');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Add Branch">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/company-master')}
          className="flex items-center gap-1.5 text-[13px] text-ink-secondary dark:text-zinc-400 mb-4 press-feedback"
        >
          <ArrowLeft size={14} /> Back to Company Master
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Layers size={16} /> Link to Owner
            </p>
            <p className="text-[12.5px] text-ink-tertiary dark:text-zinc-500 mb-4">
              This branch will be accessible from that owner's existing login — no new login is
              created.
            </p>
            <Select
              label="Owner"
              error={errors.ownerId?.message}
              disabled={loadingOwners}
              {...register('ownerId', { required: 'Select which owner this branch belongs to' })}
            >
              <option value="">{loadingOwners ? 'Loading owners…' : 'Select an owner'}</option>
              {owners.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name} — {o.email}
                  {o.company ? ` (owns ${o.company.name})` : ''}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4">
              Branch Identity
            </p>
            <div className="space-y-4">
              <Input
                label="Branch Name"
                placeholder="Fit Yard — Powai"
                error={errors.name?.message}
                {...register('name', { required: 'Branch name is required' })}
              />
              <Input
                label="Branch Code"
                placeholder="FITYARDPOWAI"
                error={errors.code?.message}
                {...register('code', {
                  required: 'A unique code is required',
                  minLength: { value: 3, message: 'At least 3 characters' },
                })}
              />
              <ImagePicker
                label="Logo"
                value={logoUrl}
                onChange={(val) => setValue('logoUrl', val, { shouldDirty: true })}
                shape="square"
                size={80}
              />
              <Input label="Tagline" placeholder="Stronger every day" {...register('tagline')} />
              <label className="block">
                <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
                  Brand Color
                </span>
                <input
                  type="color"
                  {...register('primaryColor')}
                  className="h-11 w-20 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer"
                />
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4">
              Contact & Address
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Address" className="sm:col-span-2" {...register('address')} />
              <Input label="City" {...register('city')} />
              <Input label="State" {...register('state')} />
              <Input label="Pincode" {...register('pincode')} />
              <Input label="Phone" {...register('phone')} />
              <Input label="Email" type="email" className="sm:col-span-2" {...register('email')} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4">
              GST & Invoicing
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" {...register('gstin')} />
              <Input label="PAN Number" {...register('panNumber')} />
              <Input label="Default GST Rate (%)" type="number" step="0.1" {...register('defaultGstRate')} />
            </div>
            <label className="block mb-4">
              <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
                Terms & Instructions (one per line, optional)
              </span>
              <textarea
                rows={4}
                {...register('termsAndConditions')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 text-[14px] outline-none focus:border-brand transition-colors"
              />
            </label>
            <Input label="Invoice Footer Note (optional)" {...register('footerNote')} />
          </Card>

          <Button type="submit" className="w-full" size="lg" loading={saving}>
            Create Branch
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}