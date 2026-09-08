import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera, Upload, QrCode, Save, PlusCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  getMemberByIdApi,
  updateMemberApi,
  extendMembershipApi,
  getMemberExtensionsApi,
  createPhotoSessionApi,
  getPhotoSessionResultApi,
  getPhotoSessionQrApi,
} from '../../api/members';

const MAX_PHOTO_DIMENSION = 480;

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
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

export default function MemberEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'owner' || user?.role === 'manager';

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoMode, setPhotoMode] = useState('url');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [qrWaiting, setQrWaiting] = useState(false);
  const pollRef = useRef(null);
  const qrObjectUrlRef = useRef(null);

  const [extending, setExtending] = useState(false);
  const [extendDays, setExtendDays] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [extensions, setExtensions] = useState([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const photoUrlValue = watch('photoUrl');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMemberByIdApi(id);
      setMember(data.member);
      reset({
        fullName: data.member.fullName,
        phone: data.member.phone,
        email: data.member.email || '',
        gender: data.member.gender,
        dob: data.member.dob ? data.member.dob.slice(0, 10) : '',
        address: data.member.address || '',
        emergencyName: data.member.emergencyContact?.name || '',
        emergencyPhone: data.member.emergencyContact?.phone || '',
        emergencyRelation: data.member.emergencyContact?.relation || '',
        healthNotes: data.member.healthNotes || '',
        goals: (data.member.goals || []).join(', '),
        status: data.member.status,
        photoUrl: data.member.photoUrl || '',
      });
      setPhotoPreview(data.member.photoUrl || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load member');
    } finally {
      setLoading(false);
    }
  };

  const loadExtensions = async () => {
    try {
      const { data } = await getMemberExtensionsApi(id);
      setExtensions(data);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    load();
    loadExtensions();
    return () => {
      clearInterval(pollRef.current);
      if (qrObjectUrlRef.current) URL.revokeObjectURL(qrObjectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setPhotoPreview(photoUrlValue);
  }, [photoUrlValue]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email || undefined,
        gender: values.gender,
        dob: values.dob,
        address: values.address,
        emergencyContact: {
          name: values.emergencyName,
          phone: values.emergencyPhone,
          relation: values.emergencyRelation,
        },
        healthNotes: values.healthNotes,
        goals: values.goals ? values.goals.split(',').map((g) => g.trim()).filter(Boolean) : [],
        status: values.status,
        photoUrl: values.photoUrl || '',
      };
      const { data } = await updateMemberApi(id, payload);
      toast.success(`${data.fullName} updated`);
      navigate(`/members/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update member');
    } finally {
      setSaving(false);
    }
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file);
      setValue('photoUrl', dataUrl, { shouldDirty: true });
    } catch {
      toast.error('Could not read that image');
    }
  };

  const startQrSession = async () => {
    setQrWaiting(true);
    try {
      const { data } = await createPhotoSessionApi(id);
      const blob = await getPhotoSessionQrApi(data.token);
      if (qrObjectUrlRef.current) URL.revokeObjectURL(qrObjectUrlRef.current);
      const url = URL.createObjectURL(blob);
      qrObjectUrlRef.current = url;
      setQrImageUrl(url);

      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const res = await getPhotoSessionResultApi(data.token);
          if (res.data.status === 'done' && res.data.photoData) {
            clearInterval(pollRef.current);
            setValue('photoUrl', res.data.photoData, { shouldDirty: true });
            setQrWaiting(false);
            toast.success('Selfie received from phone');
          }
        } catch {
          /* keep polling until it expires */
        }
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start photo session');
      setQrWaiting(false);
    }
  };

  const onExtend = async () => {
    const days = Number(extendDays);
    if (!days || days <= 0) {
      toast.error('Enter a valid number of days');
      return;
    }
    setExtending(true);
    try {
      const { data } = await extendMembershipApi(id, { days, reason: extendReason });
      setMember(data);
      setExtendDays('');
      setExtendReason('');
      toast.success(`Extended by ${days} day${days === 1 ? '' : 's'}`);
      loadExtensions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not extend membership');
    } finally {
      setExtending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Member">
        <div className="text-center text-ink-tertiary text-[13px] py-10">Loading…</div>
      </DashboardLayout>
    );
  }
  if (!member) return null;

  return (
    <DashboardLayout title={`Edit · ${member.fullName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Personal Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
              />
              <Input
                label="Phone Number *"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^[+]?[0-9]{10,15}$/, message: 'Enter a valid phone number' },
                })}
              />
              <Input
                label="Email (optional)"
                type="email"
                error={errors.email?.message}
                {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
              />
              <Select label="Gender *" error={errors.gender?.message} {...register('gender', { required: true })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <Input
                label="Date of Birth *"
                type="date"
                error={errors.dob?.message}
                {...register('dob', { required: 'Date of birth is required' })}
              />
              <Select label="Status *" {...register('status', { required: true })}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="frozen">Frozen</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Input label="Address" className="sm:col-span-2" {...register('address')} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Name" {...register('emergencyName')} />
              <Input label="Phone" {...register('emergencyPhone')} />
              <Input label="Relation" {...register('emergencyRelation')} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Fitness Notes</p>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Health Notes" {...register('healthNotes')} />
              <Input label="Goals (comma separated)" {...register('goals')} />
            </div>
          </Card>

          {canManage && (
            <Card className="p-6">
              <p className="text-[14px] font-semibold text-ink mb-1">Extend Membership</p>
              <p className="text-[12px] text-ink-tertiary mb-4">
                Adds days on top of the current expiry. Owner/manager only — trainers can't do this.
              </p>
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="w-32">
                  <Input label="Days to add" type="number" min="1" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Input
                    label="Reason (optional)"
                    placeholder="Gym closed for maintenance, goodwill gesture, etc."
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={onExtend} loading={extending}>
                  <PlusCircle size={15} /> Extend
                </Button>
              </div>
              {extensions.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-black/[0.06]">
                  {extensions.map((ext) => (
                    <div key={ext._id} className="text-[12px] text-ink-secondary flex justify-between">
                      <span>
                        +{ext.daysAdded} days by {ext.extendedBy?.name || 'staff'}
                        {ext.reason ? ` — ${ext.reason}` : ''}
                      </span>
                      <span className="text-ink-tertiary">{new Date(ext.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-[14px] font-semibold text-ink mb-4">Photo</p>
            <div className="flex justify-center mb-4">
              <div className="h-32 w-32 rounded-2xl overflow-hidden bg-surface-subtle border border-black/[0.06] flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Member" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[12px] text-ink-tertiary">No photo</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {['url', 'upload', 'qr'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPhotoMode(m)}
                  className={`flex-1 text-[12px] py-2 rounded-lg press-feedback ${photoMode === m ? 'bg-brand text-white' : 'bg-surface-subtle text-ink-secondary'}`}
                >
                  {m === 'url' ? 'Link' : m === 'upload' ? 'Upload' : 'Phone Selfie'}
                </button>
              ))}
            </div>

            {photoMode === 'url' && <Input label="Photo URL" placeholder="https://…" {...register('photoUrl')} />}

            {photoMode === 'upload' && (
              <label className="flex items-center justify-center gap-2 border border-dashed border-black/15 rounded-xl py-4 cursor-pointer text-[13px] text-ink-secondary hover:bg-black/[0.02] press-feedback">
                <Upload size={15} /> Choose a photo
                <input type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
              </label>
            )}

            {photoMode === 'qr' && (
              <div className="flex flex-col items-center">
                {!qrImageUrl ? (
                  <Button type="button" variant="secondary" className="w-full" onClick={startQrSession} loading={qrWaiting}>
                    <QrCode size={15} /> Generate QR
                  </Button>
                ) : (
                  <>
                    <img src={qrImageUrl} alt="Scan to take selfie" className="h-40 w-40 rounded-xl border border-black/10" />
                    <p className="text-[11px] text-ink-tertiary text-center mt-3 flex items-center gap-1.5">
                      <Camera size={13} />
                      {qrWaiting ? 'Waiting for the phone to send a selfie… (expires in 5 min)' : 'Photo received.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          <Button type="submit" className="w-full" size="lg" loading={saving}>
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}