
import { forwardRef, useId } from "react";
import type { CSSProperties } from "react";
import {
  aspectRatioValue,
  OVERLAY_FONT_STACKS,
  type ComposerState,
} from "../types";

type Props = {
  shotDataUrl: string | null;
  state: ComposerState;
};

/** Device outline geometry from Magic UI (MIT): github.com/magicuidesign/magicui — registry/magicui/iphone.tsx */
const IPHONE_W = 433;
const IPHONE_H = 882;
const IPHONE_SCREEN = {
  x: 21.25,
  y: 19.25,
  w: 389.5,
  h: 843.5,
  r: 55.75,
} as const;

function backgroundStyle(state: ComposerState): CSSProperties {
  const { background: b } = state;
  switch (b.mode) {
    case "solid":
      return { backgroundColor: b.solid };
    case "linear":
      return {
        background: `linear-gradient(${b.linearAngle}deg, ${b.linearFrom}, ${b.linearTo})`,
      };
    case "radial":
      return {
        background: `radial-gradient(circle at ${b.radialCenterX}% ${b.radialCenterY}%, ${b.radialFrom}, ${b.radialTo})`,
      };
    case "image":
      if (!b.imageDataUrl) return { backgroundColor: "#fafafa" };
      if (b.imageFit === "cover") {
        return {
          backgroundImage: `url(${b.imageDataUrl})`,
          backgroundSize: "cover",
          backgroundPosition: `${b.imagePosX}% ${b.imagePosY}%`,
        };
      }
      if (b.imageFit === "contain") {
        return {
          backgroundImage: `url(${b.imageDataUrl})`,
          backgroundSize: "contain",
          backgroundPosition: `${b.imagePosX}% ${b.imagePosY}%`,
          backgroundRepeat: "no-repeat",
        };
      }
      return {
        backgroundImage: `url(${b.imageDataUrl})`,
        backgroundSize: `${b.imageScalePct}%`,
        backgroundPosition: `${b.imagePosX}% ${b.imagePosY}%`,
        backgroundRepeat: "no-repeat",
      };
    case "blurShot":
      return { backgroundColor: "#0a0a0a" };
    default:
      return { backgroundColor: "#fafafa" };
  }
}

