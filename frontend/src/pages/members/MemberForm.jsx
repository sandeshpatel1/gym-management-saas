import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, QrCode } from 'lucide-react';
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
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0 ${
                done ? 'bg-brand text-white' : active ? 'bg-brand/10 text-brand border-2 border-brand' : 'bg-black/[0.06] text-ink-tertiary'
              }`}
            >
              {done ? <Check size={15} /> : idx}
            </div>
            <span className={`text-[13px] font-medium hidden sm:inline ${active ? 'text-ink' : 'text-ink-tertiary'}`}>
              {label}
            </span>
            {idx < STEPS.length && <div className="flex-1 h-px bg-black/[0.08]" />}
          </div>
        );
      })}
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

  // --- Step navigation is fully manual and defensive: preventDefault +
  // stopPropagation on every click, so nothing here can ever fall through
  // to a native form submission no matter what the browser/Enter-key/
  // button-type edge case is. Advancing steps NEVER calls onSubmit. ---
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

  // Step 3's "Register Member" button is type="button" and manually
  // triggers RHF's validated submit handler on click. This means the ONLY
  // way onSubmit ever runs is this explicit call — never via implicit
  // browser form submission, Enter-key, or a stray submit-typed control.
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
          {step === 1 && (
            <div className="space-y-6">
              <Card className="p-6">
                <p className="text-[14px] font-semibold text-ink mb-4">Personal Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </Card>

              <Card className="p-6">
                <p className="text-[14px] font-semibold text-ink mb-4">Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Name" {...register('emergencyName')} />
                  <Input label="Phone" {...register('emergencyPhone')} />
                  <Input label="Relation" placeholder="Parent / Spouse / Friend" {...register('emergencyRelation')} />
                </div>
              </Card>

              <Card className="p-6">
                <p className="text-[14px] font-semibold text-ink mb-4">Fitness Intake (optional)</p>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Health Notes" placeholder="Injuries, conditions to be aware of" {...register('healthNotes')} />
                  <Input label="Goals (comma separated)" placeholder="Weight loss, Strength, Endurance" {...register('goals')} />
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card className="p-6">
              <p className="text-[14px] font-semibold text-ink mb-4">Choose a Membership Plan</p>
              <Select label="Plan (optional — skip to register profile only)" {...register('planId')}>
                <option value="">No plan — register profile only</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₹{p.price} / {p.durationInDays} days
                  </option>
                ))}
              </Select>

              {selectedPlan && (
                <div className="mt-4 p-4 bg-surface-subtle rounded-xl text-[13px] text-ink-secondary">
                  <p>
                    <span className="font-medium text-ink">{selectedPlan.name}</span> · ₹{selectedPlan.price} for{' '}
                    {selectedPlan.durationInDays} days
                  </p>
                  {selectedPlan.description && <p className="mt-1">{selectedPlan.description}</p>}
                </div>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card className="p-6 space-y-4">
              <p className="text-[14px] font-semibold text-ink">Payment</p>

              {!selectedPlanId ? (
                <p className="text-[13px] text-ink-tertiary">
                  No plan was selected — this member will be registered as a profile-only entry with
                  no payment. You can add a plan and collect payment any time from their profile.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-[13px] text-amber-800 font-medium">
                        ₹{amountDue.toLocaleString('en-IN')} will remain due after this payment.
                      </p>
                      <Input
                        label="Due Date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                      <p className="text-[12px] text-amber-700">
                        This will appear under Billing → Pending Payments so it isn't lost.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="flex flex-col items-center p-4 border border-black/[0.06] rounded-xl">
                      <p className="text-[13px] font-medium text-ink flex items-center gap-1.5 mb-3">
                        <QrCode size={15} /> Scan to pay ₹{Number(amountReceived || 0).toLocaleString('en-IN')}
                      </p>
                      {upiLoading ? (
                        <div className="h-48 w-48 flex items-center justify-center text-ink-tertiary text-[12px]">
                          Generating…
                        </div>
                      ) : upiQrUrl ? (
                        <img src={upiQrUrl} alt="UPI QR" className="h-48 w-48 rounded-xl border border-black/10" />
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
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <Button type="button" variant="secondary" onClick={goBack} disabled={step === 1}>
              Back
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleRegisterClick} loading={submitting}>
                Register Member
              </Button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}