import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getPlatformPaymentMethodsApi, updatePlatformPaymentMethodsApi } from '../../api/platformSettings';

export default function PlatformPaymentSettings() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getPlatformPaymentMethodsApi();
      setMethods(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = (key) => {
    setMethods((prev) => prev.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)));
  };

  const addMethod = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return toast.error('Enter a key, e.g. "razorpay"');
    if (methods.some((m) => m.key === key)) return toast.error('That key already exists');
    setMethods((prev) => [...prev, { key, label: newLabel.trim() || key, enabled: true }]);
    setNewKey('');
    setNewLabel('');
  };

  const save = async () => {
    setSaving(true);
    try {
      await updatePlatformPaymentMethodsApi(methods);
      toast.success('Payment methods updated for every gym on the platform');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Platform Payment Methods">
      <Card className="p-6 mb-6">
        <p className="text-[13px] text-ink-tertiary mb-4">
          Methods enabled here become available for every gym owner to turn on for their own gym
          under Settings. Disabling a method here hides it platform-wide, even if a gym had it on.
        </p>

        {loading ? (
          <div className="py-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : methods.length === 0 ? (
          <EmptyState icon={Wallet} title="No methods configured" />
        ) : (
          <div className="space-y-2 mb-6">
            {methods.map((m) => (
              <label
                key={m.key}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-black/[0.06] cursor-pointer"
              >
                <div>
                  <p className="text-[14px] font-medium text-ink">{m.label}</p>
                  <p className="text-[12px] text-ink-tertiary">key: {m.key}</p>
                </div>
                <input
                  type="checkbox"
                  checked={m.enabled}
                  onChange={() => toggle(m.key)}
                  className="h-5 w-5 accent-brand"
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-black/[0.06]">
          <div className="w-40">
            <Input label="New method key" placeholder="razorpay" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Input label="Display label" placeholder="Razorpay" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          </div>
          <Button variant="secondary" onClick={addMethod}>
            <Plus size={15} /> Add Method
          </Button>
        </div>
      </Card>

      <Button onClick={save} loading={saving}>
        <Save size={16} /> Save Changes
      </Button>
    </DashboardLayout>
  );
}