function ShotLayers({
  shotDataUrl,
  state,
}: {
  shotDataUrl: string | null;
  state: ComposerState;
}) {
  const s = state.subject;
  const clip = `inset(${s.cropTop}% ${s.cropRight}% ${s.cropBottom}% ${s.cropLeft}%)`;
  const tf = `scale(${s.scale}) translate(${s.positionX}%, ${s.positionY}%)`;

  return (
    <div className="relative max-h-full max-w-full bg-neutral-950 leading-none">
      <div className="relative overflow-hidden" style={{ clipPath: clip }}>
        <div
          style={{
            transform: tf,
            transformOrigin: "center center",
          }}
        >
          {shotDataUrl ? (
            <img
              src={shotDataUrl}
              alt=""
              className="block max-h-full w-auto max-w-full object-contain"
              style={{ verticalAlign: "top" }}
              draggable={false}
            />
          ) : (
            <div className="flex h-40 w-72 max-w-full items-center justify-center bg-neutral-900 text-sm text-neutral-500">
              Preview
            </div>
          )}
        </div>
      </div>
      {shotDataUrl
        ? state.redactions.map((r) => (
            <div
              key={r.id}
              className="pointer-events-none absolute z-10"
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                backgroundColor: "rgba(0,0,0,0.22)",
              }}
            />
          ))
        : null}
      {shotDataUrl ? (
        <svg
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {state.arrows.map((a) => (
            <line
              key={a.id}
              x1={a.x0}
              y1={a.y0}
              x2={a.x1}
              y2={a.y1}
              stroke={a.color}
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {state.highlights.map((h) => (
            <rect
              key={h.id}
              x={h.x}
              y={h.y}
              width={h.w}
              height={h.h}
              fill={h.color}
              fillOpacity={0.35}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

/** High-fidelity iPhone silhouette: buttons, Dynamic Island, earpiece; mask cuts the live screen area. */
function IphoneDeviceFrameSvg({
  maskId,
  dropShadowFilter,
}: {
  maskId: string;
  dropShadowFilter: string;
}) {
  const { x: sx, y: sy, w: sw, h: sh, r: sr } = IPHONE_SCREEN;
  const maskRef = `url(#${maskId})`;
  /** Black / space-black style (Apple-like, not silver mockup). */
  const body = "#1c1c1e";
  const bodyDeep = "#141416";
  const edge = "#2c2c2e";
  const island = "#0d0e0f";
  const islandLift = "#161618";
  return (
    <svg
      viewBox={`0 0 ${IPHONE_W} ${IPHONE_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      style={{ transform: "translateZ(0)", filter: dropShadowFilter }}
      aria-hidden
    >
      <g mask={maskRef}>
        <path
          d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
          fill={body}
        />
        <path
          d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"
          fill={bodyDeep}
        />
        <path
          d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"
          fill={bodyDeep}
        />
        <path
          d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"
          fill={bodyDeep}
        />
        <path
          d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"
          fill={bodyDeep}
        />
        <path
          d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
          fill="#101011"
        />
      </g>

      <path
        opacity={0.55}
        d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"
        fill="#3a3a3c"
      />

      <path
        d={`M${sx} 75C${sx} 44.2101 46.2101 ${sy} 77 ${sy}H355C385.79 ${sy} 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 ${sx} 837.79 ${sx} 807V75Z`}
        fill={body}
        stroke={edge}
        strokeWidth={0.5}
        mask={maskRef}
      />

      <path
        d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
        fill={island}
      />
      <path
        d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
        fill={islandLift}
      />
      <path
        d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"
        fill={edge}
      />

      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width={IPHONE_W} height={IPHONE_H} fill="white" />
          <rect x={sx} y={sy} width={sw} height={sh} rx={sr} ry={sr} fill="black" />
        </mask>
      </defs>
    </svg>
  );
}

function iphoneDropShadowFilter(s: ComposerState["shadow"]): string {
  // drop-shadow follows SVG alpha (device silhouette); box-shadow on the wrapper did not.
  const { offsetX, offsetY, blur, color } = s;
  return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`;
}

function FrameChrome({
  state,
  shotDataUrl,
  shadowCss,
  iphoneMaskId,
}: {
  state: ComposerState;
  shotDataUrl: string | null;
  shadowCss: string;
  iphoneMaskId: string;
}) {
  if (state.frameType === "iphone15") {
    const scr = IPHONE_SCREEN;
    const leftPct = (scr.x / IPHONE_W) * 100;
    const topPct = (scr.y / IPHONE_H) * 100;
    const wPct = (scr.w / IPHONE_W) * 100;
    const hPct = (scr.h / IPHONE_H) * 100;
    const rHPct = (scr.r / scr.w) * 100;
    const rVPct = (scr.r / scr.h) * 100;
    return (
      <div
        className="relative mx-auto min-h-0 min-w-0 max-h-full max-w-full"
        style={{
          // Fill the padded compose box: no fixed px cap — wide export aspects need a proportional device.
          width: `min(100cqw, calc(100cqh * ${IPHONE_W} / ${IPHONE_H}))`,
          aspectRatio: IPHONE_W / IPHONE_H,
        }}
      >
        <div
          className="absolute z-0 overflow-hidden bg-black"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${wPct}%`,
            height: `${hPct}%`,
            borderRadius: `${rHPct}% / ${rVPct}%`,
          }}
        >
          <ShotLayers shotDataUrl={shotDataUrl} state={state} />
        </div>
        <IphoneDeviceFrameSvg
          maskId={iphoneMaskId}
          dropShadowFilter={iphoneDropShadowFilter(state.shadow)}
        />
      </div>
    );
  }

  const shell = (
    <div
      className="inline-flex max-w-full flex-col items-stretch overflow-hidden bg-neutral-950"
      style={{
        width: "fit-content",
        maxWidth: "100%",
        borderRadius: state.radius,
        boxShadow: shadowCss,
      }}
    >
      {state.frameType === "macWindow" && state.chrome.showTrafficLights ? (
        <div
          className="flex w-full items-center gap-1.5 border-b border-black/30 bg-[#2d2d2d] px-3"
          style={{
            height: state.chrome.titleBarHeight,
            minHeight: 28,
          }}
        >
          <span className="size-2.5 shrink-0 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 shrink-0 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 shrink-0 rounded-full bg-[#28c840]" />
        </div>
      ) : null}
      <div className="relative min-h-0 min-w-0 max-h-full max-w-full">
        <ShotLayers shotDataUrl={shotDataUrl} state={state} />
      </div>
    </div>
  );

  return (
    <div className="w-max min-w-0 max-w-full">
      {shell}
    </div>
  );
}

function OverlayBlock({ state }: { state: ComposerState }) {
  if (!state.overlay.enabled) return null;
  if (!state.overlay.title && !state.overlay.subtitle) return null;

  const inset = state.overlay.insetPct;
  const align =
    state.overlay.align === "center"
      ? "text-center"
      : state.overlay.align === "right"
        ? "text-right"
        : "text-left";
  const captionAlign = state.overlay.align;
  const maxW = state.overlay.maxWidthPct ?? 100;
  const captionWrapClass =
    captionAlign === "center"
      ? "mx-auto"
      : captionAlign === "right"
        ? "ml-auto"
        : "";
  const font = OVERLAY_FONT_STACKS[state.overlay.fontId];
  const shadow = state.overlay.shadow
    ? "0 1px 2px rgba(0,0,0,0.5)"
    : undefined;

  const inner = (
    <div
      className={captionWrapClass}
      style={{
        maxWidth: maxW < 100 ? `${maxW}%` : undefined,
      }}
    >
      {state.overlay.title ? (
        <div
          style={{
            color: state.overlay.titleColor,
            fontSize: state.overlay.titleSize,
            fontWeight: state.overlay.titleFontWeight ?? 600,
            letterSpacing: `${state.overlay.titleLetterSpacing ?? 0}px`,
            lineHeight: state.overlay.titleLineHeight ?? 1.2,
            textTransform:
              state.overlay.titleTextTransform === "none"
                ? "none"
                : state.overlay.titleTextTransform,
            fontFamily: font,
            textShadow: shadow,
          }}
        >
          {state.overlay.title}
        </div>
      ) : null}
      {state.overlay.subtitle ? (
        <div
          style={{
            marginTop:
              state.overlay.title && state.overlay.subtitle
                ? state.overlay.titleSubtitleGap ?? 4
                : 0,
            color: state.overlay.subtitleColor,
            fontSize: state.overlay.subtitleSize,
            fontWeight: state.overlay.subtitleFontWeight ?? 400,
            letterSpacing: `${state.overlay.subtitleLetterSpacing ?? 0}px`,
            lineHeight: state.overlay.subtitleLineHeight ?? 1.4,
            textTransform:
              state.overlay.subtitleTextTransform === "none"
                ? "none"
                : state.overlay.subtitleTextTransform,
            fontFamily: font,
            textShadow: shadow,
            opacity: state.overlay.subtitleOpacity ?? 0.9,
          }}
        >
          {state.overlay.subtitle}
        </div>
      ) : null}
    </div>
  );

  const base = `pointer-events-none absolute left-0 right-0 z-30 px-[8%] ${align}`;

  if (state.overlay.vertical === "top") {
    return (
      <div className={`${base} top-0`} style={{ paddingTop: `${inset}%` }}>
        {inner}
      </div>
    );
  }
  if (state.overlay.vertical === "center") {
    return (
      <div
        className={`${base} top-1/2 -translate-y-1/2`}
        style={{ paddingTop: `${inset * 0.25}%` }}
      >
        {inner}
      </div>
    );
  }
  return (
    <div
      className={`${base} bottom-0`}
      style={{ paddingBottom: `${inset}%`, paddingTop: "3.5rem" }}
    >
      {inner}
    </div>
  );
}

export const ComposerCanvas = forwardRef<HTMLDivElement, Props>(
  function ComposerCanvas({ shotDataUrl, state }, ref) {
    const iphoneMaskId = useId().replace(/:/g, "");
    const ratio = aspectRatioValue(state);
    const pad = `${state.paddingPct}%`;
    const shadow = `${state.shadow.offsetX}px ${state.shadow.offsetY}px ${state.shadow.blur}px ${state.shadow.spread}px ${state.shadow.color}`;

    return (
      <div
        ref={ref}
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: ratio,
          maxHeight: "min(76vh, 720px)",
          ...backgroundStyle(state),
        }}
      >
        {state.background.mode === "blurShot" && shotDataUrl ? (
          <div
            className="pointer-events-none absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(${shotDataUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: `blur(${state.background.blurAmount}px)`,
              opacity: state.background.blurOpacity,
            }}
            aria-hidden
          />
        ) : null}

        <div
          className="relative box-border h-full min-h-0 w-full"
          style={{ padding: pad }}
        >
          {/* Padding does not inset absolute children of the padded box (CB is padding edge). This flow wrapper sits in the content box so inset-0 is truly inside the padding. */}
          <div className="relative h-full min-h-0 w-full min-w-0 [container-type:size]">
            <div className="absolute inset-0 min-h-0 overflow-visible">
              <div
                className="absolute min-h-0 min-w-0 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `calc(50% + ${state.frameOnCanvas.offsetXPct}%)`,
                  top: `calc(50% + ${state.frameOnCanvas.offsetYPct}%)`,
                }}
              >
                <div
                  className="flex min-h-0 min-w-0 max-h-full max-w-full origin-center items-center justify-center"
                  style={{
                    transform: `scale(${Math.max(0.05, state.frameSizePct / 100)})`,
                  }}
                >
                  <FrameChrome
                    state={state}
                    shotDataUrl={shotDataUrl}
                    shadowCss={shadow}
                    iphoneMaskId={iphoneMaskId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <OverlayBlock state={state} />
      </div>
    );
  },
);
