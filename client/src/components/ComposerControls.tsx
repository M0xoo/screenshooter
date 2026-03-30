import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CompactColor } from "./CompactColor";
import {
  mergeComposerState,
  type AspectPreset,
  type BackgroundMode,
  type ComposerState,
  type FrameType,
  type OverlayFontId,
} from "../types";

type Props = {
  state: ComposerState;
  onChange: (next: ComposerState) => void;
  onExport: () => void;
  onBatchExport?: () => void;
  onCopyImage?: () => void;
  exporting: boolean;
  hasShot: boolean;
  exportPixelRatio?: number;
  onExportPixelRatioChange?: (n: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onReset?: () => void;
};

const PRESETS_KEY = "screenshoter-composer-presets-v1";

const ASPECTS: AspectPreset[] = ["16:9", "1:1", "4:5", "9:16", "custom"];

const BG_MODES: { value: BackgroundMode; label: string }[] = [
  { value: "blurShot", label: "Blurred capture" },
  { value: "solid", label: "Solid" },
  { value: "linear", label: "Linear gradient" },
  { value: "radial", label: "Radial gradient" },
  { value: "image", label: "Image" },
];

const TABS = [
  { id: "frame" as const, label: "Frame" },
  { id: "backdrop" as const, label: "Backdrop" },
  { id: "shot" as const, label: "Screenshot" },
  { id: "caption" as const, label: "Caption" },
  { id: "more" as const, label: "More" },
];

type TabId = (typeof TABS)[number]["id"];

function newId() {
  return crypto.randomUUID();
}

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

const selectCls =
  "w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

const rangeCls = "h-2 w-full cursor-pointer accent-zinc-900";

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,7.5rem)_1fr_auto] sm:items-center">
      <span className="text-[11px] font-medium leading-tight text-zinc-500">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={rangeCls}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-full rounded-md border border-zinc-200 px-2 py-1 text-right font-mono text-xs tabular-nums sm:w-14"
      />
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-4 pt-1">{children}</div>;
}

