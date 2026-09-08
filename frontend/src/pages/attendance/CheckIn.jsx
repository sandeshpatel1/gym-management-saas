import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Dumbbell } from 'lucide-react';
import { verifyKioskSessionApi, kioskCheckInApi } from '../../api/kiosk';

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('checking'); // checking | valid | expired
  const [company, setCompany] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message, name? }

  useEffect(() => {
    if (!token) {
      setStatus('expired');
      return;
    }
    verifyKioskSessionApi(token)
      .then(({ data }) => {
        setCompany(data.company);
        setStatus('valid');
      })
      .catch(() => setStatus('expired'));
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setSubmitting(true);
    try {
      const { member } = await kioskCheckInApi(token, identifier.trim());
      setResult({ ok: true, name: member.fullName });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not mark attendance';
      if (err.response?.status === 410) {
        setStatus('expired');
      } else {
        setResult({ ok: false, message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const brandColor = company?.branding?.primaryColor || '#0A84FF';

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `linear-gradient(180deg, ${brandColor}14, #F5F5F7)` }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-card"
            style={{ background: brandColor }}
          >
            <Dumbbell className="text-white" size={26} />
          </div>
          <h1 className="text-[20px] font-semibold text-ink display-text text-center">
            {company?.name || 'Gym Check-in'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-6">
          <AnimatePresence mode="wait">
            {status === 'checking' && (
              <motion.div key="checking" className="py-10 flex justify-center">
                <div className="h-8 w-8 border-[3px] border-black/10 border-t-brand rounded-full animate-spin" />
              </motion.div>
            )}

            {status === 'expired' && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <XCircle className="text-red-500 mb-3" size={36} />
                <p className="text-[15px] font-semibold text-ink mb-1">This QR code expired</p>
                <p className="text-[13px] text-ink-secondary">
                  QR codes refresh every few seconds for security. Please look at the front-desk
                  screen and scan the current code.
                </p>
              </motion.div>
            )}

            {status === 'valid' && !result && (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={onSubmit}
                className="space-y-4"
              >
                <p className="text-[13px] text-ink-secondary text-center mb-1">
                  Enter your phone number or member code to mark yourself present.
                </p>
                <input
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Phone number or member code"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-[15px] text-center outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={submitting || !identifier.trim()}
                  className="w-full py-3 rounded-xl text-white font-medium text-[15px] press-feedback disabled:opacity-50"
                  style={{ background: brandColor }}
                >
                  {submitting ? 'Marking…' : "I'm here — Check Me In"}
                </button>
              </motion.form>
            )}

            {result?.ok && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <CheckCircle2 className="text-green-600 mb-3" size={40} />
                <p className="text-[17px] font-semibold text-ink mb-1">You're checked in!</p>
                <p className="text-[14px] text-ink-secondary">Welcome, {result.name}. Have a great workout 💪</p>
              </motion.div>
            )}

            {result && !result.ok && (
              <motion.div
                key="fail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center py-6"
              >
                <XCircle className="text-amber-500 mb-3" size={36} />
                <p className="text-[15px] font-semibold text-ink mb-1">{result.message}</p>
                <button
                  onClick={() => setResult(null)}
                  className="text-[13px] font-medium mt-3"
                  style={{ color: brandColor }}
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}