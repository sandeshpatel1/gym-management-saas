import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, UsersRound } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { getUsersApi, createUserApi, updateUserApi } from '../../api/users';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { role: 'manager' },
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getUsersApi();
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (values) => {
    try {
      await createUserApi(values);
      toast.success('Staff account created');
      setModalOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create staff account');
    }
  };

  const toggleActive = async (u) => {
    try {
      await updateUserApi(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user');
    }
  };

  return (
    <DashboardLayout title="Staff & Users">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Staff
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No staff accounts yet"
            description="Add managers or trainers so they can log in to this dashboard."
            action={<Button onClick={() => setModalOpen(true)}>Add Staff</Button>}
          />
        ) : (
          <Table columns={['Name', 'Email', 'Role', 'Status', 'Actions']}>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{u.email}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge status={u.isActive ? 'active' : 'cancelled'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Staff Account">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Full Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' },
            })}
          />
          <Input label="Phone (optional)" {...register('phone')} />
          <Select label="Role" {...register('role')}>
            <option value="manager">Manager (front-desk)</option>
            <option value="trainer">Trainer</option>
            <option value="owner">Owner</option>
          </Select>
          <Button type="submit" className="w-full">
            Create Account
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
