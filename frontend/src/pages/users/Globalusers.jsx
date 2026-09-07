import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { getCompaniesApi } from '../../api/companies';

export default function GlobalUsers() {
  const [searchParams] = useSearchParams();
  const initialCompany = searchParams.get('company') || '';

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState(initialCompany);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'manager', company: initialCompany } });

  const loadCompanies = async () => {
    try {
      const { data } = await getCompaniesApi();
      setCompanies(data);
    } catch {
      /* the company dropdown is a convenience; the user table still works without it */
    }
  };

  const loadUsers = async (company) => {
    setLoading(true);
    try {
      const { data } = await getUsersApi(company ? { company } : undefined);
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadUsers(initialCompany || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilterChange = (e) => {
    const value = e.target.value;
    setCompanyFilter(value);
    loadUsers(value || undefined);
  };

  const onCreate = async (values) => {
    try {
      await createUserApi(values);
      toast.success('Login created');
      setModalOpen(false);
      reset({ role: 'manager', company: companyFilter });
      loadUsers(companyFilter || undefined);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create login');
    }
  };

  const toggleActive = async (u) => {
    try {
      await updateUserApi(u._id, { isActive: !u.isActive });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      loadUsers(companyFilter || undefined);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update user');
    }
  };

  return (
    <DashboardLayout title="All Users">
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <Select value={companyFilter} onChange={onFilterChange} className="sm:w-72">
          <option value="">All gyms</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.code})
            </option>
          ))}
        </Select>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Create Login
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No users found"
            description="Create a login for a gym's owner, manager, or trainer."
            action={<Button onClick={() => setModalOpen(true)}>Create Login</Button>}
          />
        ) : (
          <Table columns={['Name', 'Email', 'Gym', 'Role', 'Status', 'Created', 'Last Login', 'Actions']}>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{u.email}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{u.company?.name || '—'}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <Badge status={u.isActive ? 'active' : 'cancelled'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Login">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Select
            label="Gym"
            error={errors.company?.message}
            {...register('company', { required: 'Choose which gym this login belongs to' })}
          >
            <option value="">Select a gym</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
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
            <option value="owner">Owner</option>
            <option value="manager">Manager (front-desk)</option>
            <option value="trainer">Trainer</option>
          </Select>
          <Button type="submit" className="w-full">
            Create Login
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}