import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, CalendarCheck, IndianRupee, AlertTriangle, PhoneCall } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FollowUpPopup from '../../components/common/FollowUpPopup';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsApi, getRevenueReportApi } from '../../api/reports';
import { getFollowUpSummaryApi } from '../../api/followUps';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import MemberSearchBar from '../../components/common/MemberSearchBar';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followUpSummary, setFollowUpSummary] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          getDashboardStatsApi(),
          getRevenueReportApi(),
        ]);
        setStats(statsRes.data);
        setRevenueTrend(
          revenueRes.data.byDay.map((d) => ({ date: d._id.slice(5), total: d.total }))
        );
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await getFollowUpSummaryApi();
        setFollowUpSummary(data);

        if (data.total > 0) {
          const today = new Date().toISOString().slice(0, 10);
          const key = `followup_popup_${user.id}_${today}`;
          if (!localStorage.getItem(key)) {
            setPopupOpen(true);
            localStorage.setItem(key, '1');
          }
        }
      } catch {
        /* silent - follow-up widget is non-critical for the dashboard */
      }
    })();
  }, [user?.id]);

  return (
    <DashboardLayout title="Dashboard">
       <div className="mb-6">
    <MemberSearchBar />
  </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white/60 dark:bg-zinc-900/50 rounded-xl2 border border-black/[0.06] dark:border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
          >
            <motion.div variants={itemVariants}>
              <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={Users} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="Active Members"
                value={stats?.activeMembers ?? 0}
                icon={UserCheck}
                accent
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="Today's Attendance"
                value={stats?.todaysAttendance ?? 0}
                icon={CalendarCheck}
                sub="Tap to see today's check-ins"
                onClick={() => navigate('/attendance')}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="This Month's Revenue"
                value={`₹${(stats?.monthRevenue ?? 0).toLocaleString('en-IN')}`}
                icon={IndianRupee}
                accent
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label="Expiring in 7 Days"
                value={stats?.expiringSoon ?? 0}
                icon={AlertTriangle}
                sub={stats?.expiringSoon ? 'Follow up for renewal' : 'All clear'}
              />
            </motion.div>
          </motion.div>

          {followUpSummary && followUpSummary.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
              className="mb-6"
            >
              <Card className="p-5 flex items-center justify-between border-amber-300/60 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink dark:text-zinc-100">
                      {followUpSummary.total} member{followUpSummary.total === 1 ? '' : 's'} need follow-up
                    </p>
                    <p className="text-[12px] text-ink-tertiary dark:text-zinc-500">
                      {followUpSummary.counts.absent} absent 7+ days · {followUpSummary.counts.inactive} inactive ·{' '}
                      {followUpSummary.counts.trial} trial / enquiry
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/follow-ups')}>
                  Review
                </Button>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 24 }}
          >
            <Card glass className="p-6">
              <p className="text-[14px] font-semibold text-ink dark:text-zinc-100 mb-4">
                Revenue Trend
              </p>
              {revenueTrend.length === 0 ? (
                <p className="text-[13px] text-ink-tertiary dark:text-zinc-500 py-10 text-center">
                  No revenue recorded yet. Register a member with a plan to see this chart light up.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#86868B" strokeOpacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#86868B" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#86868B" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--brand-color)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </>
      )}

      <FollowUpPopup open={popupOpen} onClose={() => setPopupOpen(false)} summary={followUpSummary} />
    </DashboardLayout>
  );
}