export function ComposerControls({
  state,
  onChange,
  onExport,
  onBatchExport,
  onCopyImage,
  exporting,
  hasShot,
  exportPixelRatio = 2.5,
  onExportPixelRatioChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onReset,
}: Props) {
  const [tab, setTab] = useState<TabId>("frame");
  const b = state.background;
  const [presetName, setPresetName] = useState("");
  const [presetTick, setPresetTick] = useState(0);

  const savedPresets = useMemo(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (!raw) return [] as { name: string; state: ComposerState }[];
      const parsed = JSON.parse(raw) as { name: string; state: ComposerState }[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [state, presetTick]);

  const persistPresets = useCallback(
    (list: { name: string; state: ComposerState }[]) => {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(list));
      setPresetTick((n) => n + 1);
    },
    [],
  );

  const setBg = (patch: Partial<ComposerState["background"]>) =>
    onChange({
      ...state,
      background: { ...state.background, ...patch },
    });

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/90 bg-zinc-50/40 shadow-sm ring-1 ring-black/[0.03]">
      <div className="sticky top-0 z-10 space-y-3 rounded-t-2xl border-b border-zinc-200/80 bg-white/90 px-4 pb-3 pt-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Editor
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              One tab at a time — preview updates live.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {onUndo ? (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo ⌘Z"
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-30"
              >
                Undo
              </button>
            ) : null}
            {onRedo ? (
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo ⌘⇧Z"
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-30"
              >
                Redo
              </button>
            ) : null}
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={!hasShot || exporting}
          className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exporting ? "Working…" : "Download PNG"}
        </button>
        <div className="flex flex-wrap gap-2">
          {onCopyImage ? (
            <button
              type="button"
              onClick={onCopyImage}
              disabled={!hasShot || exporting}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-40 min-[360px]:flex-none"
            >
              Copy
            </button>
          ) : null}
          {onBatchExport ? (
            <button
              type="button"
              onClick={onBatchExport}
              disabled={!hasShot || exporting}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-40 min-[360px]:flex-none"
            >
              Sizes pack
            </button>
          ) : null}
        </div>

        <div
          className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Editor sections"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                tab === t.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[280px] px-4 py-4">
        {tab === "frame" ? (
          <Panel>
            <p className="text-xs text-zinc-500">
              Canvas size, device frame, and drop shadow.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onChange({ ...state, aspect: a })}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    state.aspect === a
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {a === "custom" ? "Custom" : a}
                </button>
              ))}
            </div>
            {state.aspect === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Width
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={state.customAspectW}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        customAspectW: Number(e.target.value) || 1,
                      })
                    }
                    className={inputCls}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Height
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={state.customAspectH}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        customAspectH: Number(e.target.value) || 1,
                      })
                    }
                    className={inputCls}
                  />
                </label>
              </div>
            ) : null}
            <SliderRow
              label="Outer padding"
              min={0}
              max={28}
              value={state.paddingPct}
              onChange={(paddingPct) => onChange({ ...state, paddingPct })}
            />
            <label className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500">
                Device / chrome
              </span>
              <select
                value={state.frameType}
                onChange={(e) =>
                  onChange({
                    ...state,
                    frameType: e.target.value as FrameType,
                  })
                }
                className={selectCls}
              >
                <option value="macWindow">Mac window</option>
                <option value="none">Plain</option>
                <option value="iphone15">iPhone</option>
              </select>
            </label>
            <p className="border-t border-zinc-100 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Frame in canvas
            </p>
            <p className="text-xs text-zinc-500">
              Outer padding insets the compose area from the canvas edge.
              Frame size shrinks the whole window or device so you can shift it
              without clipping. (This is not padding on the screenshot pixels.)
            </p>
            <SliderRow
              label="Frame size"
              min={28}
              max={100}
              value={state.frameSizePct}
              onChange={(frameSizePct) =>
                onChange({ ...state, frameSizePct })
              }
            />
            <SliderRow
              label="Shift sideways"
              min={-49}
              max={49}
              value={state.frameOnCanvas.offsetXPct}
              onChange={(offsetXPct) =>
                onChange({
                  ...state,
                  frameOnCanvas: {
                    ...state.frameOnCanvas,
                    offsetXPct,
                  },
                })
              }
            />
            <SliderRow
              label="Shift up / down"
              min={-49}
              max={49}
              value={state.frameOnCanvas.offsetYPct}
              onChange={(offsetYPct) =>
                onChange({
                  ...state,
                  frameOnCanvas: {
                    ...state.frameOnCanvas,
                    offsetYPct,
                  },
                })
              }
            />
            {state.frameType === "macWindow" ? (
              <>
                <SliderRow
                  label="Title bar height"
                  min={24}
                  max={48}
                  value={state.chrome.titleBarHeight}
                  onChange={(titleBarHeight) =>
                    onChange({
                      ...state,
                      chrome: { ...state.chrome, titleBarHeight },
                    })
                  }
                />
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={state.chrome.showTrafficLights}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        chrome: {
                          ...state.chrome,
                          showTrafficLights: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-zinc-300 text-zinc-900"
                  />
                  Traffic lights
                </label>
              </>
            ) : null}
            <SliderRow
              label="Corner radius"
              min={0}
              max={40}
              value={state.radius}
              onChange={(radius) => onChange({ ...state, radius })}
            />
            <p className="border-t border-zinc-100 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Shadow
            </p>
            <SliderRow
              label="Blur"
              min={0}
              max={120}
              value={state.shadow.blur}
              onChange={(blur) =>
                onChange({
                  ...state,
                  shadow: { ...state.shadow, blur },
                })
              }
            />
            <SliderRow
              label="Offset Y"
              min={0}
              max={80}
              value={state.shadow.offsetY}
              onChange={(offsetY) =>
                onChange({
                  ...state,
                  shadow: { ...state.shadow, offsetY },
                })
              }
            />
            <SliderRow
              label="Offset X"
              min={-40}
              max={40}
              value={state.shadow.offsetX}
              onChange={(offsetX) =>
                onChange({
                  ...state,
                  shadow: { ...state.shadow, offsetX },
                })
              }
            />
            <SliderRow
              label="Spread"
              min={-20}
              max={40}
              value={state.shadow.spread}
              onChange={(spread) =>
                onChange({
                  ...state,
                  shadow: { ...state.shadow, spread },
                })
              }
            />
            <label className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500">
                Shadow color
              </span>
              <input
                type="text"
                value={state.shadow.color}
                onChange={(e) =>
                  onChange({
                    ...state,
                    shadow: { ...state.shadow, color: e.target.value },
                  })
                }
                className={inputCls + " font-mono text-xs"}
                placeholder="rgba(0,0,0,0.18)"
              />
            </label>
          </Panel>
        ) : null}

        {tab === "backdrop" ? (
          <Panel>
            <p className="text-xs text-zinc-500">
              Everything behind your screenshot.
            </p>
            <label className="space-y-1">
              <span className="text-[11px] font-medium text-zinc-500">
                Mode
              </span>
              <select
                value={b.mode}
                onChange={(e) =>
                  setBg({ mode: e.target.value as BackgroundMode })
                }
                className={selectCls}
              >
                {BG_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            {b.mode === "solid" ? (
              <CompactColor
                label="Color"
                color={b.solid}
                onChange={(solid) => setBg({ solid })}
              />
            ) : null}

            {b.mode === "linear" ? (
              <div className="space-y-4">
                <SliderRow
                  label="Angle"
                  min={0}
                  max={360}
                  value={b.linearAngle}
                  onChange={(linearAngle) => setBg({ linearAngle })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CompactColor
                    label="From"
                    color={b.linearFrom}
                    onChange={(linearFrom) => setBg({ linearFrom })}
                  />
                  <CompactColor
                    label="To"
                    color={b.linearTo}
                    onChange={(linearTo) => setBg({ linearTo })}
                  />
                </div>
              </div>
            ) : null}

            {b.mode === "radial" ? (
              <div className="space-y-4">
                <SliderRow
                  label="Center X"
                  min={0}
                  max={100}
                  value={b.radialCenterX}
                  onChange={(radialCenterX) => setBg({ radialCenterX })}
                />
                <SliderRow
                  label="Center Y"
                  min={0}
                  max={100}
                  value={b.radialCenterY}
                  onChange={(radialCenterY) => setBg({ radialCenterY })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CompactColor
                    label="Inner"
                    color={b.radialFrom}
                    onChange={(radialFrom) => setBg({ radialFrom })}
                  />
                  <CompactColor
                    label="Outer"
                    color={b.radialTo}
                    onChange={(radialTo) => setBg({ radialTo })}
                  />
                </div>
              </div>
            ) : null}

            {b.mode === "image" ? (
              <div className="space-y-4">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Image file
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setBg({ imageDataUrl: null });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () =>
                        setBg({ imageDataUrl: String(reader.result) });
                      reader.readAsDataURL(file);
                    }}
                    className="block w-full text-xs text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-800"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Fit
                  </span>
                  <select
                    value={b.imageFit}
                    onChange={(e) =>
                      setBg({
                        imageFit: e.target.value as ComposerState["background"]["imageFit"],
                      })
                    }
                    className={selectCls}
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="custom">Custom scale</option>
                  </select>
                </label>
                {b.imageFit === "custom" ? (
                  <SliderRow
                    label="Scale %"
                    min={50}
                    max={200}
                    value={b.imageScalePct}
                    onChange={(imageScalePct) => setBg({ imageScalePct })}
                  />
                ) : null}
                <SliderRow
                  label="Position X"
                  min={0}
                  max={100}
                  value={b.imagePosX}
                  onChange={(imagePosX) => setBg({ imagePosX })}
                />
                <SliderRow
                  label="Position Y"
                  min={0}
                  max={100}
                  value={b.imagePosY}
                  onChange={(imagePosY) => setBg({ imagePosY })}
                />
              </div>
            ) : null}

            {b.mode === "blurShot" ? (
              <div className="space-y-4">
                <SliderRow
                  label="Blur px"
                  min={4}
                  max={80}
                  value={b.blurAmount}
                  onChange={(blurAmount) => setBg({ blurAmount })}
                />
                <SliderRow
                  label="Backdrop %"
                  min={10}
                  max={100}
                  value={Math.round(b.blurOpacity * 100)}
                  onChange={(v) => setBg({ blurOpacity: v / 100 })}
                />
              </div>
            ) : null}
          </Panel>
        ) : null}

        {tab === "shot" ? (
          <Panel>
            <p className="text-xs text-zinc-500">
              Scale, pan, and crop inside the frame.
            </p>
            <SliderRow
              label="Scale"
              min={50}
              max={200}
              value={Math.round(state.subject.scale * 100)}
              onChange={(v) =>
                onChange({
                  ...state,
                  subject: { ...state.subject, scale: v / 100 },
                })
              }
            />
            <SliderRow
              label="Pan X"
              min={-40}
              max={40}
              value={state.subject.positionX}
              onChange={(positionX) =>
                onChange({
                  ...state,
                  subject: { ...state.subject, positionX },
                })
              }
            />
            <SliderRow
              label="Pan Y"
              min={-40}
              max={40}
              value={state.subject.positionY}
              onChange={(positionY) =>
                onChange({
                  ...state,
                  subject: { ...state.subject, positionY },
                })
              }
            />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Crop inset %
            </p>
            {(
              [
                ["cropTop", "Top"],
                ["cropRight", "Right"],
                ["cropBottom", "Bottom"],
                ["cropLeft", "Left"],
              ] as const
            ).map(([k, lab]) => (
              <SliderRow
                key={k}
                label={lab}
                min={0}
                max={45}
                value={state.subject[k]}
                onChange={(n) =>
                  onChange({
                    ...state,
                    subject: { ...state.subject, [k]: n },
                  })
                }
              />
            ))}
          </Panel>
        ) : null}

        {tab === "caption" ? (
          <Panel>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={state.overlay.enabled}
                onChange={(e) =>
                  onChange({
                    ...state,
                    overlay: { ...state.overlay, enabled: e.target.checked },
                  })
                }
                className="rounded border-zinc-300 text-zinc-900"
              />
              Show caption on image
            </label>
            {state.overlay.enabled ? (
              <div className="space-y-4 border-t border-zinc-100 pt-4">
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Title
                  </span>
                  <input
                    type="text"
                    value={state.overlay.title}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        overlay: { ...state.overlay, title: e.target.value },
                      })
                    }
                    className={inputCls}
                    placeholder="Headline"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Subtitle
                  </span>
                  <input
                    type="text"
                    value={state.overlay.subtitle}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        overlay: { ...state.overlay, subtitle: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Align
                    </span>
                    <select
                      value={state.overlay.align}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            align: e.target.value as ComposerState["overlay"]["align"],
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Vertical
                    </span>
                    <select
                      value={state.overlay.vertical}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            vertical: e.target.value as ComposerState["overlay"]["vertical"],
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value="top">Top</option>
                      <option value="center">Middle</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                </div>
                <SliderRow
                  label="Inset"
                  min={2}
                  max={20}
                  value={state.overlay.insetPct}
                  onChange={(insetPct) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, insetPct },
                    })
                  }
                />
                <label className="space-y-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    Font
                  </span>
                  <select
                    value={state.overlay.fontId}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        overlay: {
                          ...state.overlay,
                          fontId: e.target.value as OverlayFontId,
                        },
                      })
                    }
                    className={selectCls}
                  >
                    <option value="inter">Inter</option>
                    <option value="dmSans">DM Sans</option>
                    <option value="poppins">Poppins</option>
                    <option value="montserrat">Montserrat</option>
                    <option value="spaceGrotesk">Space Grotesk</option>
                    <option value="outfit">Outfit</option>
                    <option value="nunito">Nunito</option>
                    <option value="ibmPlexSans">IBM Plex Sans</option>
                    <option value="sourceSans3">Source Sans 3</option>
                    <option value="raleway">Raleway</option>
                    <option value="oswald">Oswald</option>
                    <option value="fraunces">Fraunces</option>
                    <option value="playfairDisplay">Playfair Display</option>
                    <option value="lora">Lora</option>
                    <option value="merriweather">Merriweather</option>
                    <option value="jetbrains">JetBrains Mono</option>
                    <option value="system">System UI</option>
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CompactColor
                    label="Title color"
                    color={state.overlay.titleColor}
                    onChange={(titleColor) =>
                      onChange({
                        ...state,
                        overlay: { ...state.overlay, titleColor },
                      })
                    }
                  />
                  <CompactColor
                    label="Subtitle color"
                    color={state.overlay.subtitleColor}
                    onChange={(subtitleColor) =>
                      onChange({
                        ...state,
                        overlay: { ...state.overlay, subtitleColor },
                      })
                    }
                  />
                </div>
                <SliderRow
                  label="Title size"
                  min={14}
                  max={48}
                  value={state.overlay.titleSize}
                  onChange={(titleSize) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, titleSize },
                    })
                  }
                />
                <SliderRow
                  label="Subtitle size"
                  min={10}
                  max={24}
                  value={state.overlay.subtitleSize}
                  onChange={(subtitleSize) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, subtitleSize },
                    })
                  }
                />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Typography
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Title weight
                    </span>
                    <select
                      value={state.overlay.titleFontWeight}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            titleFontWeight: Number(e.target.value),
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value={300}>Light (300)</option>
                      <option value={400}>Regular (400)</option>
                      <option value={500}>Medium (500)</option>
                      <option value={600}>Semibold (600)</option>
                      <option value={700}>Bold (700)</option>
                      <option value={800}>Extra bold (800)</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Subtitle weight
                    </span>
                    <select
                      value={state.overlay.subtitleFontWeight}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            subtitleFontWeight: Number(e.target.value),
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value={300}>Light (300)</option>
                      <option value={400}>Regular (400)</option>
                      <option value={500}>Medium (500)</option>
                      <option value={600}>Semibold (600)</option>
                      <option value={700}>Bold (700)</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Title case
                    </span>
                    <select
                      value={state.overlay.titleTextTransform}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            titleTextTransform: e.target
                              .value as ComposerState["overlay"]["titleTextTransform"],
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value="none">As you typed</option>
                      <option value="uppercase">UPPERCASE</option>
                      <option value="lowercase">lowercase</option>
                      <option value="capitalize">Capitalize Words</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Subtitle case
                    </span>
                    <select
                      value={state.overlay.subtitleTextTransform}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          overlay: {
                            ...state.overlay,
                            subtitleTextTransform: e.target
                              .value as ComposerState["overlay"]["subtitleTextTransform"],
                          },
                        })
                      }
                      className={selectCls}
                    >
                      <option value="none">As you typed</option>
                      <option value="uppercase">UPPERCASE</option>
                      <option value="lowercase">lowercase</option>
                      <option value="capitalize">Capitalize Words</option>
                    </select>
                  </label>
                </div>
                <SliderRow
                  label="Title letter spacing (px)"
                  min={-2}
                  max={10}
                  step={0.5}
                  value={state.overlay.titleLetterSpacing}
                  onChange={(titleLetterSpacing) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, titleLetterSpacing },
                    })
                  }
                />
                <SliderRow
                  label="Subtitle letter spacing (px)"
                  min={-2}
                  max={8}
                  step={0.5}
                  value={state.overlay.subtitleLetterSpacing}
                  onChange={(subtitleLetterSpacing) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, subtitleLetterSpacing },
                    })
                  }
                />
                <SliderRow
                  label="Title line height"
                  min={1}
                  max={2.2}
                  step={0.05}
                  value={state.overlay.titleLineHeight}
                  onChange={(titleLineHeight) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, titleLineHeight },
                    })
                  }
                />
                <SliderRow
                  label="Subtitle line height"
                  min={1}
                  max={2.2}
                  step={0.05}
                  value={state.overlay.subtitleLineHeight}
                  onChange={(subtitleLineHeight) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, subtitleLineHeight },
                    })
                  }
                />
                <SliderRow
                  label="Gap title → subtitle"
                  min={0}
                  max={28}
                  value={state.overlay.titleSubtitleGap}
                  onChange={(titleSubtitleGap) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, titleSubtitleGap },
                    })
                  }
                />
                <SliderRow
                  label="Subtitle opacity"
                  min={20}
                  max={100}
                  value={Math.round((state.overlay.subtitleOpacity ?? 0.9) * 100)}
                  onChange={(pct) =>
                    onChange({
                      ...state,
                      overlay: {
                        ...state.overlay,
                        subtitleOpacity: pct / 100,
                      },
                    })
                  }
                />
                <SliderRow
                  label="Caption max width"
                  min={50}
                  max={100}
                  value={state.overlay.maxWidthPct}
                  onChange={(maxWidthPct) =>
                    onChange({
                      ...state,
                      overlay: { ...state.overlay, maxWidthPct },
                    })
                  }
                />
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={state.overlay.shadow}
                    onChange={(e) =>
                      onChange({
                        ...state,
                        overlay: {
                          ...state.overlay,
                          shadow: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-zinc-300 text-zinc-900"
                  />
                  Text shadow
                </label>
              </div>
            ) : null}
          </Panel>
        ) : null}

        {tab === "more" ? (
          <Panel>
            {onExportPixelRatioChange ? (
              <label className="space-y-1">
                <span className="text-[11px] font-medium text-zinc-500">
                  PNG sharpness (pixel ratio)
                </span>
                <select
                  value={String(exportPixelRatio)}
                  onChange={(e) =>
                    onExportPixelRatioChange(Number(e.target.value))
                  }
                  className={selectCls}
                >
                  <option value="1">1× (smaller file)</option>
                  <option value="2">2×</option>
                  <option value="2.5">2.5× (default)</option>
                  <option value="3">3× (heaviest)</option>
                </select>
              </label>
            ) : null}

            <details className="group rounded-xl border border-zinc-200 bg-white p-3 shadow-sm open:shadow-md">
              <summary className="cursor-pointer list-none text-sm font-medium text-zinc-800 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Annotations & blur
                  <span className="text-xs font-normal text-zinc-400 group-open:rotate-0">
                    ▾
                  </span>
                </span>
              </summary>
              <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      redactions: [
                        ...state.redactions,
                        { id: newId(), x: 25, y: 35, w: 30, h: 12 },
                      ],
                    })
                  }
                  className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  + Privacy blur
                </button>
                {state.redactions.map((r, i) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-zinc-50 p-2 text-xs ring-1 ring-zinc-100"
                  >
                    <div className="mb-2 flex items-center justify-between font-medium text-zinc-600">
                      Blur {i + 1}
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() =>
                          onChange({
                            ...state,
                            redactions: state.redactions.filter(
                              (x) => x.id !== r.id,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(["x", "y", "w", "h"] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-500">
                            {k}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={r[k]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              onChange({
                                ...state,
                                redactions: state.redactions.map((x) =>
                                  x.id === r.id ? { ...x, [k]: v } : x,
                                ),
                              });
                            }}
                            className="rounded border border-zinc-200 px-1 py-0.5 text-[11px]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      arrows: [
                        ...state.arrows,
                        {
                          id: newId(),
                          x0: 20,
                          y0: 60,
                          x1: 70,
                          y1: 30,
                          color: "#f97316",
                        },
                      ],
                    })
                  }
                  className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  + Arrow
                </button>
                {state.arrows.map((a, i) => (
                  <div
                    key={a.id}
                    className="rounded-lg bg-zinc-50 p-2 text-xs ring-1 ring-zinc-100"
                  >
                    <div className="mb-2 flex items-center justify-between font-medium text-zinc-600">
                      Arrow {i + 1}
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() =>
                          onChange({
                            ...state,
                            arrows: state.arrows.filter((x) => x.id !== a.id),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(["x0", "y0", "x1", "y1"] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-500">
                            {k}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={a[k]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              onChange({
                                ...state,
                                arrows: state.arrows.map((x) =>
                                  x.id === a.id ? { ...x, [k]: v } : x,
                                ),
                              });
                            }}
                            className="rounded border border-zinc-200 px-1 py-0.5 text-[11px]"
                          />
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={a.color}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          arrows: state.arrows.map((x) =>
                            x.id === a.id ? { ...x, color: e.target.value } : x,
                          ),
                        })
                      }
                      className="mt-2 w-full rounded border border-zinc-200 px-2 py-1 font-mono text-[10px]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      highlights: [
                        ...state.highlights,
                        {
                          id: newId(),
                          x: 15,
                          y: 20,
                          w: 50,
                          h: 25,
                          color: "#fbbf24",
                        },
                      ],
                    })
                  }
                  className="w-full rounded-lg border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  + Highlight
                </button>
                {state.highlights.map((h, i) => (
                  <div
                    key={h.id}
                    className="rounded-lg bg-zinc-50 p-2 text-xs ring-1 ring-zinc-100"
                  >
                    <div className="mb-2 flex items-center justify-between font-medium text-zinc-600">
                      Highlight {i + 1}
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() =>
                          onChange({
                            ...state,
                            highlights: state.highlights.filter(
                              (x) => x.id !== h.id,
                            ),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(["x", "y", "w", "h"] as const).map((k) => (
                        <label key={k} className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-500">
                            {k}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={h[k]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              onChange({
                                ...state,
                                highlights: state.highlights.map((x) =>
                                  x.id === h.id ? { ...x, [k]: v } : x,
                                ),
                              });
                            }}
                            className="rounded border border-zinc-200 px-1 py-0.5 text-[11px]"
                          />
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={h.color}
                      onChange={(e) =>
                        onChange({
                          ...state,
                          highlights: state.highlights.map((x) =>
                            x.id === h.id
                              ? { ...x, color: e.target.value }
                              : x,
                          ),
                        })
                      }
                      className="mt-2 w-full rounded border border-zinc-200 px-2 py-1 font-mono text-[10px]"
                    />
                  </div>
                ))}
              </div>
            </details>

            <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <p className="text-sm font-medium text-zinc-800">Presets</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Name"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => {
                    const name =
                      presetName.trim() ||
                      `Preset ${savedPresets.length + 1}`;
                    persistPresets([...savedPresets, { name, state }]);
                    setPresetName("");
                  }}
                  className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {savedPresets.map((pr, idx) => (
                  <button
                    key={`${pr.name}-${idx}`}
                    type="button"
                    onClick={() => onChange(mergeComposerState(pr.state))}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200/80 hover:bg-zinc-200/80"
                  >
                    {pr.name}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
