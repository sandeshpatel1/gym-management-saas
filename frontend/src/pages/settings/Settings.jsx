import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Palette,
  MapPin,
  FileText,
  Wallet,
  Save,
  ImageIcon,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import CompanyLogo from '../../components/common/CompanyLogo';
import { useAuth } from '../../context/AuthContext';
import { updateCompanyApi } from '../../api/companies';
import { getPlatformPaymentMethodsApi } from '../../api/platformSettings';
import {
  getPlatformGatewayProvidersApi,
  getGatewaySettingsApi,
  updateGatewaySettingsApi,
} from '../../api/paymentGateway';
import ImagePicker from '../../components/common/ImagePicker';


const TABS = [
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'contact', label: 'Contact & Address', icon: MapPin },
  { key: 'billing', label: 'GST & Invoicing', icon: FileText },
  { key: 'payments', label: 'Payments', icon: Wallet },
];

// Critically damped — settles cleanly, no overshoot, matches a settings
// panel switch rather than a flicked/dragged gesture.
const springTransition = { type: 'spring', bounce: 0, duration: 0.35 };

function Section({ title, description, children }) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-ink dark:text-zinc-100">{title}</p>
      {description && (
        <p className="text-[12.5px] text-ink-tertiary dark:text-zinc-500 mt-0.5 mb-5">{description}</p>
      )}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, setUser, effectiveCompany, managingCompany, startManaging } = useAuth();
  const [tab, setTab] = useState('branding');
  const [saving, setSaving] = useState(false);
  const [platformMethods, setPlatformMethods] = useState([]);
  const [enabledMethods, setEnabledMethods] = useState([]);

  const [gatewayProviders, setGatewayProviders] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [gatewayCredentials, setGatewayCredentials] = useState({});
  const [gatewaySavedInfo, setGatewaySavedInfo] = useState(null);
  const [gatewayLive, setGatewayLive] = useState(false);
  const [savingGateway, setSavingGateway] = useState(false);
  const { register, handleSubmit, watch, reset, setValue, formState: { isDirty } } = useForm();

  const watchedColor = watch('primaryColor');
  const watchedLogo = watch('logoUrl');
  const watchedName = watch('name');
  const watchedTagline = watch('tagline');

  useEffect(() => {
    getPlatformPaymentMethodsApi()
      .then(({ data }) => setPlatformMethods(data.filter((m) => m.enabled)))
      .catch(() => {
        /* if this fails, the payment-methods checklist just won't render — everything else still works */
      });
  }, []);

  useEffect(() => {
    getPlatformGatewayProvidersApi()
      .then(({ data }) => setGatewayProviders(data.filter((g) => g.enabled)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!effectiveCompany?.id) return;

    getGatewaySettingsApi(effectiveCompany.id)
      .then(({ data }) => {
        setSelectedGateway(data.provider || '');
        setGatewayLive(Boolean(data.isLive));
        setGatewaySavedInfo(data);
      })
      .catch(() => {});
  }, [effectiveCompany?.id]);

  const activeGatewayDef = gatewayProviders.find((g) => g.key === selectedGateway);

  const saveGateway = async () => {
    if (!effectiveCompany?.id) return toast.error('No company selected');
    if (!selectedGateway) return toast.error('Choose a gateway first');

    setSavingGateway(true);

    try {
      await updateGatewaySettingsApi(effectiveCompany.id, {
        provider: selectedGateway,
        credentials: gatewayCredentials,
        isLive: gatewayLive,
      });

      toast.success('Gateway credentials saved securely');

      const { data } = await getGatewaySettingsApi(effectiveCompany.id);
      setGatewaySavedInfo(data);
      setGatewayCredentials({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save gateway settings');
    } finally {
      setSavingGateway(false);
    }
  };

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
      reset(values);
      toast.success('Settings updated — this feeds every invoice and payment screen automatically');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Gym Settings">
      <form onSubmit={handleSubmit(onSave)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* --- Main panel --- */}
          <Card className="lg:col-span-2 overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-3 pt-3 border-b border-black/[0.06] dark:border-white/[0.08] overflow-x-auto">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap press-feedback transition-colors ${
                      active
                        ? 'text-brand'
                        : 'text-ink-secondary dark:text-zinc-400 hover:text-ink dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                    {active && (
                      <motion.span
                        layoutId="settings-tab-underline"
                        className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-brand"
                        transition={springTransition}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6 min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={springTransition}
                >
                  {tab === 'branding' && (
                    <Section
                      title="Brand identity"
                      description="Your logo, color, and tagline appear across the dashboard, invoices, and check-in kiosk."
                    >
                      <div className="space-y-4">
                        <Input label="Gym Name" {...register('name', { required: true })} />
                        <ImagePicker
                          label="Logo"
                          value={watchedLogo}
                          onChange={(val) => setValue('logoUrl', val, { shouldDirty: true })}
                          shape="square"
                          size={88}
                          helperText="Square images look cleanest. Shown across the dashboard, invoices, and check-in kiosk."
                        />
                        <Input label="Tagline" placeholder="Stronger every day" {...register('tagline')} />
                        <label className="block">
                          <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
                            Brand Color
                          </span>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              {...register('primaryColor')}
                              className="h-11 w-16 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer bg-transparent"
                            />
                            <span className="text-[13px] text-ink-tertiary dark:text-zinc-500 font-mono uppercase">
                              {watchedColor}
                            </span>
                          </div>
                        </label>
                      </div>
                    </Section>
                  )}

                  {tab === 'contact' && (
                    <Section
                      title="Gym address"
                      description="This shows up on every invoice and payment receipt."
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Address" {...register('address')} className="sm:col-span-2" />
                        <Input label="City" {...register('city')} />
                        <Input label="State" {...register('state')} />
                        <Input label="Pincode" {...register('pincode')} />
                        <Input label="Phone" {...register('phone')} />
                        <Input label="Email" type="email" {...register('email')} className="sm:col-span-2" />
                      </div>
                    </Section>
                  )}

                  {tab === 'billing' && (
                    <Section
                      title="GST & invoicing"
                      description="Controls the tax split and the fine print printed on generated invoices."
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" {...register('gstin')} />
                        <Input label="Default GST Rate (%)" type="number" step="0.1" {...register('defaultGstRate')} />
                      </div>
                      <label className="block">
                        <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
                          Terms & Instructions
                        </span>
                        <span className="block text-[12px] text-ink-tertiary dark:text-zinc-500 mb-2">
                          One per line — shown at the bottom of every invoice.
                        </span>
                        <textarea
                          rows={7}
                          {...register('termsAndConditions')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 text-[14px] outline-none focus:border-brand transition-colors"
                          placeholder="Membership fees are non-refundable..."
                        />
                      </label>
                    </Section>
                  )}

                  {tab === 'payments' && (
                    <Section
                      title="Payment methods & UPI"
                      description="Choose which methods your front desk can accept, and set your UPI ID so members can scan-and-pay directly during registration or when collecting dues."
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <Input label="UPI ID (VPA)" placeholder="yourgym@okhdfcbank" {...register('upiVpa')} />
                        <Input label="Payee Name shown to members" {...register('upiPayeeName')} />
                      </div>

                      <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-2">
                        Accepted methods
                      </span>
                      {platformMethods.length === 0 ? (
                        <p className="text-[12px] text-ink-tertiary dark:text-zinc-500">
                          No platform payment methods configured yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {platformMethods.map((m) => {
                            const active = enabledMethods.includes(m.key);
                            return (
                              <button
                                type="button"
                                key={m.key}
                                onClick={() => toggleMethod(m.key)}
                                className={`px-3.5 py-2 rounded-xl text-[13px] font-medium press-feedback transition-colors ${
                                  active
                                    ? 'bg-brand text-white'
                                    : 'bg-surface-subtle dark:bg-white/[0.06] text-ink-secondary dark:text-zinc-400 border border-black/10 dark:border-white/10'
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                        <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-1">
                          Payment Gateway (Razorpay, Easebuzz, etc.)
                        </p>
                        <p className="text-[12px] text-ink-tertiary dark:text-zinc-500 mb-4">
                          Connect a real payment gateway so members can pay online directly. Your platform admin
                          controls which gateways are available and what credentials each one needs.
                        </p>

                        <Select
                          label="Gateway Provider"
                          value={selectedGateway}
                          onChange={(e) => {
                            setSelectedGateway(e.target.value);
                            setGatewayCredentials({});
                          }}
                          className="mb-4"
                        >
                          <option value="">None configured</option>
                          {gatewayProviders.map((g) => (
                            <option key={g.key} value={g.key}>
                              {g.label}
                            </option>
                          ))}
                        </Select>

                        {activeGatewayDef && (
                          <div className="space-y-3 mb-4">
                            {activeGatewayDef.fields.map((f) => (
                              <Input
                                key={f.name}
                                label={f.label}
                                type={f.secret ? 'password' : 'text'}
                                placeholder={
                                  gatewaySavedInfo?.provider === selectedGateway &&
                                  gatewaySavedInfo?.credentials?.[f.name]
                                    ? `Saved: ${gatewaySavedInfo.credentials[f.name]}`
                                    : ''
                                }
                                value={gatewayCredentials[f.name] || ''}
                                onChange={(e) =>
                                  setGatewayCredentials((prev) => ({
                                    ...prev,
                                    [f.name]: e.target.value,
                                  }))
                                }
                              />
                            ))}

                            <label className="flex items-center gap-2 text-[13px] text-ink-secondary dark:text-zinc-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={gatewayLive}
                                onChange={(e) => setGatewayLive(e.target.checked)}
                                className="h-4 w-4 accent-brand"
                              />
                              Live mode (uncheck while testing with sandbox keys)
                            </label>

                            <Button type="button" onClick={saveGateway} loading={savingGateway}>
                              Save Gateway Credentials
                            </Button>
                          </div>
                        )}
                      </div>
                    </Section>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky action bar — always reachable regardless of tab or scroll position */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 backdrop-blur sticky bottom-0">
              <p className="text-[12px] text-ink-tertiary dark:text-zinc-500">
                {isDirty ? 'Unsaved changes' : 'All changes saved'}
              </p>
              <Button type="submit" loading={saving} disabled={!isDirty && !saving}>
                <Save size={15} /> Save Changes
              </Button>
            </div>
          </Card>

          {/* --- Live preview --- */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <Card className="overflow-hidden">
              <div
                className="h-20 relative"
                style={{ background: `linear-gradient(135deg, ${watchedColor || '#0A84FF'}, ${watchedColor || '#0A84FF'}99)` }}
              />
              <div className="px-5 pb-5 -mt-8">
                <div className="flex items-end gap-3 mb-3">
                  <div className="ring-4 ring-white dark:ring-zinc-900 rounded-xl">
                    <CompanyLogo company={{ name: watchedName, branding: { logoUrl: watchedLogo } }} size={56} />
                  </div>
                </div>
                <p className="text-[15px] font-semibold text-ink dark:text-zinc-100 truncate">
                  {watchedName || 'Your Gym'}
                </p>
                <p className="text-[12.5px] text-ink-tertiary dark:text-zinc-500 truncate">
                  {watchedTagline || 'This is how your identity appears across the dashboard & invoices'}
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[12.5px] font-medium text-ink dark:text-zinc-200 flex items-center gap-1.5 mb-2">
                <ImageIcon size={14} className="text-ink-tertiary dark:text-zinc-500" /> Tips
              </p>
              <ul className="space-y-2 text-[12.5px] text-ink-tertiary dark:text-zinc-500 leading-relaxed">
                <li>• Use a square, transparent-background logo for the cleanest fit.</li>
                <li>• Your brand color drives every button and accent — pick something with good contrast against white.</li>
                <li>• GST fields only matter if you invoice with tax; leave the rate at 0 otherwise.</li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}