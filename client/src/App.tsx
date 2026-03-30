import { useCallback, useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import type { CaptureRequest } from "@screenshoter/shared";
import {
  buildExportBasename,
  copyPngToClipboard,
  downloadDataUrl,
} from "./composer/export";
import { useComposerHistory } from "./composer/useComposerHistory";
import { ComposerCanvas } from "./components/ComposerCanvas";
import { ComposerControls } from "./components/ComposerControls";
import { Landing } from "./components/Landing";
import {
  getDefaultComposerState,
  getDefaultComposerStateForCapturePreset,
  isNarrowTouchViewport,
} from "./types";

type ViewportPreset = "desktop" | "mobile";
type Step = "capture" | "compose";

const BATCH_SIZES = [
  { w: 1200, h: 630, tag: "og-1200x630" },
  { w: 1600, h: 900, tag: "wide-1600x900" },
  { w: 1080, h: 1080, tag: "square-1080" },
] as const;

/** html-to-image sometimes rejects with a DOM Event, not Error. */
function exportErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return fallback;
}

export function App() {
  const [step, setStep] = useState<Step>("capture");
  const [url, setUrl] = useState("");
  const [shotDataUrl, setShotDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>(() =>
    isNarrowTouchViewport() ? "mobile" : "desktop",
  );
  const [fullPage, setFullPage] = useState(false);

  const {
    composer,
    setComposer,
    replaceComposer,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useComposerHistory(getDefaultComposerState());

  const [exportPixelRatio, setExportPixelRatio] = useState(() =>
    isNarrowTouchViewport() ? 2 : 2.5,
  );
  const [exporting, setExporting] = useState(false);

  const composerRef = useRef<HTMLDivElement>(null);

  const revokeShot = useCallback(() => {
    if (shotDataUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(shotDataUrl);
    }
  }, [shotDataUrl]);

  useEffect(() => () => revokeShot(), [revokeShot]);

  const goBackToCapture = useCallback(() => {
    revokeShot();
    setShotDataUrl(null);
    setStep("capture");
    setCaptureError(null);
  }, [revokeShot]);

  const capture = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setCaptureError("Enter a URL.");
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setCaptureError("Invalid URL.");
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setCaptureError("Only http and https URLs are supported.");
      return;
    }

    setCaptureError(null);
    setLoading(true);
    const previousBlob = shotDataUrl;

    const viewport =
      viewportPreset === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1280, height: 720 };

    const body: CaptureRequest = {
      url: parsed.href,
      viewport,
      deviceScaleFactor: 1,
      fullPage,
      waitUntil: "networkidle",
      timeoutMs: 45000,
    };

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errJson?.error ?? `Capture failed (${res.status})`);
      }

      const blob = await res.blob();
      const next = URL.createObjectURL(blob);
      if (previousBlob?.startsWith("blob:")) {
        URL.revokeObjectURL(previousBlob);
      }
      setShotDataUrl(next);
      replaceComposer(getDefaultComposerStateForCapturePreset(viewportPreset));
      setStep("compose");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Capture failed";
      setCaptureError(msg);
    } finally {
      setLoading(false);
    }
  }, [fullPage, replaceComposer, shotDataUrl, url, viewportPreset]);

  let parsedHost = "";
  try {
    if (url.trim()) parsedHost = new URL(url.trim()).hostname;
  } catch {
    parsedHost = "";
  }

  const baseName = buildExportBasename(parsedHost);

  const exportPng = useCallback(async () => {
    const node = composerRef.current;
    if (!node || !shotDataUrl) return;

    setExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: exportPixelRatio,
        // cacheBust appends ?t= to every URL; that breaks blob: screenshot URLs and fails embed.
        cacheBust: false,
        backgroundColor: undefined,
      });
      downloadDataUrl(dataUrl, `${baseName}.png`);
    } catch (e) {
      const msg = exportErrorMessage(e, "Export failed");
      setCaptureError(msg);
    } finally {
      setExporting(false);
    }
  }, [shotDataUrl, exportPixelRatio, baseName]);

  const batchExport = useCallback(async () => {
    const node = composerRef.current;
    if (!node || !shotDataUrl) return;

    setExporting(true);
    try {
      for (const { w, h, tag } of BATCH_SIZES) {
        const dataUrl = await htmlToImage.toPng(node, {
          width: w,
          height: h,
          pixelRatio: exportPixelRatio,
          cacheBust: false,
          backgroundColor: undefined,
        });
        downloadDataUrl(dataUrl, `${baseName}-${tag}.png`);
        await new Promise((r) => setTimeout(r, 120));
      }
    } catch (e) {
      const msg = exportErrorMessage(e, "Batch export failed");
      setCaptureError(msg);
    } finally {
      setExporting(false);
    }
  }, [shotDataUrl, exportPixelRatio, baseName]);

  const copyImage = useCallback(async () => {
    const node = composerRef.current;
    if (!node || !shotDataUrl) return;

    setExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: exportPixelRatio,
        cacheBust: false,
        backgroundColor: undefined,
      });
      await copyPngToClipboard(dataUrl);
    } catch (e) {
      const msg = exportErrorMessage(e, "Copy failed");
      setCaptureError(msg);
    } finally {
      setExporting(false);
    }
  }, [shotDataUrl, exportPixelRatio]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (step !== "compose") return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (mod && e.key === "e") {
        e.preventDefault();
        void exportPng();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, undo, redo, exportPng]);

  return (
    <div
      className={
        step === "compose"
          ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
          : "min-h-screen"
      }
    >
      <main
        className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${
          step === "compose"
            ? "flex min-h-0 flex-1 flex-col overflow-hidden py-6 sm:py-8"
            : "py-10 sm:py-14"
        }`}
      >
        {step === "capture" ? (
          <Landing
            url={url}
            onUrlChange={setUrl}
            onSubmit={capture}
            loading={loading}
            error={captureError}
            viewportPreset={viewportPreset}
            onViewportPresetChange={setViewportPreset}
          />
        ) : (
          <>
            <div className="flex shrink-0 flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={goBackToCapture}
                  className="text-xs font-medium text-neutral-500 transition hover:text-neutral-900"
                >
                  ← Back to URL
                </button>
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
                  Style & export
                </h1>
                {parsedHost ? (
                  <p className="mt-1 truncate font-mono text-xs text-neutral-500">
                    {parsedHost}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4 sm:border-t-0 sm:pt-0">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
                  <input
                    type="checkbox"
                    checked={fullPage}
                    onChange={(e) => setFullPage(e.target.checked)}
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900/20"
                  />
                  Full page
                </label>
                <button
                  type="button"
                  onClick={capture}
                  disabled={loading || !url.trim()}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Capturing…" : "Re-capture"}
                </button>
              </div>
            </div>

            {captureError ? (
              <p className="mt-4 shrink-0 text-sm text-red-600" role="alert">
                {captureError}
              </p>
            ) : null}

            <div className="mt-8 flex min-h-0 flex-1 flex-col gap-8 lg:flex-row lg:items-stretch">
              <div className="order-1 flex min-h-0 min-w-0 flex-[1.25] basis-0 flex-col gap-2 overflow-y-auto lg:basis-auto lg:flex-1 lg:justify-center lg:overflow-y-hidden">
                <p className="shrink-0 text-xs font-medium text-zinc-500">
                  Live preview
                </p>
                <div className="preview-shell h-fit w-full max-w-full shrink-0 rounded-2xl border border-zinc-200/90 p-4 shadow-sm ring-1 ring-black/[0.04]">
                  <ComposerCanvas
                    ref={composerRef}
                    shotDataUrl={shotDataUrl}
                    state={composer}
                  />
                </div>
              </div>

              <div className="order-2 flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-y-auto lg:order-2 lg:max-w-[400px] lg:min-w-[300px] lg:basis-auto lg:flex-none lg:pl-1">
                <ComposerControls
                  state={composer}
                  onChange={setComposer}
                  onExport={exportPng}
                  onBatchExport={batchExport}
                  onCopyImage={copyImage}
                  exporting={exporting}
                  hasShot={Boolean(shotDataUrl)}
                  exportPixelRatio={exportPixelRatio}
                  onExportPixelRatioChange={setExportPixelRatio}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onReset={() =>
                    replaceComposer(
                      getDefaultComposerStateForCapturePreset(viewportPreset),
                    )
                  }
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
