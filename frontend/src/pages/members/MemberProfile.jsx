import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, RefreshCcw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { getMemberByIdApi, renewMembershipApi } from '../../api/members';
import { getMemberAttendanceHistoryApi } from '../../api/attendance';
import { getPlansApi } from '../../api/membershipPlans';
import { exportMemberReportCard } from '../../api/reports';

export default function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [plans, setPlans] = useState([]);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewAmount, setRenewAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data }, attendanceRes, plansRes] = await Promise.all([
        getMemberByIdApi(id),
        getMemberAttendanceHistoryApi(id),
        getPlansApi(),
      ]);
      setMember(data.member);
      setPayments(data.payments);
      setAttendance(attendanceRes.data);
      setPlans(plansRes.data.filter((p) => p.isActive));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRenew = async () => {
    if (!renewPlanId) return toast.error('Choose a plan');
    try {
      await renewMembershipApi(id, {
        planId: renewPlanId,
        amountPaid: renewAmount ? Number(renewAmount) : undefined,
      });
      toast.success('Membership renewed');
      setRenewOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not renew membership');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Member">
        <div className="text-center text-ink-tertiary text-[13px] py-10">Loading…</div>
      </DashboardLayout>
    );
  }
  if (!member) return null;

  return (
    <DashboardLayout title="Member Report Card">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 h-fit">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-[22px] font-semibold">
              {member.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[16px] font-semibold text-ink">{member.fullName}</p>
              <p className="text-[13px] text-ink-tertiary">{member.memberCode}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Status" value={<Badge status={member.status} />} />
            <Row label="Phone" value={member.phone} />
            {member.email && <Row label="Email" value={member.email} />}
            <Row label="Gender" value={member.gender} />
            <Row label="DOB" value={new Date(member.dob).toLocaleDateString()} />
            {member.currentPlan && <Row label="Plan" value={member.currentPlan.name} />}
            {member.membershipEnd && (
              <Row label="Valid Till" value={new Date(member.membershipEnd).toLocaleDateString()} />
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="secondary" className="flex-1" onClick={() => setRenewOpen(true)}>
              <RefreshCcw size={15} /> Renew
            </Button>
            <Button
              className="flex-1"
              onClick={() => exportMemberReportCard(member._id, member.memberCode)}
            >
              <Download size={15} /> PDF
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Payment History</p>
            {payments.length === 0 ? (
              <p className="text-[13px] text-ink-tertiary">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p._id}
                    className="flex justify-between items-center py-2 border-b border-black/[0.04] last:border-0"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-ink">{p.invoiceNumber}</p>
                      <p className="text-[12px] text-ink-tertiary">
                        {new Date(p.paidAt).toLocaleDateString()} · {p.method}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-ink">₹{p.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Recent Attendance</p>
            {attendance.length === 0 ? (
              <p className="text-[13px] text-ink-tertiary">No attendance recorded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {attendance.slice(0, 12).map((a) => (
                  <div key={a._id} className="bg-surface-subtle rounded-lg px-3 py-2 text-[12px]">
                    <p className="font-medium text-ink">{a.date}</p>
                    <p className="text-ink-tertiary">{new Date(a.checkInTime).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={renewOpen} onClose={() => setRenewOpen(false)} title="Renew Membership">
        <div className="space-y-4">
          <Select
            label="Plan"
            value={renewPlanId}
            onChange={(e) => setRenewPlanId(e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — ₹{p.price} / {p.durationInDays} days
              </option>
            ))}
          </Select>
          <Input
            label="Amount Received (optional, defaults to plan price)"
            type="number"
            value={renewAmount}
            onChange={(e) => setRenewAmount(e.target.value)}
          />
          <Button className="w-full" onClick={handleRenew}>
            Confirm Renewal
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-tertiary">{label}</span>
      <span className="text-ink font-medium capitalize">{value}</span>
    </div>
  );
}
