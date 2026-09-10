import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Building2, Pencil, UsersRound, LogInIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import ImagePicker from '../../components/common/ImagePicker';
import {
  getCompaniesApi,
  createCompanyApi,
  setCompanyStatusApi,
  updateCompanyApi,
} from '../../api/companies';

export default function CompanyMaster() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const navigate = useNavigate();

  const createForm = useForm();
  const editForm = useForm();

  const { startManaging } = useAuth();

const manage = (company) => {
  startManaging(company);
  navigate('/dashboard');
};






  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getCompaniesApi();
      setCompanies(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (values) => {
    try {
      const payload = {
        name: values.name,
        code: values.code.toUpperCase(),
        contact: { email: values.email, phone: values.phone },
      };
      if (values.ownerName || values.ownerEmail || values.ownerPassword) {
        payload.ownerName = values.ownerName;
        payload.ownerEmail = values.ownerEmail;
        payload.ownerPassword = values.ownerPassword;
        payload.ownerPhone = values.ownerPhone;
      }
      const res = await createCompanyApi(payload);
      if (res.owner) {
        toast.success(`Gym onboarded — owner login ready for ${res.owner.email}`);
      } else {
        toast.success('Gym onboarded — add staff logins any time from "All Users"');
      }
      setModalOpen(false);
      createForm.reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create company');
    }
  };

  const toggleStatus = async (company) => {
    try {
      await setCompanyStatusApi(company._id, !company.isActive);
      toast.success(`${company.name} ${company.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    editForm.reset({
      name: company.name,
      email: company.contact?.email || '',
      phone: company.contact?.phone || '',
      address: company.contact?.address || '',
      city: company.contact?.city || '',
      state: company.contact?.state || '',
      plan: company.subscription?.plan || 'trial',
      logoUrl: company.branding?.logoUrl || '',
      primaryColor: company.branding?.primaryColor || '#0A84FF',
      tagline: company.branding?.tagline || '',
    });
  };

  const onEditSave = async (values) => {
    try {
      await updateCompanyApi(editingCompany._id, {
        name: values.name,
        contact: {
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
        },
        subscription: { ...editingCompany.subscription, plan: values.plan },
        branding: {
          ...editingCompany.branding,
          logoUrl: values.logoUrl,
          primaryColor: values.primaryColor,
          tagline: values.tagline,
        },
      });
      toast.success('Gym details updated');
      setEditingCompany(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update company');
    }
  };



  return (
    <DashboardLayout title="Company Master">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Onboard Gym
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No gyms onboarded yet"
            description="Onboard the first gym to get the platform running."
            action={<Button onClick={() => setModalOpen(true)}>Onboard Gym</Button>}
          />
        ) : (
          <Table columns={['Gym', 'Code', 'Contact', 'Plan', 'Onboarded', 'Status', 'Actions']}>
            {companies.map((c) => (
              <tr key={c._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{c.code}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{c.contact?.email || '—'}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary capitalize">{c.subscription?.plan}</td>
                <td className="px-4 py-3 text-[12px] text-ink-tertiary">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Badge status={c.isActive ? 'active' : 'cancelled'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/superadmin/users?company=${c._id}`)}>
                      <UsersRound size={13} /> Users
                    </Button>
                    <Button size="sm" onClick={() => manage(c)}>
                    <LogInIcon size={13} /> Manage
                  </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(c)}>
                      <Pencil size={13} /> Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(c)}>
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Onboard a New Gym">
        <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Gym Name"
            placeholder="Iron Paradise Fitness"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name', { required: 'Gym name is required' })}
          />
          <Input
            label="Company Code"
            placeholder="IRONPARADISE"
            error={createForm.formState.errors.code?.message}
            {...createForm.register('code', {
              required: 'Code is required',
              minLength: { value: 3, message: 'Min 3 characters' },
            })}
          />
          <Input label="Contact Email" type="email" {...createForm.register('email')} />
          <Input label="Contact Phone" {...createForm.register('phone')} />

          <div className="pt-2 border-t border-black/[0.06]">
            <p className="text-[13px] font-medium text-ink-secondary mb-3 pt-3">
              Owner login (optional — create it now, or add it later from "All Users")
            </p>
            <div className="space-y-4">
              <Input label="Owner Name" {...createForm.register('ownerName')} />
              <Input label="Owner Email" type="email" {...createForm.register('ownerEmail')} />
              <Input
                label="Owner Password"
                type="password"
                placeholder="Minimum 6 characters"
                error={createForm.formState.errors.ownerPassword?.message}
                {...createForm.register('ownerPassword', {
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
              />
              <Input label="Owner Phone (optional)" {...createForm.register('ownerPhone')} />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Onboard Gym
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!editingCompany}
        onClose={() => setEditingCompany(null)}
        title={editingCompany ? `Edit ${editingCompany.name}` : 'Edit Gym'}
      >
        <form onSubmit={editForm.handleSubmit(onEditSave)} className="space-y-4">
          <Input label="Gym Name" {...editForm.register('name', { required: 'Gym name is required' })} />
          <Input label="Contact Email" type="email" {...editForm.register('email')} />
          <Input label="Contact Phone" {...editForm.register('phone')} />
          <Input label="Address" {...editForm.register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...editForm.register('city')} />
            <Input label="State" {...editForm.register('state')} />
          </div>
          <Select label="Subscription Plan" {...editForm.register('plan')}>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </Select>
          <ImagePicker
                label="Logo"
                value={editForm.watch('logoUrl')}
                onChange={(val) => editForm.setValue('logoUrl', val, { shouldDirty: true })}
                shape="square"
                size={80}
              />
          <Input label="Tagline" {...editForm.register('tagline')} />
          <label className="block">
            <span className="block text-[13px] font-medium text-ink-secondary mb-1.5">Brand Color</span>
            <input
              type="color"
              {...editForm.register('primaryColor')}
              className="h-11 w-20 rounded-lg border border-black/10 cursor-pointer"
            />
          </label>
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}