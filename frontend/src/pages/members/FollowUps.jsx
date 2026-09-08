import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PhoneCall, UserX, History } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { getFollowUpListApi, createFollowUpApi } from '../../api/followUps';

const TABS = [
  { value: '', label: 'All' },
  { value: 'absent', label: 'Absent 7+ Days' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'trial', label: 'Trial / Enquiry' },
];

const badgeForType = (type) =>
  type === 'absent' ? 'expired' : type === 'inactive' ? 'cancelled' : 'pending';

const labelForType = (type) =>
  type === 'absent' ? 'Absent 7+ days' : type === 'inactive' ? 'Inactive' : 'Trial / Enquiry';

export default function FollowUps() {
  const [tab, setTab] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMember, setActiveMember] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async (type) => {
    setLoading(true);
    try {
      const { data } = await getFollowUpListApi(type || undefined);
      setCandidates(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load follow-up list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openFollowUp = (candidate) => {
    setActiveMember(candidate);
    reset({ reason: '' });
  };

  const onSubmit = async (values) => {
    try {
      await createFollowUpApi({
        memberId: activeMember.member._id,
        type: activeMember.type,
        reason: values.reason,
      });
      toast.success('Follow-up logged');
      setActiveMember(null);
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not log follow-up');
    }
  };

  return (
    <DashboardLayout title="Member Follow-ups">
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-medium press-feedback transition-colors ${
              tab === t.value
                ? 'bg-brand text-white'
                : 'bg-white text-ink-secondary border border-black/10 hover:bg-black/[0.03]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-10 text-center text-ink-tertiary text-[13px]">Loading…</div>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={UserX}
            title="Nothing to follow up on"
            description="No members currently need a check-in call."
          />
        ) : (
          <Table columns={['Member', 'Type', 'Status / Plan', 'Last Visit', 'Last Follow-up', 'Actions']}>
            {candidates.map((c) => (
              <tr key={c.member._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3">
                  <p className="text-[14px] font-medium text-ink">{c.member.fullName}</p>
                  <p className="text-[12px] text-ink-tertiary">
                    {c.member.memberCode} · {c.member.phone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge status={badgeForType(c.type)}>{labelForType(c.type)}</Badge>
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {c.member.currentPlan ? c.member.currentPlan.name : 'No plan yet'}
                  {c.member.membershipEnd && (
                    <span className="block text-[11px] text-ink-tertiary">
                      Till {new Date(c.member.membershipEnd).toLocaleDateString()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {c.lastAttendance || 'Never'}
                </td>
                <td className="px-4 py-3 text-[12px] text-ink-secondary max-w-[220px]">
                  {c.lastFollowUp ? (
                    <>
                      <p className="text-ink">{c.lastFollowUp.reason}</p>
                      <p className="text-ink-tertiary">
                        {c.lastFollowUp.calledBy} · {new Date(c.lastFollowUp.calledAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <span className="text-ink-tertiary italic">Not contacted yet</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button variant="secondary" size="sm" onClick={() => openFollowUp(c)}>
                    <PhoneCall size={13} /> Log Call
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={!!activeMember}
        onClose={() => setActiveMember(null)}
        title={activeMember ? `Follow-up · ${activeMember.member.fullName}` : 'Follow-up'}
      >
        {activeMember && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 text-[12px] text-ink-tertiary">
              <History size={14} /> {labelForType(activeMember.type)} · {activeMember.member.memberCode}
            </div>
            <label className="block">
              <span className="block text-[13px] font-medium text-ink-secondary mb-1.5">
                Reason / Conclusion of the call
              </span>
              <textarea
                rows={4}
                placeholder="e.g. Spoke to member, will renew next week / not interested / travelling..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] outline-none focus:border-brand ${
                  errors.reason ? 'border-red-400' : 'border-black/10'
                }`}
                {...register('reason', { required: 'Please enter a reason or outcome' })}
              />
              {errors.reason && (
                <span className="block text-[12px] text-red-500 mt-1">{errors.reason.message}</span>
              )}
            </label>
            <Button type="submit" className="w-full">
              Save Follow-up
            </Button>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}