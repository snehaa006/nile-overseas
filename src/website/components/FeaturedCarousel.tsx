import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { BlanketWithImages } from "@/shared/types/models";
import { formatCurrency, formatWeight } from "@/shared/utils/format";
import { Badge } from "@/shared/components/ui/badge";

type Item = { blanket: BlanketWithImages; brand: string };

/* ────────────────────────────────────────────────────────────
   3D cover-flow transform map — ported 1:1 from the KBI products
   carousel. rel = signed distance from the centred card.
   ──────────────────────────────────────────────────────────── */
type Slot = { tx: number; sc: number; ry: number; op: number; z: number };

function getTransform(rel: number, unit: number): Slot {
  const far = unit * 2.9;
  switch (rel) {
    case 0:
      return { tx: 0, sc: 1.0, ry: 0, op: 1.0, z: 10 };
    case 1:
      return { tx: unit * 1.1, sc: 0.82, ry: -10, op: 0.72, z: 7 };
    case -1:
      return { tx: -unit * 1.1, sc: 0.82, ry: 10, op: 0.72, z: 7 };
    case 2:
      return { tx: unit * 2.03, sc: 0.66, ry: -18, op: 0.42, z: 4 };
    case -2:
      return { tx: -unit * 2.03, sc: 0.66, ry: 18, op: 0.42, z: 4 };
    default:
      return {
        tx: rel > 0 ? far : -far,
        sc: 0.52,
        ry: rel > 0 ? -24 : 24,
        op: 0,
        z: 1,
      };
  }
}

function primaryImage(b: BlanketWithImages): string | null {
  const primary = b.images?.find((i) => i.is_primary) ?? b.images?.[0];
  return primary?.image_url ?? null;
}

export function FeaturedCarousel({ items }: { items: Item[] }) {
  const navigate = useNavigate();

  // A comfortable loop needs enough cards that the wrap-around happens
  // off-stage (invisible). With only a handful of featured blankets we
  // repeat the set until there are at least 7 slides.
  const slides = useMemo(() => {
    if (items.length === 0) return [];
    if (items.length >= 7) return items;
    const out: Item[] = [];
    while (out.length < 7) out.push(...items);
    return out;
  }, [items]);

  const n = slides.length;
  const [active, setActive] = useState(0);
  const [compact, setCompact] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  const unit = compact ? 210 : 285; // horizontal spacing between neighbours
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draggingRef = useRef(false);
  const dragStartX = useRef<number | null>(null);

  /* ── responsive ── */
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── navigation ── */
  const goTo = useCallback(
    (idx: number) => {
      if (!n) return;
      setActive(((idx % n) + n) % n);
    },
    [n],
  );
  const step = useCallback((dir: number) => setActive((a) => a + dir), []);

  /* ── autoplay ── */
  const stopAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = null;
  }, []);
  const startAuto = useCallback(() => {
    stopAuto();
    if (n > 1) autoRef.current = setInterval(() => step(1), 2200);
  }, [n, step, stopAuto]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  /* ── keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  /* ── pointer / touch drag ── */
  const onPointerDown = (clientX: number) => {
    dragStartX.current = clientX;
    draggingRef.current = false;
    stopAuto();
  };
  const onPointerMove = (clientX: number) => {
    if (dragStartX.current === null) return;
    if (Math.abs(clientX - dragStartX.current) > 8) draggingRef.current = true;
  };
  const onPointerUp = (clientX: number) => {
    if (dragStartX.current !== null) {
      const dx = dragStartX.current - clientX;
      if (draggingRef.current && Math.abs(dx) > 40) step(dx > 0 ? 1 : -1);
      dragStartX.current = null;
    }
    startAuto();
  };

  const handleCardClick = (rel: number, blanket: BlanketWithImages) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      return;
    }
    if (rel !== 0) {
      // focus this card the short way, then let the user click again to open it
      setActive((a) => a + rel);
      return;
    }
    navigate(`/products/${blanket.sku ?? blanket.id}`);
  };

  if (n === 0) return null;

  const cardW = compact ? 220 : 280;
  const cardH = compact ? 350 : 420;
  const stageH = compact ? 430 : 540;

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative w-full cursor-grab overflow-hidden select-none active:cursor-grabbing"
        style={{ height: stageH, perspective: 1400 }}
        onMouseEnter={stopAuto}
        onMouseLeave={() => {
          dragStartX.current = null;
          startAuto();
        }}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseUp={(e) => onPointerUp(e.clientX)}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
        onTouchEnd={(e) => onPointerUp(e.changedTouches[0].clientX)}
      >
        {/* Track — absolute centre anchor */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {slides.map((item, i) => {
            let rel = i - active;
            if (rel > n / 2) rel -= n;
            else if (rel < -n / 2) rel += n;

            const { tx, sc, ry, op, z } = getTransform(rel, unit);
            const isActive = rel === 0;

            return (
              <div
                key={i}
                onClick={() => handleCardClick(rel, item.blanket)}
                className="absolute overflow-hidden rounded-lg bg-card"
                style={{
                  width: cardW,
                  height: cardH,
                  top: -cardH / 2,
                  left: -cardW / 2,
                  transformStyle: "preserve-3d",
                  transform: `translateX(${tx}px) scale(${sc}) rotateY(${ry}deg)`,
                  opacity: op,
                  zIndex: z,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 32px 72px rgba(13,26,58,.45), 0 8px 24px rgba(13,26,58,.25), 0 0 0 1px rgba(13,26,58,.06)"
                    : "0 4px 18px rgba(13,26,58,.1)",
                  transition:
                    Math.abs(rel) > 3
                      ? "none"
                      : "transform .38s cubic-bezier(.25,.46,.45,.94), opacity .38s ease, box-shadow .38s ease",
                  willChange: "transform, opacity",
                }}
              >
                <CarouselCard item={item} active={isActive} />
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => step(-1)}
          className="absolute left-6 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => step(1)}
          className="absolute right-6 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-accent"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots — one per unique blanket */}
      <div className="mt-6 flex justify-center gap-2">
        {items.map((_, i) => {
          const activeUnique = ((active % items.length) + items.length) % items.length;
          return (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === activeUnique ? 22 : 8,
                background:
                  i === activeUnique
                    ? "hsl(var(--primary))"
                    : "hsl(var(--primary) / 0.25)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function CarouselCard({ item, active }: { item: Item; active: boolean }) {
  const { blanket, brand } = item;
  const img = primaryImage(blanket);
  return (
    <>
      <div className="relative h-1/2 overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={blanket.name}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover transition-transform duration-500"
            style={{ transform: active ? "scale(1.04)" : "scale(1)" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        {brand && (
          <Badge className="absolute left-3 top-3" variant="secondary">
            {brand}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-accent">
          {brand}
        </p>
        <h3 className="font-serif text-lg font-semibold leading-snug text-primary">
          {blanket.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {formatWeight(blanket.weight_kg)}
        </p>
        <p className="mt-1 text-lg font-semibold text-primary">
          {formatCurrency(blanket.rate)}
        </p>
        <div
          className="overflow-hidden transition-all duration-500"
          style={{
            maxHeight: active ? 40 : 0,
            opacity: active ? 1 : 0,
          }}
        >
          <span className="text-xs font-medium text-accent">
            View details →
          </span>
        </div>
      </div>
    </>
  );
}
