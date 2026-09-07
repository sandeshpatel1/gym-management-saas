import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, CheckCircle2, CalendarCheck } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import { searchMembersApi } from '../../api/members';
import { markAttendanceApi, getAttendanceByDateApi } from '../../api/attendance';

export default function AttendanceMarking() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [todayList, setTodayList] = useState([]);
  const [marking, setMarking] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const loadToday = async () => {
    try {
      const { data } = await getAttendanceByDateApi(today);
      setTodayList(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load attendance');
    }
  };

  useEffect(() => {
    loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const { data } = await searchMembersApi(query.trim());
        setResults(data);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const alreadyMarked = (memberId) => todayList.some((a) => a.member?._id === memberId);

  const handleMark = async (member) => {
    setMarking(member._id);
    try {
      await markAttendanceApi(member._id, today);
      toast.success(`${member.fullName} marked present`);
      setQuery('');
      setResults([]);
      loadToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark attendance');
    } finally {
      setMarking(null);
    }
  };

  return (
    <DashboardLayout title="Attendance">
      <Card className="p-6 mb-6">
        <p className="text-[14px] font-semibold text-ink mb-3">Mark Attendance</p>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member by name, phone, or code…"
            className="w-full pl-9 pr-3.5 py-3 rounded-xl border border-black/10 text-[15px] outline-none focus:border-brand"
          />
        </div>
        {results.length > 0 && (
          <div className="border border-black/[0.06] rounded-xl divide-y divide-black/[0.04] overflow-hidden">
            {results.map((m) => {
              const done = alreadyMarked(m._id);
              return (
                <button
                  key={m._id}
                  disabled={done || marking === m._id}
                  onClick={() => handleMark(m)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] disabled:opacity-50 text-left press-feedback"
                >
                  <div>
                    <p className="text-[14px] font-medium text-ink">{m.fullName}</p>
                    <p className="text-[12px] text-ink-tertiary">
                      {m.memberCode} · {m.phone}
                    </p>
                  </div>
                  {done ? (
                    <span className="text-[12px] text-green-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Marked
                    </span>
                  ) : (
                    <span className="text-[12px] text-brand font-medium">Mark present</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <p className="text-[14px] font-semibold text-ink">Today's Roster · {today}</p>
        </div>
        {todayList.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No check-ins yet today"
            description="Search a member above to mark them present."
          />
        ) : (
          <Table columns={['Member', 'Code', 'Check-in Time', 'Marked By']}>
            {todayList.map((a) => (
              <tr key={a._id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-[14px] font-medium text-ink">{a.member?.fullName}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{a.member?.memberCode}</td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">
                  {new Date(a.checkInTime).toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 text-[13px] text-ink-secondary">{a.markedBy?.name}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </DashboardLayout>
  );
}
