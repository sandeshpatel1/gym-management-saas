import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { getMemberQrCodeApi } from '../../api/members';

export default function MemberQrModal({ member, open, onClose }) {
  const [imgUrl, setImgUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !member?._id) return;
    let objectUrl;
    setLoading(true);
    getMemberQrCodeApi(member._id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      })
      .catch(() => toast.error('Could not generate QR code'))
      .finally(() => setLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, member?._id]);

  return (
    <Modal open={open} onClose={onClose} title={`${member?.fullName || 'Member'} — Check-in QR`} width="max-w-sm">
      <div className="flex flex-col items-center gap-4">
        {loading ? (
          <div className="h-64 w-64 flex items-center justify-center text-ink-tertiary text-[13px]">
            Generating…
          </div>
        ) : imgUrl ? (
          <img src={imgUrl} alt="Member check-in QR code" className="h-64 w-64 rounded-xl border border-black/10" />
        ) : null}
        <p className="text-[12px] text-ink-tertiary text-center">
          Print this or show it on your phone. Front desk scans it under{' '}
          <span className="font-medium">Attendance → Scan QR</span> to check in.
        </p>
      </div>
    </Modal>
  );
}