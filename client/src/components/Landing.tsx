type ViewportPreset = "desktop" | "mobile";

type LandingProps = {
  url: string;
  onUrlChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  viewportPreset: ViewportPreset;
  onViewportPresetChange: (v: ViewportPreset) => void;
};

export function Landing({
  url,
  onUrlChange,
  onSubmit,
  loading,
  error,
  viewportPreset,
  onViewportPresetChange,
}: LandingProps) {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-neutral-900">
        Turn any page into a shareable image
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Paste a URL, pick desktop or mobile, then capture. On the next screen
        you can tune the frame and export PNG.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <span className="text-xs font-medium text-neutral-500">Viewport</span>
          <div className="mt-2 flex rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm">
            {(
              [
                ["desktop", "Desktop"],
                ["mobile", "Mobile"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onViewportPresetChange(id)}
                className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition ${
                  viewportPreset === id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="url" className="sr-only">
            Page URL
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              name="url"
              autoComplete="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading || !url.trim()}
              className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Capturing…" : "Capture"}
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
