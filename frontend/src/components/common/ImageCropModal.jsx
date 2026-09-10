import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const VIEWPORT = 320;   // crop stage size, px
const OUTPUT = 512;     // exported image size, px

export default function ImageCropModal({ open, onClose, imageSrc, shape = 'square', onCropped }) {
  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, [open, imageSrc]);

  const baseScale = natural.w && natural.h ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) : 1;
  const scale = baseScale * zoom;
  const dw = natural.w * scale;
  const dh = natural.h * scale;

  const clamp = useCallback(
    (x, y, s = scale) => {
      const w = natural.w * s;
      const h = natural.h * s;
      const halfX = Math.max(0, (w - VIEWPORT) / 2);
      const halfY = Math.max(0, (h - VIEWPORT) / 2);
      return {
        x: Math.min(halfX, Math.max(-halfX, x)),
        y: Math.min(halfY, Math.max(-halfY, y)),
      };
    },
    [natural, scale]
  );

  const onImgLoad = (e) => {
    setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  // --- Drag: respond instantly, track 1:1 with the pointer ---
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e) => {
    e.preventDefault();
    const next = Math.min(3, Math.max(1, zoom - e.deltaY * 0.0015));
    setZoom(next);
    setPos((p) => clamp(p.x, p.y, baseScale * next));
  };

  const onZoomSlider = (e) => {
    const next = Number(e.target.value);
    setZoom(next);
    setPos((p) => clamp(p.x, p.y, baseScale * next));
  };

  const confirm = () => {
    const img = imgRef.current;
    if (!img || !natural.w) return;

    // Map the VIEWPORT crop window back into natural image pixel space.
    const cropXDisp = dw / 2 - VIEWPORT / 2 - pos.x;
    const cropYDisp = dh / 2 - VIEWPORT / 2 - pos.y;
    const cropXNat = cropXDisp / scale;
    const cropYNat = cropYDisp / scale;
    const cropSizeNat = VIEWPORT / scale;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropXNat, cropYNat, cropSizeNat, cropSizeNat, 0, 0, OUTPUT, OUTPUT);

    onCropped(canvas.toDataURL('image/jpeg', 0.88));
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust photo" width="max-w-md">
      <div className="flex flex-col items-center gap-4">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          className="relative overflow-hidden bg-black/5 dark:bg-white/5 cursor-grab active:cursor-grabbing touch-none select-none"
          style={{
            width: VIEWPORT,
            height: VIEWPORT,
            borderRadius: shape === 'circle' ? '9999px' : '20px',
          }}
        >
          {imageSrc && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImgLoad}
              draggable={false}
              className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
              style={{
                width: natural.w ? dw : 'auto',
                height: natural.h ? dh : 'auto',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
            />
          )}
          {/* subtle frame so the crop boundary reads clearly against any photo */}
          <div
            className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/70 dark:ring-white/40"
            style={{ borderRadius: shape === 'circle' ? '9999px' : '20px' }}
          />
        </div>

        <div className="w-full flex items-center gap-3 px-1">
          <ZoomIn size={15} className="text-ink-tertiary shrink-0" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={onZoomSlider}
            className="w-full accent-brand"
          />
        </div>

        <p className="text-[12px] text-ink-tertiary text-center">Drag to reposition, use the slider to zoom.</p>

        <Button type="button" className="w-full" onClick={confirm}>
          <Check size={15} /> Use This Photo
        </Button>
      </div>
    </Modal>
  );
}