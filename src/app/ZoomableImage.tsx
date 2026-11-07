import { useRef, useState } from "react";

const DOUBLE_TAP_ZOOM = 2.5;
const MAX_SCALE = 6;
const DOUBLE_TAP_MS = 300;

interface Transform {
  scale: number;
  x: number;
  y: number;
}

export function ZoomableImage({ src, alt, testId }: { src: string; alt: string; testId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const moved = useRef(false);
  const lastTap = useRef(-Infinity);
  const [t, setT] = useState<Transform>({ scale: 1, x: 0, y: 0 });

  const clamp = (next: Transform): Transform => {
    const rect = box.current!.getBoundingClientRect();
    const maxX = (rect.width * (next.scale - 1)) / 2;
    const maxY = (rect.height * (next.scale - 1)) / 2;
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  };

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) moved.current = false;
    if (pointers.current.size === 2) {
      pinchStart.current = { distance: distance(), scale: t.scale };
      moved.current = true;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const scale = Math.max(1, Math.min(MAX_SCALE, (pinchStart.current.scale * distance()) / pinchStart.current.distance));
      setT((cur) => clamp({ ...cur, scale }));
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - previous.x;
      const dy = e.clientY - previous.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      if (t.scale > 1) setT((cur) => clamp({ ...cur, x: cur.x + dx, y: cur.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (!wasSingle || moved.current) return;
    const now = e.timeStamp;
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = -Infinity;
      toggleZoom(e);
    } else {
      lastTap.current = now;
    }
  };

  const toggleZoom = (e: React.PointerEvent) => {
    if (t.scale > 1) return setT({ scale: 1, x: 0, y: 0 });
    const rect = box.current!.getBoundingClientRect();
    const px = e.clientX - (rect.left + rect.width / 2);
    const py = e.clientY - (rect.top + rect.height / 2);
    setT(clamp({ scale: DOUBLE_TAP_ZOOM, x: px * (1 - DOUBLE_TAP_ZOOM), y: py * (1 - DOUBLE_TAP_ZOOM) }));
  };

  return (
    <div
      ref={box}
      className="zoom"
      data-testid={testId}
      data-scale={t.scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={src} alt={alt} draggable={false} style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})` }} />
    </div>
  );
}
