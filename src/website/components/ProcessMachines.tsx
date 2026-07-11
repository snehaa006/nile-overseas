import type { ComponentType } from "react";
import type { ProcessPhotoStep } from "@/shared/api/processPhotos";

/* Stylised isometric machine illustrations for the Processes page — one per
   manufacturing stage, drawn from the same palette so they read as one set.
   Golden dashed strokes tagged `thread-flow` animate (see index.css), showing
   the yarn travelling through each machine until it ends as a blanket.

   Gradient/filter ids are prefixed per machine because all five SVGs render
   on the same page and SVG ids are document-global. */

const NAVY_DEEP = "#0C1830";
const STEEL = "#24406E";
const OCEAN = "#7091B5";
const OCEAN_LIGHT = "#A9C0D8";
const PEARL = "#F4EFDC";
const THREAD = "#EFCF7B";
const THREAD_DARK = "#C9A94F";

/** The three visible faces of an isometric box: front, top, right side. */
function Box3D({
  x,
  y,
  w,
  h,
  front,
  top,
  side,
  dx = 13,
  dy = 8,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  front: string;
  top: string;
  side: string;
  dx?: number;
  dy?: number;
}) {
  return (
    <g>
      <polygon points={`${x},${y} ${x + dx},${y - dy} ${x + w + dx},${y - dy} ${x + w},${y}`} fill={top} />
      <polygon
        points={`${x + w},${y} ${x + w + dx},${y - dy} ${x + w + dx},${y + h - dy} ${x + w},${y + h}`}
        fill={side}
      />
      <rect x={x} y={y} width={w} height={h} rx={2} fill={front} />
    </g>
  );
}

/** A yarn cone: wound golden ball on a tapering bobbin. */
function YarnCone({ cx, baseY }: { cx: number; baseY: number }) {
  return (
    <g>
      <polygon
        points={`${cx - 6},${baseY} ${cx + 6},${baseY} ${cx + 3},${baseY - 24} ${cx - 3},${baseY - 24}`}
        fill={OCEAN_LIGHT}
      />
      <circle cx={cx} cy={baseY - 30} r={7} fill={THREAD} />
      <path
        d={`M${cx - 6} ${baseY - 32} a7 7 0 0 1 12 3 M${cx - 5} ${baseY - 26} a7 7 0 0 0 10 -5`}
        stroke={THREAD_DARK}
        strokeWidth={1.2}
        fill="none"
      />
    </g>
  );
}

/** 1. Raschel — yarn cones feed a knitting bed; fabric rolls out the front. */
export function RaschelMachine() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      {/* machine body */}
      <Box3D x={14} y={54} w={76} h={40} front={STEEL} top={OCEAN} side={NAVY_DEEP} />
      {/* yarn cones standing on the top face */}
      <YarnCone cx={34} baseY={50} />
      <YarnCone cx={64} baseY={50} />
      {/* threads flowing from the cones into the needle bed */}
      <path
        d="M34 26 C34 38 42 44 46 54"
        stroke={THREAD}
        strokeWidth={1.6}
        fill="none"
        strokeDasharray="5 4"
        className="thread-flow"
      />
      <path
        d="M64 26 C64 38 58 44 56 54"
        stroke={THREAD}
        strokeWidth={1.6}
        fill="none"
        strokeDasharray="5 4"
        className="thread-flow"
      />
      {/* needle bed rail + needles */}
      <rect x={18} y={58} width={68} height={3} rx={1.5} fill={NAVY_DEEP} />
      {[24, 32, 40, 48, 56, 64, 72, 80].map((nx) => (
        <line key={nx} x1={nx} y1={61} x2={nx} y2={68} stroke={OCEAN_LIGHT} strokeWidth={1.4} opacity={0.6} />
      ))}
      {/* control panel */}
      <rect x={70} y={74} width={14} height={11} rx={2} fill={NAVY_DEEP} />
      <circle cx={74.5} cy={78} r={1.5} fill={THREAD} />
      <circle cx={79.5} cy={78} r={1.5} fill={OCEAN_LIGHT} />
      {/* knitted fabric sliding out of the machine */}
      <polygon points="30,94 74,94 82,110 38,110" fill={PEARL} />
      <path d="M33 99 h44 M36 104 h44" stroke={OCEAN} strokeWidth={1} opacity={0.45} fill="none" />
      <path
        d="M34 96.5 h42"
        stroke={THREAD}
        strokeWidth={1.4}
        strokeDasharray="4 5"
        className="thread-flow"
        fill="none"
      />
    </svg>
  );
}

