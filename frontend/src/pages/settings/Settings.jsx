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
import { getPlatformPaymentMethodsApi } from '../../api/platformSettings';

export default function Settings() {
  const { user, setUser, effectiveCompany, managingCompany, startManaging } = useAuth();
  const [saving, setSaving] = useState(false);
  const [platformMethods, setPlatformMethods] = useState([]);
  const [enabledMethods, setEnabledMethods] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    getPlatformPaymentMethodsApi()
      .then(({ data }) => setPlatformMethods(data.filter((m) => m.enabled)))
      .catch(() => {
        /* if this fails, the payment-methods checklist just won't render — everything else still works */
      });
  }, []);

  useEffect(() => {
    if (effectiveCompany) {
      reset({
        name: effectiveCompany.name,
        logoUrl: effectiveCompany.branding?.logoUrl || '',
        primaryColor: effectiveCompany.branding?.primaryColor || '#0A84FF',
        tagline: effectiveCompany.branding?.tagline || '',
        address: effectiveCompany.contact?.address || '',
        city: effectiveCompany.contact?.city || '',
        state: effectiveCompany.contact?.state || '',
        pincode: effectiveCompany.contact?.pincode || '',
        phone: effectiveCompany.contact?.phone || '',
        email: effectiveCompany.contact?.email || '',
        gstin: effectiveCompany.invoiceSettings?.gstin || '',
        defaultGstRate: effectiveCompany.invoiceSettings?.defaultGstRate ?? 18,
        termsAndConditions: (effectiveCompany.invoiceSettings?.termsAndConditions || []).join('\n'),
        upiVpa: effectiveCompany.paymentSettings?.upi?.vpa || '',
        upiPayeeName: effectiveCompany.paymentSettings?.upi?.payeeName || effectiveCompany.name || '',
      });
      setEnabledMethods(effectiveCompany.paymentSettings?.enabledMethods || ['cash']);
    }
  }, [effectiveCompany, reset]);

  const toggleMethod = (key) => {
    setEnabledMethods((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const onSave = async (values) => {
    setSaving(true);
    try {
      const { data } = await updateCompanyApi(effectiveCompany.id, {
        name: values.name,
        branding: { logoUrl: values.logoUrl, primaryColor: values.primaryColor, tagline: values.tagline },
        contact: {
          address: values.address, city: values.city, state: values.state,
          pincode: values.pincode, phone: values.phone, email: values.email,
        },
        invoiceSettings: {
          gstin: values.gstin,
          defaultGstRate: Number(values.defaultGstRate) || 0,
          termsAndConditions: values.termsAndConditions
            ? values.termsAndConditions.split('\n').map((t) => t.trim()).filter(Boolean)
            : [],
        },
        paymentSettings: {
          upi: { vpa: values.upiVpa.trim(), payeeName: values.upiPayeeName.trim() },
          enabledMethods,
        },
      });

      if (managingCompany) {
        startManaging({ id: data._id, name: data.name, code: data.code, branding: data.branding, ...data });
      } else {
        const updatedUser = { ...user, company: { ...user.company, ...data } };
        localStorage.setItem('gym_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      document.documentElement.style.setProperty('--brand-color', data.branding.primaryColor);
      toast.success('Settings updated — this feeds every invoice and payment screen automatically');
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
          <form onSubmit={handleSubmit(onSave)} className="space-y-6">
            <div>
              <p className="text-[14px] font-semibold text-ink mb-4">Branding</p>
              <div className="space-y-4">
                <Input label="Gym Name" {...register('name', { required: true })} />
                <Input label="Logo URL" placeholder="https://…" {...register('logoUrl')} />
                <Input label="Tagline" placeholder="Stronger every day" {...register('tagline')} />
                <label className="block">
                  <span className="block text-[13px] font-medium text-ink-secondary mb-1.5">Brand Color</span>
                  <input type="color" {...register('primaryColor')} className="h-11 w-20 rounded-lg border border-black/10 cursor-pointer" />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <p className="text-[14px] font-semibold text-ink mb-4">Gym Address (appears on every invoice)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Address" {...register('address')} className="sm:col-span-2" />
                <Input label="City" {...register('city')} />
                <Input label="State" {...register('state')} />
                <Input label="Pincode" {...register('pincode')} />
                <Input label="Phone" {...register('phone')} />
                <Input label="Email" type="email" {...register('email')} className="sm:col-span-2" />
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <p className="text-[14px] font-semibold text-ink mb-4">GST & Invoicing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" {...register('gstin')} />
                <Input label="Default GST Rate (%)" type="number" step="0.1" {...register('defaultGstRate')} />
              </div>
              <label className="block mt-4">
                <span className="block text-[13px] font-medium text-ink-secondary mb-1.5">
                  Terms & Instructions (one per line, shown on every invoice)
                </span>
                <textarea
                  rows={5}
                  {...register('termsAndConditions')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-[14px] outline-none focus:border-brand"
                  placeholder="Membership fees are non-refundable..."
                />
              </label>
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <p className="text-[14px] font-semibold text-ink mb-1">Payment Methods & UPI</p>
              <p className="text-[12px] text-ink-tertiary mb-4">
                Choose which methods your front desk can accept, and set your UPI ID so members can
                scan-and-pay directly during registration or when collecting dues.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input label="UPI ID (VPA)" placeholder="yourgym@okhdfcbank" {...register('upiVpa')} />
                <Input label="Payee Name shown to members" {...register('upiPayeeName')} />
              </div>
              {platformMethods.length === 0 ? (
                <p className="text-[12px] text-ink-tertiary">No platform payment methods configured yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platformMethods.map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => toggleMethod(m.key)}
                      className={`px-3.5 py-2 rounded-xl text-[13px] font-medium press-feedback transition-colors ${
                        enabledMethods.includes(m.key)
                          ? 'bg-brand text-white'
                          : 'bg-surface-subtle text-ink-secondary border border-black/10'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </Card>

        <Card className="p-6 h-fit">
          <p className="text-[14px] font-semibold text-ink mb-4">Preview</p>
          <div className="flex items-center gap-3 p-4 bg-surface-subtle rounded-xl">
            <CompanyLogo company={effectiveCompany} size={48} />
            <div>
              <p className="text-[14px] font-semibold text-ink">{effectiveCompany?.name}</p>
              <p className="text-[12px] text-ink-tertiary">This is how your logo appears in the sidebar & invoices</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}