import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, CreditCard, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { getPlansApi, createPlanApi, deletePlanApi } from '../../api/membershipPlans';

export default function MembershipPlans() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getPlansApi();
      setPlans(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (values) => {
    try {
      await createPlanApi({
        name: values.name,
        description: values.description,
        durationInDays: Number(values.durationInDays),
        price: Number(values.price),
        category: values.category,
        features: values.features ? values.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
      });
      toast.success('Plan created');
      setModalOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create plan');
    }
  };

  const onDelete = async (id) => {
    try {
      await deletePlanApi(id);
      toast.success('Plan deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate plan');
    }
  };

  return (
    <DashboardLayout title="Membership Plans">
      {isOwner && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New Plan
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-ink-tertiary text-[13px] py-10">Loading…</div>
      ) : plans.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No membership plans yet"
            description="Create your first plan — e.g. Monthly, Quarterly, or Annual Unlimited."
            action={isOwner && <Button onClick={() => setModalOpen(true)}>New Plan</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p._id} className="p-5" hover>
              <div className="flex justify-between items-start mb-2">
                <p className="text-[15px] font-semibold text-ink">{p.name}</p>
                {isOwner && p.isActive && (
                  <button
                    onClick={() => onDelete(p._id)}
                    className="text-ink-tertiary hover:text-red-500 press-feedback"
                    title="Deactivate plan"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p className="text-[24px] font-semibold text-brand display-text">
                ₹{p.price.toLocaleString('en-IN')}
              </p>
              <p className="text-[12px] text-ink-tertiary mb-3">{p.durationInDays} days</p>
              {p.description && <p className="text-[13px] text-ink-secondary mb-3">{p.description}</p>}
              {p.features?.length > 0 && (
                <ul className="space-y-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-[12px] text-ink-secondary flex items-start gap-1.5">
                      <span className="text-brand mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              )}
              {!p.isActive && (
                <p className="text-[11px] text-ink-tertiary mt-3 italic">Deactivated</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Membership Plan">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="Quarterly Unlimited"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (days)"
              type="number"
              error={errors.durationInDays?.message}
              {...register('durationInDays', { required: 'Required', min: { value: 1, message: 'Must be at least 1' } })}
            />
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              error={errors.price?.message}
              {...register('price', { required: 'Required', min: { value: 0, message: 'Must be positive' } })}
            />
          </div>
          <Select label="Category" {...register('category')}>
            <option value="general">General</option>
            <option value="cardio">Cardio</option>
            <option value="strength">Strength</option>
            <option value="personal-training">Personal Training</option>
            <option value="group-class">Group Class</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Description" {...register('description')} />
          <Input
            label="Features (comma separated)"
            placeholder="Unlimited classes, Locker access, 1 PT session/month"
            {...register('features')}
          />
          <Button type="submit" className="w-full">
            Create Plan
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
