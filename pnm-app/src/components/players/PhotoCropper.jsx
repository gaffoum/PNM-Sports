import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

async function getCroppedBlob(imageSrc, pixelCrop, size = 200) {
  const image = await new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.85));
}

export default function PhotoCropper({ src, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_, p) => { setPixelCrop(p); }, []);

  async function handleConfirm() {
    if (!pixelCrop) return;
    setWorking(true);
    const blob = await getCroppedBlob(src, pixelCrop, 200);
    setWorking(false);
    onConfirm(blob);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur grid place-items-center p-4">
      <div className="panel w-full max-w-lg p-5 space-y-4">
        <header><h3 className="text-lg">Recadrer la photo</h3><p className="text-xs text-ink-dim">Le rendu sera 200×200 JPEG.</p></header>
        <div className="relative w-full h-72 bg-bg-1 rounded overflow-hidden">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>
        <div>
          <label className="label">Zoom</label>
          <input type="range" min={1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-ghost">Annuler</button>
          <button onClick={handleConfirm} className="btn btn-primary" disabled={working}>{working ? "…" : "Valider"}</button>
        </div>
      </div>
    </div>
  );
}