/** 2. Polish — the fabric runs between two polishing rollers; shine comes off. */
export function PolishMachine() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      <defs>
        <linearGradient id="pol-roller" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OCEAN_LIGHT} />
          <stop offset="0.5" stopColor={OCEAN} />
          <stop offset="1" stopColor={STEEL} />
        </linearGradient>
      </defs>
      {/* base */}
      <Box3D x={14} y={74} w={76} h={22} front={STEEL} top={OCEAN} side={NAVY_DEEP} />
      {/* frame posts */}
      <rect x={20} y={34} width={6} height={40} rx={2} fill={NAVY_DEEP} />
      <rect x={80} y={34} width={6} height={40} rx={2} fill={NAVY_DEEP} />
      <rect x={18} y={30} width={70} height={6} rx={3} fill={STEEL} />
      {/* fabric band passing between the rollers */}
      <rect x={4} y={50} width={104} height={7} fill={PEARL} />
      <path
        d="M6 53.5 H26 M80 53.5 H106"
        stroke={THREAD}
        strokeWidth={1.4}
        strokeDasharray="5 4"
        className="thread-flow"
        fill="none"
      />
      {/* rollers (top presses down on the band, bottom supports it) */}
      <rect x={26} y={38} width={54} height={12} rx={6} fill="url(#pol-roller)" />
      <ellipse cx={80} cy={44} rx={3.5} ry={6} fill={OCEAN_LIGHT} />
      <line x1={30} y1={41} x2={76} y2={41} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.4} />
      <rect x={26} y={57} width={54} height={12} rx={6} fill="url(#pol-roller)" />
      <ellipse cx={80} cy={63} rx={3.5} ry={6} fill={OCEAN_LIGHT} />
      <line x1={30} y1={60} x2={76} y2={60} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.4} />
      {/* polish shine */}
      <path d="M96 26 l1.8 4.6 4.6 1.8 -4.6 1.8 -1.8 4.6 -1.8 -4.6 -4.6 -1.8 4.6 -1.8 z" fill="#FFFFFF" opacity={0.9} />
      <path d="M104 40 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#FFFFFF" opacity={0.7} />
    </svg>
  );
}

/** 3. Printing — a rotary drum stamps colour onto the fabric as it passes. */
export function PrintingMachine() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      <defs>
        <radialGradient id="pri-drum" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={OCEAN_LIGHT} />
          <stop offset="0.6" stopColor={OCEAN} />
          <stop offset="1" stopColor={STEEL} />
        </radialGradient>
      </defs>
      {/* base */}
      <Box3D x={14} y={72} w={76} h={24} front={STEEL} top={OCEAN} side={NAVY_DEEP} />
      {/* fabric band: plain on the left, printed after the drum */}
      <rect x={4} y={62} width={108} height={9} fill={PEARL} />
      <path
        d="M6 66.5 H30"
        stroke={THREAD}
        strokeWidth={1.4}
        strokeDasharray="5 4"
        className="thread-flow"
        fill="none"
      />
      <circle cx={82} cy={66.5} r={2} fill={OCEAN} />
      <circle cx={91} cy={66.5} r={2} fill={NAVY_DEEP} />
      <circle cx={100} cy={66.5} r={2} fill={THREAD_DARK} />
      {/* print drum resting on the band */}
      <circle cx={52} cy={44} r={19} fill="url(#pri-drum)" stroke={NAVY_DEEP} strokeWidth={2.5} />
      <circle cx={52} cy={44} r={6} fill={PEARL} stroke={NAVY_DEEP} strokeWidth={1.5} />
      {/* pattern plates around the drum */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x={49.5}
          y={29}
          width={5}
          height={5}
          rx={1}
          fill={NAVY_DEEP}
          opacity={0.75}
          transform={`rotate(${deg} 52 44)`}
        />
      ))}
      {/* ink drops falling toward the freshly printed side */}
      <path d="M84 40 q2.5 4 0 6 q-2.5 -2 0 -6" fill={OCEAN} />
      <path d="M93 32 q2.5 4 0 6 q-2.5 -2 0 -6" fill={THREAD} />
      <path d="M100 46 q2.5 4 0 6 q-2.5 -2 0 -6" fill={OCEAN_LIGHT} />
    </svg>
  );
}

