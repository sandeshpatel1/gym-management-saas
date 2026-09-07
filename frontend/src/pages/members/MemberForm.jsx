import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getPlansApi } from '../../api/membershipPlans';
import { createMemberApi } from '../../api/members';

export default function MemberForm() {
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { gender: 'male', paymentMethod: 'cash' } });

  const selectedPlanId = watch('planId');
  const selectedPlan = plans.find((p) => p._id === selectedPlanId);

  useEffect(() => {
    getPlansApi()
      .then(({ data }) => setPlans(data.filter((p) => p.isActive)))
      .catch(() => toast.error('Could not load membership plans'));
  }, []);

  const onSubmit = async (values) => {
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
        planId: values.planId || undefined,
        amountPaid: values.planId ? Number(values.amountPaid || selectedPlan?.price || 0) : undefined,
        paymentMethod: values.paymentMethod,
      };
      const { data } = await createMemberApi(payload);
      toast.success(`${data.fullName} registered — code ${data.memberCode}`);
      navigate(`/members/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Register Member">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                {...register('email', {
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
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

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Membership Plan</p>
            <Select label="Choose a plan (optional)" {...register('planId')}>
              <option value="">No plan — register profile only</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.price} / {p.durationInDays} days
                </option>
              ))}
            </Select>

            {selectedPlanId && (
              <div className="mt-4 space-y-4">
                <Input
                  label="Amount Received"
                  type="number"
                  step="0.01"
                  defaultValue={selectedPlan?.price}
                  {...register('amountPaid')}
                />
                <Select label="Payment Method" {...register('paymentMethod')}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            )}
          </Card>

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            Register Member
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
