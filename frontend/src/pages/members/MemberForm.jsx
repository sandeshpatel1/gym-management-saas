import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, QrCode, User, Phone, HeartPulse, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getPlansApi } from '../../api/membershipPlans';
import { createMemberApi } from '../../api/members';
import { getUpiQrPreviewApi } from '../../api/companies';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Personal Details', 'Membership Plan', 'Payment'];
const DEFAULT_METHODS = ['cash', 'card', 'upi', 'bank-transfer', 'other'];
const METHOD_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', 'bank-transfer': 'Bank Transfer', other: 'Other' };

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 transition-colors ${
                done
                  ? 'bg-brand text-white'
                  : active
                  ? 'bg-brand/10 text-brand border-2 border-brand'
                  : 'bg-black/[0.06] text-ink-tertiary'
              }`}
            >
              {done ? <Check size={13} /> : idx}
            </div>
            <span className={`text-[12.5px] font-medium hidden sm:inline ${active ? 'text-ink' : 'text-ink-tertiary'}`}>
              {label}
            </span>
            {idx < STEPS.length && <div className="flex-1 h-px bg-black/[0.08]" />}
          </div>
        );
      })}
    </div>
  );
}

// Small section header used to break up one dense card into logical
// groups, instead of giving every group its own full white Card (which is
// what was leaving all that empty space).
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-tertiary uppercase tracking-wide mb-3">
      {Icon && <Icon size={13} />}
      {children}
    </div>
  );
}

export default function MemberForm() {
  const { effectiveCompany } = useAuth();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [dueDate, setDueDate] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({ defaultValues: { gender: 'male', planId: '' } });

  const selectedPlanId = watch('planId');
  const selectedPlan = plans.find((p) => p._id === selectedPlanId);
  const amountDue = selectedPlan ? Math.max(0, +(selectedPlan.price - Number(amountReceived || 0)).toFixed(2)) : 0;

  const availableMethods = useMemo(() => {
    const enabled = effectiveCompany?.paymentSettings?.enabledMethods;
    return enabled?.length ? enabled : DEFAULT_METHODS;
  }, [effectiveCompany]);

  useEffect(() => {
    getPlansApi()
      .then(({ data }) => setPlans(data.filter((p) => p.isActive)))
      .catch(() => toast.error('Could not load membership plans'));
  }, []);

  useEffect(() => {
    if (selectedPlan) setAmountReceived(String(selectedPlan.price));
  }, [selectedPlanId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let objectUrl;
    if (paymentMethod === 'upi' && effectiveCompany?.id && selectedPlan) {
      setUpiLoading(true);
      getUpiQrPreviewApi(effectiveCompany.id, amountReceived || 0, `Registration - ${selectedPlan.name}`)
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          setUpiQrUrl(objectUrl);
        })
        .catch(() => setUpiQrUrl(''))
        .finally(() => setUpiLoading(false));
    } else {
      setUpiQrUrl('');
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, amountReceived, effectiveCompany?.id, selectedPlanId]);

  const goNext = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (step === 1) {
      const valid = await trigger(['fullName', 'phone', 'email', 'gender', 'dob']);
      if (!valid) return;
    }

    if (step === 2 && selectedPlanId) {
      if (amountReceived === '' || Number(amountReceived) < 0) {
        toast.error('Enter the amount received (0 is fine for "no payment yet")');
        return;
      }
      if (Number(amountReceived) > selectedPlan.price) {
        toast.error('Amount received cannot exceed the plan price');
        return;
      }
    }

    setStep((s) => Math.min(3, s + 1));
  };

  const goBack = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async (values) => {
    if (selectedPlanId && amountDue > 0 && !dueDate) {
      toast.error('Set a due date for the remaining balance');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone,
        gender: values.gender,
        dob: values.dob,
        address: values.address,
        emergencyContact: {
          name: values.emergencyName,
          phone: values.emergencyPhone,
          relation: values.emergencyRelation,
        },
        healthNotes: values.healthNotes,
        goals: values.goals ? values.goals.split(',').map((g) => g.trim()).filter(Boolean) : [],
        planId: selectedPlanId || undefined,
      };
      if (selectedPlanId) {
        payload.amountPaid = Number(amountReceived || 0);
        payload.invoiceAmount = selectedPlan.price;
        payload.paymentMethod = paymentMethod;
        if (amountDue > 0) payload.dueDate = dueDate;
      }
      const { data } = await createMemberApi(payload);
      toast.success(`${data.fullName} registered — code ${data.memberCode}`);
      navigate(`/members/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleSubmit(onSubmit)();
  };

  return (
    <DashboardLayout title="Register Member">
      <div className="max-w-3xl mx-auto">
        <StepIndicator step={step} />

        {/* noValidate: stops native HTML5 validation / implicit-submit-on-Enter
            quirks from ever interacting with this form at all. */}
        <form noValidate onSubmit={(e) => e.preventDefault()}>
          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6 max-h-[62vh] overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <SectionLabel icon={User}>Personal Details</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Full Name"
                        error={errors.fullName?.message}
                        {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
                      />
                      <Input
                        label="Phone Number"
                        placeholder="9876543210"
                        error={errors.phone?.message}
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' },
                        })}
                      />
                      <Input
                        label="Email (optional)"
                        type="email"
                        error={errors.email?.message}
                        {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                      />
                      <Select label="Gender" error={errors.gender?.message} {...register('gender', { required: true })}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                      <Input
                        label="Date of Birth"
                        type="date"
                        error={errors.dob?.message}
                        {...register('dob', { required: 'Date of birth is required' })}
                      />
                      <Input label="Address" {...register('address')} />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <SectionLabel icon={Phone}>Emergency Contact</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input label="Name" {...register('emergencyName')} />
                      <Input label="Phone" {...register('emergencyPhone')} />
                      <Input label="Relation" placeholder="Parent / Spouse / Friend" {...register('emergencyRelation')} />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <SectionLabel icon={HeartPulse}>Fitness Intake (optional)</SectionLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Health Notes" placeholder="Injuries, conditions to be aware of" {...register('healthNotes')} />
                      <Input label="Goals (comma separated)" placeholder="Weight loss, Strength, Endurance" {...register('goals')} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <SectionLabel>Choose a Membership Plan</SectionLabel>
                  <Select label="Plan (optional — skip to register profile only)" {...register('planId')}>
                    <option value="">No plan — register profile only</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} — ₹{p.price} / {p.durationInDays} days
                      </option>
                    ))}
                  </Select>

                  {selectedPlan ? (
                    <div className="mt-4 p-4 bg-surface-subtle dark:bg-white/[0.04] rounded-xl text-[13px] text-ink-secondary dark:text-zinc-400">
                      <p>
                        <span className="font-medium text-ink dark:text-zinc-100">{selectedPlan.name}</span> · ₹{selectedPlan.price} for{' '}
                        {selectedPlan.durationInDays} days
                      </p>
                      {selectedPlan.description && <p className="mt-1">{selectedPlan.description}</p>}
                      {selectedPlan.features?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {selectedPlan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-brand mt-0.5">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-[13px] text-ink-tertiary">
                      You can always assign a plan and collect payment later from the member's profile.
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <SectionLabel>Payment</SectionLabel>

                  {!selectedPlanId ? (
                    <p className="text-[13px] text-ink-tertiary">
                      No plan was selected — this member will be registered as a profile-only entry with
                      no payment. You can add a plan and collect payment any time from their profile.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label={`Amount Received (of ₹${selectedPlan.price})`}
                          type="number"
                          step="0.01"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                        />
                        <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          {availableMethods.map((key) => (
                            <option key={key} value={key}>
                              {METHOD_LABELS[key] || key}
                            </option>
                          ))}
                        </Select>
                      </div>

                      {amountDue > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-3">
                          <p className="text-[13px] text-amber-800 dark:text-amber-400 font-medium">
                            ₹{amountDue.toLocaleString('en-IN')} will remain due after this payment.
                          </p>
                          <Input
                            label="Due Date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                          <p className="text-[12px] text-amber-700 dark:text-amber-500">
                            This will appear under Billing → Pending Payments so it isn't lost.
                          </p>
                        </div>
                      )}

                      {paymentMethod === 'upi' && (
                        <div className="flex flex-col items-center p-4 border border-black/[0.06] dark:border-white/[0.08] rounded-xl">
                          <p className="text-[13px] font-medium text-ink dark:text-zinc-100 flex items-center gap-1.5 mb-3">
                            <QrCode size={15} /> Scan to pay ₹{Number(amountReceived || 0).toLocaleString('en-IN')}
                          </p>
                          {upiLoading ? (
                            <div className="h-40 w-40 flex items-center justify-center text-ink-tertiary text-[12px]">
                              Generating…
                            </div>
                          ) : upiQrUrl ? (
                            <img src={upiQrUrl} alt="UPI QR" className="h-40 w-40 rounded-xl border border-black/10 dark:border-white/10" />
                          ) : (
                            <p className="text-[12px] text-ink-tertiary text-center">
                              UPI isn't configured for this gym yet — set it under Gym Settings, or choose
                              another payment method.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sticky action bar — Continue always sits bottom-right, flush
                to the card edge, regardless of how much content is above it. */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
              <Button type="button" variant="secondary" onClick={goBack} disabled={step === 1}>
                Back
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={goNext}>
                  Continue <ChevronRight size={15} />
                </Button>
              ) : (
                <Button type="button" onClick={handleRegisterClick} loading={submitting}>
                  Register Member
                </Button>
              )}
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}