/** 4. Brushing — a bristled drum raises the pile; the fabric leaves fluffy. */
export function BrushingMachine() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      <defs>
        <radialGradient id="bru-drum" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={OCEAN} />
          <stop offset="1" stopColor={NAVY_DEEP} />
        </radialGradient>
      </defs>
      {/* base */}
      <Box3D x={14} y={74} w={76} h={22} front={STEEL} top={OCEAN} side={NAVY_DEEP} />
      {/* frame posts */}
      <rect x={20} y={42} width={5} height={32} rx={2} fill={NAVY_DEEP} />
      <rect x={81} y={42} width={5} height={32} rx={2} fill={NAVY_DEEP} />
      {/* fabric band: flat going in, fluffy pile coming out */}
      <rect x={4} y={64} width={108} height={8} fill={PEARL} />
      <path
        d="M58 64 q3 -4.5 6 0 q3 -4.5 6 0 q3 -4.5 6 0 q3 -4.5 6 0 q3 -4.5 6 0 q3 -4.5 6 0 q3 -4.5 6 0 v0 h-42 z"
        fill={PEARL}
      />
      <path
        d="M6 68 H28"
        stroke={THREAD}
        strokeWidth={1.4}
        strokeDasharray="5 4"
        className="thread-flow"
        fill="none"
      />
      {/* brush drum with bristles */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x1 = 52 + Math.cos(a) * 14;
        const y1 = 47 + Math.sin(a) * 14;
        const x2 = 52 + Math.cos(a) * 19;
        const y2 = 47 + Math.sin(a) * 19;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OCEAN_LIGHT} strokeWidth={1.5} />;
      })}
      <circle cx={52} cy={47} r={14} fill="url(#bru-drum)" />
      <circle cx={52} cy={47} r={4} fill={PEARL} />
      {/* spin hint */}
      <path d="M74 32 a24 24 0 0 1 6 10" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.5} fill="none" />
      {/* loose fluff */}
      <circle cx={88} cy={52} r={1.6} fill="#FFFFFF" opacity={0.8} />
      <circle cx={95} cy={58} r={1.2} fill="#FFFFFF" opacity={0.6} />
    </svg>
  );
}

/** 5. Products — the thread's journey ends: folded blankets, stitched & tagged. */
export function BlanketStack() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className="h-full w-full">
      {/* the incoming thread ties off into the stack */}
      <path
        d="M10 10 C34 12 44 26 51 46"
        stroke={THREAD}
        strokeWidth={2}
        fill="none"
        strokeDasharray="5 4"
        className="thread-flow"
      />
      <circle cx={52} cy={49} r={2.5} fill={THREAD} />
      {/* folded blankets, bottom to top */}
      <Box3D x={20} y={86} w={72} h={16} front={STEEL} top={OCEAN} side={NAVY_DEEP} dx={12} dy={7} />
      <Box3D x={17} y={70} w={72} h={16} front={PEARL} top="#FBF8EC" side="#D8D2B8" dx={12} dy={7} />
      <Box3D x={20} y={54} w={72} h={16} front={OCEAN} top={OCEAN_LIGHT} side={STEEL} dx={12} dy={7} />
      {/* fold rolls on the right end of each layer */}
      <path d="M92 62 a8 8 0 0 1 0 0.5 M92 57 q6 4.5 0 9" stroke={STEEL} strokeWidth={1.4} fill="none" />
      <path d="M89 73 q6 4.5 0 9" stroke="#D8D2B8" strokeWidth={1.4} fill="none" />
      <path d="M92 89 q6 4.5 0 9" stroke={NAVY_DEEP} strokeWidth={1.4} fill="none" />
      {/* stitched hem along the top blanket */}
      <line x1={26} y1={50} x2={94} y2={50} stroke="#FFFFFF" strokeWidth={1.3} strokeDasharray="3 3" opacity={0.85} />
      {/* swing tag */}
      <line x1={96} y1={60} x2={102} y2={68} stroke={PEARL} strokeWidth={1} />
      <rect x={99} y={67} width={10} height={8} rx={1.5} fill={PEARL} transform="rotate(12 104 71)" />
    </svg>
  );
}

export const MACHINE_ART: Record<ProcessPhotoStep, ComponentType> = {
  raschel: RaschelMachine,
  polish: PolishMachine,
  printing: PrintingMachine,
  brushing: BrushingMachine,
  products: BlanketStack,
};
