import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, CalendarCheck, IndianRupee, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { getDashboardStatsApi } from '../../api/reports';
import { getRevenueReportApi } from '../../api/reports';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout title="Dashboard">
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
    </DashboardLayout>
  );
}