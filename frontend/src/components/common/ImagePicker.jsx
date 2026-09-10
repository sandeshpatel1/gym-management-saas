import { useRef, useState } from 'react';
import { Link2, Upload, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageCropModal from './ImageCropModal';

const MAX_FILE_MB = 8;

/**
 * Reusable image field: URL link OR upload-from-device with crop.
 * `value` is the current URL/data-URL, `onChange(nextValue)` receives the
 * new one — either the typed link or the cropped base64 result.
 */
export default function ImagePicker({
  label,
  value,
  onChange,
  shape = 'square', // 'square' | 'circle'
  size = 96,
  helperText,
}) {
  const [mode, setMode] = useState('link');
  const [pendingSrc, setPendingSrc] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef(null);

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Image is too large — keep it under ${MAX_FILE_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingSrc(reader.result);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropped = (dataUrl) => {
    onChange(dataUrl);
    setImgError(false);
    setCropOpen(false);
    setPendingSrc('');
  };

  return (
    <div>
      {label && (
        <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
          {label}
        </span>
      )}

      <div className="flex items-start gap-4">
        <div
          className="shrink-0 overflow-hidden bg-surface-subtle dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center"
          style={{ width: size, height: size, borderRadius: shape === 'circle' ? '9999px' : '16px' }}
        >
          {value && !imgError ? (
            <img
              src={value}
              alt="Preview"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff size={18} className="text-ink-tertiary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-0.5 mb-2">
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium press-feedback flex items-center gap-1.5 transition-colors ${
                mode === 'link' ? 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 shadow-sm' : 'text-ink-tertiary'
              }`}
            >
              <Link2 size={13} /> Link
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium press-feedback flex items-center gap-1.5 transition-colors ${
                mode === 'upload' ? 'bg-white dark:bg-zinc-800 text-ink dark:text-zinc-100 shadow-sm' : 'text-ink-tertiary'
              }`}
            >
              <Upload size={13} /> Upload
            </button>
          </div>

          {mode === 'link' ? (
            <input
              value={value?.startsWith('data:') ? '' : value || ''}
              onChange={(e) => {
                setImgError(false);
                onChange(e.target.value);
              }}
              placeholder="https://…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 text-[14px] outline-none focus:border-brand transition-colors"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-black/15 dark:border-white/15 rounded-xl py-3 text-[13px] text-ink-secondary dark:text-zinc-400 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] press-feedback"
              >
                <Upload size={15} /> Choose a photo to crop
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
            </>
          )}

          {helperText && <p className="text-[11.5px] text-ink-tertiary mt-1.5">{helperText}</p>}
        </div>
      </div>

      <ImageCropModal
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          setPendingSrc('');
        }}
        imageSrc={pendingSrc}
        shape={shape}
        onCropped={handleCropped}
      />
    </div>
  );
}