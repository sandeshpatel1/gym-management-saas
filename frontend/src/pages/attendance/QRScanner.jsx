import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import { qrCheckInApi } from '../../api/attendance';

export default function QRScanner() {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted || !containerRef.current) return;
      const html5Qr = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = html5Qr;
      html5Qr
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 260 },
          (decodedText) => handleScan(decodedText),
          () => {} // ignore per-frame "no QR found" noise
        )
        .then(() => setScanning(true))
        .catch(() => toast.error('Could not access the camera. Check browser permissions.'));
    });

    return () => {
      mounted = false;
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (token) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.pause(true);
      } catch {
        /* already paused/stopped */
      }
    }
    try {
      const { data, member } = await qrCheckInApi(token);
      setLastResult({ ok: true, member, time: data.checkInTime });
      toast.success(`${member.fullName} checked in`);
    } catch (err) {
      setLastResult({ ok: false, message: err.response?.data?.message || 'Invalid QR code' });
      toast.error(err.response?.data?.message || 'Could not check in');
    } finally {
      setTimeout(() => {
        if (scannerRef.current) scannerRef.current.resume();
      }, 1500);
    }
  };

  return (
    <DashboardLayout title="Scan QR Check-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <p className="text-[14px] font-semibold text-ink mb-4 flex items-center gap-2">
            <QrCode size={16} /> Point the camera at a member's QR code
          </p>
          <div id="qr-reader" ref={containerRef} className="rounded-xl overflow-hidden bg-black/5" style={{ minHeight: 320 }} />
          {!scanning && (
            <p className="text-[12px] text-ink-tertiary mt-3">
              Starting camera… if nothing appears, allow camera access for this site.
            </p>
          )}
        </Card>

        <Card className="p-6 h-fit">
          <p className="text-[14px] font-semibold text-ink mb-4">Last Scan</p>
          {!lastResult ? (
            <p className="text-[13px] text-ink-tertiary">No scans yet.</p>
          ) : lastResult.ok ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-[14px] font-medium text-ink">{lastResult.member.fullName}</p>
                <p className="text-[12px] text-ink-tertiary">{lastResult.member.memberCode}</p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-red-500">{lastResult.message}</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}