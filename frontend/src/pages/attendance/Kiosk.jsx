import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Smartphone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { startKioskSessionApi, getKioskQrCodeApi } from '../../api/kiosk';
import { getAttendanceByDateApi } from '../../api/attendance';
import CompanyLogo from '../../components/common/CompanyLogo';

export default function Kiosk() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState('');
  const [progress, setProgress] = useState(100);
  const [recent, setRecent] = useState([]);
  const lifetimeRef = useRef(30);
  const objectUrlRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const tickTimerRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadRecent = useCallback(async () => {
    try {
      const { data } = await getAttendanceByDateApi(today);
      setRecent(data.slice(0, 6));
    } catch {
      /* non-critical, keep showing the last known list */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshQr = useCallback(async () => {
    try {
      const { data } = await startKioskSessionApi();
      lifetimeRef.current = data.lifetimeSeconds;
      const blob = await getKioskQrCodeApi(data.token);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setQrUrl(url);
      setProgress(100);

      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(refreshQr, data.lifetimeSeconds * 1000);
    } catch {
      toast.error('Could not start kiosk session. Retrying…');
      refreshTimerRef.current = setTimeout(refreshQr, 5000);
    }
  }, []);

  useEffect(() => {
    refreshQr();
    loadRecent();
    const poll = setInterval(loadRecent, 8000);
    return () => {
      clearTimeout(refreshTimerRef.current);
      clearInterval(tickTimerRef.current);
      clearInterval(poll);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [refreshQr, loadRecent]);

  useEffect(() => {
    clearInterval(tickTimerRef.current);
    const stepMs = 100;
    tickTimerRef.current = setInterval(() => {
      setProgress((p) => Math.max(0, p - (100 * stepMs) / (lifetimeRef.current * 1000)));
    }, stepMs);
    return () => clearInterval(tickTimerRef.current);
  }, [qrUrl]);

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-center px-6 py-10 relative">
      <button
        onClick={() => navigate('/attendance')}
        className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white border border-black/10 flex items-center justify-center press-feedback"
        title="Exit kiosk mode"
      >
        <X size={18} className="text-ink-secondary" />
      </button>

      <div className="flex items-center gap-3 mb-8">
        <CompanyLogo company={user?.company} size={48} />
        <div>
          <p className="text-[20px] font-semibold text-ink display-text">{user?.company?.name}</p>
          <p className="text-[13px] text-ink-tertiary">Attendance Check-in</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-card p-8 flex flex-col items-center w-full max-w-sm">
        <div className="flex items-center gap-2 text-ink-secondary text-[13px] font-medium mb-4">
          <Smartphone size={16} /> Scan with your phone camera
        </div>

        <div className="h-64 w-64 rounded-2xl overflow-hidden bg-surface-subtle flex items-center justify-center border border-black/[0.06]">
          {qrUrl ? (
            <img src={qrUrl} alt="Scan to check in" className="h-full w-full object-contain" />
          ) : (
            <div className="h-8 w-8 border-[3px] border-black/10 border-t-brand rounded-full animate-spin" />
          )}
        </div>

        <div className="w-full h-1.5 rounded-full bg-black/[0.06] mt-5 overflow-hidden">
          <div
            className="h-full bg-brand transition-[width] duration-100 linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[12px] text-ink-tertiary mt-3 text-center">
          No app needed — open your camera, point it at the code, then enter your phone number
          or member code on the page that opens.
        </p>
      </div>

      <div className="mt-8 w-full max-w-sm">
        <p className="text-[12px] font-medium text-ink-tertiary uppercase tracking-wide mb-2">
          Just checked in
        </p>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-[13px] text-ink-tertiary text-center py-4">No check-ins yet today.</p>
          ) : (
            recent.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between bg-white rounded-xl border border-black/[0.06] px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-green-600" />
                  <span className="text-[13px] font-medium text-ink">{a.member?.fullName}</span>
                </div>
                <span className="text-[12px] text-ink-tertiary">
                  {new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}