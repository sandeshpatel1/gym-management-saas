import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Wallet, Trash2, CreditCard } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { getPlatformPaymentMethodsApi, updatePlatformPaymentMethodsApi } from '../../api/platformSettings';
import {
  getPlatformGatewayProvidersApi,
  updatePlatformGatewayProvidersApi,
} from '../../api/paymentGateway';

export default function PlatformPaymentSettings() {
  const [methods, setMethods] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMethods, setSavingMethods] = useState(false);
  const [savingGateways, setSavingGateways] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: m }, { data: g }] = await Promise.all([
        getPlatformPaymentMethodsApi(),
        getPlatformGatewayProvidersApi(),
      ]);
      setMethods(m);
      setGateways(g);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load payment settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // --- Simple methods (cash/card/upi/etc) ---
  const toggleMethod = (key) => {
    setMethods((prev) => prev.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m)));
  };

  const addMethod = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return toast.error('Enter a key, e.g. "wallet"');
    if (methods.some((m) => m.key === key)) return toast.error('That key already exists');
    setMethods((prev) => [...prev, { key, label: newLabel.trim() || key, enabled: true }]);
    setNewKey('');
    setNewLabel('');
  };

  const saveMethods = async () => {
    setSavingMethods(true);
    try {
      await updatePlatformPaymentMethodsApi(methods);
      toast.success('Payment methods updated for every gym on the platform');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSavingMethods(false);
    }
  };

  // --- Gateway providers (Razorpay/Easebuzz/...) ---
  const toggleGateway = (key) => {
    setGateways((prev) => prev.map((g) => (g.key === key ? { ...g, enabled: !g.enabled } : g)));
  };

  const updateGatewayField = (key, index, field, value) => {
    setGateways((prev) =>
      prev.map((g) => {
        if (g.key !== key) return g;
        const fields = [...g.fields];
        fields[index] = { ...fields[index], [field]: value };
        return { ...g, fields };
      })
    );
  };

  const addGatewayField = (key) => {
    setGateways((prev) =>
      prev.map((g) => (g.key === key ? { ...g, fields: [...g.fields, { name: '', label: '', secret: true }] } : g))
    );
  };

  const removeGatewayField = (key, index) => {
    setGateways((prev) =>
      prev.map((g) => (g.key === key ? { ...g, fields: g.fields.filter((_, i) => i !== index) } : g))
    );
  };

  const addGateway = () => {
    const key = prompt('Gateway key (e.g. "cashfree")')?.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) return;
    if (gateways.some((g) => g.key === key)) return toast.error('That key already exists');
    setGateways((prev) => [
      ...prev,
      { key, label: key, checkoutType: 'modal', enabled: true, fields: [{ name: 'apiKey', label: 'API Key', secret: false }] },
    ]);
  };

  const saveGateways = async () => {
    setSavingGateways(true);
    try {
      await updatePlatformGatewayProvidersApi(gateways);
      toast.success('Gateway providers updated — gym owners can now use these under their Settings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save gateway providers');
    } finally {
      setSavingGateways(false);
    }
  };

  return (
    <DashboardLayout title="Payment Methods & Gateways">
      {loading ? (
        <div className="py-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
      ) : (
        <>
          <Card className="p-6 mb-6">
            <p className="text-[14px] font-semibold text-ink mb-1 flex items-center gap-2">
              <Wallet size={16} /> Simple Payment Methods
            </p>
            <p className="text-[13px] text-ink-tertiary mb-4">
              These appear as method options across billing (cash, card, UPI, etc). Enabling/disabling
              here applies platform-wide.
            </p>
            {methods.length === 0 ? (
              <EmptyState icon={Wallet} title="No methods configured" />
            ) : (
              <div className="space-y-2 mb-6">
                {methods.map((m) => (
                  <label key={m.key} className="flex items-center justify-between px-4 py-3 rounded-xl border border-black/[0.06] cursor-pointer">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{m.label}</p>
                      <p className="text-[12px] text-ink-tertiary">key: {m.key}</p>
                    </div>
                    <input type="checkbox" checked={m.enabled} onChange={() => toggleMethod(m.key)} className="h-5 w-5 accent-brand" />
                  </label>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-black/[0.06] mb-4">
              <div className="w-40">
                <Input label="New method key" placeholder="wallet" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <Input label="Display label" placeholder="Wallet" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              </div>
              <Button variant="secondary" onClick={addMethod}>
                <Plus size={15} /> Add Method
              </Button>
            </div>
            <Button onClick={saveMethods} loading={savingMethods}>
              <Save size={16} /> Save Methods
            </Button>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-1 flex items-center gap-2">
              <CreditCard size={16} /> Payment Gateway Providers
            </p>
            <p className="text-[13px] text-ink-tertiary mb-4">
              Define which gateways (Razorpay, Easebuzz, or any other) gym owners can plug their own
              API credentials into from their own Gym Settings. Define the exact credential fields
              each gateway needs — owners only see and fill in these fields.
            </p>

            <div className="space-y-4 mb-6">
              {gateways.map((g) => (
                <div key={g.key} className="border border-black/[0.06] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{g.label}</p>
                      <p className="text-[12px] text-ink-tertiary">key: {g.key} · checkout: {g.checkoutType}</p>
                    </div>
                    <label className="flex items-center gap-2 text-[12px] text-ink-secondary cursor-pointer">
                      Enabled
                      <input type="checkbox" checked={g.enabled} onChange={() => toggleGateway(g.key)} className="h-5 w-5 accent-brand" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <Select
                      label="Checkout type"
                      value={g.checkoutType}
                      onChange={(e) =>
                        setGateways((prev) => prev.map((x) => (x.key === g.key ? { ...x, checkoutType: e.target.value } : x)))
                      }
                    >
                      <option value="modal">Modal (in-page checkout, e.g. Razorpay)</option>
                      <option value="redirect">Redirect (hosted page, e.g. Easebuzz)</option>
                    </Select>
                  </div>

                  <p className="text-[12px] font-medium text-ink-secondary mt-3 mb-2">Credential fields owners must fill in</p>
                  <div className="space-y-2">
                    {g.fields.map((f, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-2">
                        <div className="w-36">
                          <Input label="Field name" placeholder="keyId" value={f.name} onChange={(e) => updateGatewayField(g.key, i, 'name', e.target.value)} />
                        </div>
                        <div className="flex-1 min-w-[140px]">
                          <Input label="Display label" placeholder="Key ID" value={f.label} onChange={(e) => updateGatewayField(g.key, i, 'label', e.target.value)} />
                        </div>
                        <label className="flex items-center gap-1.5 text-[12px] text-ink-secondary mb-2.5 cursor-pointer">
                          <input type="checkbox" checked={f.secret} onChange={(e) => updateGatewayField(g.key, i, 'secret', e.target.checked)} className="h-4 w-4 accent-brand" />
                          Secret
                        </label>
                        <button type="button" onClick={() => removeGatewayField(g.key, i)} className="text-ink-tertiary hover:text-red-500 mb-2.5 press-feedback">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => addGatewayField(g.key)}>
                    <Plus size={13} /> Add Field
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={addGateway}>
                <Plus size={15} /> Add New Gateway
              </Button>
              <Button onClick={saveGateways} loading={savingGateways}>
                <Save size={16} /> Save Gateways
              </Button>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}