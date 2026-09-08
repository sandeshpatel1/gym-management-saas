import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, CheckCircle2, XCircle, Dumbbell } from 'lucide-react';
import { verifyPhotoSessionApi, submitPhotoSessionApi } from '../../api/photoSessions';

const MAX_DIMENSION = 480;

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoCapture() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('checking');
  const [company, setCompany] = useState(null);
  const [preview, setPreview] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus('expired');
      return;
    }
    verifyPhotoSessionApi(token)
      .then(({ data }) => {
        setCompany(data.company);
        setStatus('valid');
      })
      .catch(() => setStatus('expired'));
  }, [token]);

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageFile(file);
      setDataUrl(resized);
      setPreview(resized);
    } catch {
      /* ignore bad file */
    }
  };

  const onSubmit = async () => {
    if (!dataUrl) return;
    setSubmitting(true);
    try {
      await submitPhotoSessionApi(token, dataUrl);
      setStatus('sent');
    } catch (err) {
      if (err.response?.status === 410) setStatus('expired');
    } finally {
      setSubmitting(false);
    }
  };

  const brandColor = company?.branding?.primaryColor || '#0A84FF';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: `linear-gradient(180deg, ${brandColor}14, #F5F5F7)` }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-card" style={{ background: brandColor }}>
            <Dumbbell className="text-white" size={26} />
          </div>
          <h1 className="text-[20px] font-semibold text-ink display-text text-center">{company?.name || 'Member Photo'}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-card p-6">
          {status === 'checking' && (
            <div className="py-10 flex justify-center">
              <div className="h-8 w-8 border-[3px] border-black/10 border-t-brand rounded-full animate-spin" />
            </div>
          )}

          {status === 'expired' && (
            <div className="flex flex-col items-center text-center py-6">
              <XCircle className="text-red-500 mb-3" size={36} />
              <p className="text-[15px] font-semibold text-ink mb-1">This link expired</p>
              <p className="text-[13px] text-ink-secondary">Ask staff to generate a new QR code from the member's edit page.</p>
            </div>
          )}

          {status === 'valid' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-[13px] text-ink-secondary text-center">
                Take or choose a selfie — it'll be sent straight to the member's profile.
              </p>
              <div className="h-48 w-48 rounded-2xl overflow-hidden bg-surface-subtle border border-black/[0.06] flex items-center justify-center">
                {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : <Camera size={32} className="text-ink-tertiary" />}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFileChosen} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-3 rounded-xl border border-black/10 font-medium text-[14px] press-feedback"
              >
                {preview ? 'Retake' : 'Open Camera'}
              </button>
              <button
                onClick={onSubmit}
                disabled={!dataUrl || submitting}
                className="w-full py-3 rounded-xl text-white font-medium text-[15px] press-feedback disabled:opacity-50"
                style={{ background: brandColor }}
              >
                {submitting ? 'Sending…' : 'Send Photo'}
              </button>
            </div>
          )}

          {status === 'sent' && (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="text-green-600 mb-3" size={40} />
              <p className="text-[17px] font-semibold text-ink mb-1">Photo sent!</p>
              <p className="text-[14px] text-ink-secondary">You can close this page now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}