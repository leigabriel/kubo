"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { loadModelViewer } from "@/lib/model-viewer";
import { getDownloadUrl, getModelUrl } from "@/lib/storage";
import {
  DISC_MODEL_FILENAME,
  frameworks,
  getAiPrompt,
  getReadme,
  snippets,
  type FrameworkId,
} from "@/lib/disc-sleeve-snippets";

const discModel = getModelUrl(DISC_MODEL_FILENAME);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function buildZip(
  files: Array<{ name: string; data: Uint8Array | string }>,
  modelData?: ArrayBuffer | null,
  modelName = DISC_MODEL_FILENAME,
) {
  const encoder = new TextEncoder();
  const entries = files.map((f) => ({
    name: f.name,
    data: typeof f.data === "string" ? encoder.encode(f.data) : f.data,
  }));
  if (modelData) entries.push({ name: modelName, data: new Uint8Array(modelData) });

  const chunks: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const header = new DataView(new ArrayBuffer(30));
    header.setUint32(0, 0x04034b50, true);
    header.setUint16(4, 20, true);
    header.setUint16(6, 0, true);
    header.setUint16(8, 0, true);
    header.setUint32(14, crc, true);
    header.setUint32(18, entry.data.length, true);
    header.setUint32(22, entry.data.length, true);
    header.setUint16(26, nameBytes.length, true);
    header.setUint16(28, 0, true);
    chunks.push(new Uint8Array(header.buffer), nameBytes, entry.data);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(10, crc, true);
    central.setUint32(16, entry.data.length, true);
    central.setUint32(20, entry.data.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, offset, true);
    centrals.push(new Uint8Array(central.buffer), nameBytes);
    offset += 30 + nameBytes.length + entry.data.length;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const blob = new Blob([...chunks, ...centrals, new Uint8Array(end.buffer)] as BlobPart[], {
    type: "application/zip",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "kubo-disc-sleeve.zip";
  anchor.click();
  URL.revokeObjectURL(url);
}

type SelectedFile = FrameworkId | "readme" | "model";

function MonoFileIcon({ kind }: { kind: SelectedFile }) {
  const paths: Record<SelectedFile, React.ReactNode> = {
    html: (
      <>
        <path d="M6 3.5 2 8l4 4.5" />
        <path d="M10 3.5 14 8l-4 4.5" />
      </>
    ),
    react: (
      <>
        <path d="M5.5 3h-1A2 2 0 0 0 2.5 5v6" />
        <path d="M10.5 3h1a2 2 0 0 1 2 2v6" />
        <path d="M5.5 13h-1a2 2 0 0 1-2-2V8" />
        <path d="M10.5 13h1a2 2 0 0 0 2-2V5" />
      </>
    ),
    vue: <path d="M3 4l5 9 5-9" />,
    angular: (
      <>
        <path d="M8 3 12.5 13H3.5Z" />
        <path d="M5.8 9h4.4" />
      </>
    ),
    svelte: <path d="M10.5 4.2c-.7-1-3.6-1.2-4.4.2-.8 1.5.6 2.4 4 3.2 2.2.5 1.7 2.9.5 3.7-1.2 1-3.7.8-4.5-.5" />,
    readme: (
      <>
        <path d="M4 2.5h5l3 3v8H4z" />
        <path d="M9 2.5v3h3" />
        <path d="M5.8 8h4.4M5.8 10.2h4.4M5.8 12.4h2.8" />
      </>
    ),
    model: (
      <>
        <path d="M8 2.5 13 5.2v5.6L8 13.5 3 10.8V5.2Z" />
        <path d="M3 5.2l5 2.7 5-2.7M8 7.9v5.6" />
      </>
    ),
  };

  return (
    <svg
      className="mono-file-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}

function MonoFolderIcon() {
  return (
    <svg
      className="mono-file-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M2 3.5h4l1.5 2H14v7H2z" />
      <path d="M2 5.5h12" />
    </svg>
  );
}

const VS_KEYWORDS = new Set([
  "import", "export", "default", "function", "return", "const", "let", "from",
  "withDefaults", "defineProps", "component", "standalone", "new", "if", "else",
]);

function highlightLine(line: string, lineKey: number) {
  const tokens: React.ReactNode[] = [];
  const pattern = /(\/\/.*|<!--[\s\S]*?-->|#[^\n]*|`[^`]*`|'[^']*'|"[^"]*"|\b(?:import|export|default|function|return|const|let|from|withDefaults|defineProps|component|standalone|new|if|else)\b|\b\d+(?:\.\d+)?\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(line)) !== null) {
    if (m.index > last) {
      tokens.push(<span key={`${lineKey}-${key}`}>{line.slice(last, m.index)}</span>);
      key += 1;
    }
    const text = m[0];
    const isComment = text.startsWith("//") || text.startsWith("<!--") || text.startsWith("#");
    const isString = text.startsWith("'") || text.startsWith('"') || text.startsWith("`");
    const isNumber = /^\d/.test(text);
    const isKeyword = VS_KEYWORDS.has(text);
    tokens.push(
      <span
        key={`${lineKey}-${key}`}
        className={
          isComment
            ? "tok-cmt"
            : isString
              ? "tok-str"
              : isNumber
                ? "tok-num"
                : isKeyword
                  ? "tok-kw"
                  : undefined
        }
      >
        {text}
      </span>,
    );
    key += 1;
    last = m.index + text.length;
  }
  if (last < line.length) {
    tokens.push(<span key={`${lineKey}-${key}`}>{line.slice(last)}</span>);
  }
  if (tokens.length === 0) tokens.push(<span> </span>);
  return tokens;
}

export function DiscSleeve() {
  const [framework, setFramework] = useState<FrameworkId>("react");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [sleeveOpen, setSleeveOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [primaryW, setPrimaryW] = useState(260);
  const [secondaryW, setSecondaryW] = useState(320);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Ready");
  const [zipBusy, setZipBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const mapDrag = useRef(false);
  const [mapView, setMapView] = useState({ top: 0, height: 0.25 });
  const lenis = useLenis(() => {}, []);

  useEffect(() => {
    loadModelViewer().catch((error) => {
      console.error("Model viewer failed to load", error);
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setPanelOpen((open) => !open);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const sync = () => {
      const total = el.scrollHeight;
      const visible = el.clientHeight;
      const viewHeight = total > 0 ? visible / total : 1;
      setMapView({
        top: total > 0 ? el.scrollTop / total : 0,
        height: Math.min(1, Math.max(0.06, viewHeight)),
      });
    };
    el.scrollTop = 0;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [selectedFile]);

  function startResize(kind: "primary" | "secondary") {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startPrimary = primaryW;
      const startSecondary = secondaryW;
      function onMove(move: PointerEvent) {
        const dx = move.clientX - startX;
        if (kind === "primary") {
          setPrimaryW(Math.min(420, Math.max(180, startPrimary + dx)));
        } else {
          setSecondaryW(Math.min(560, Math.max(240, startSecondary - dx)));
        }
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
  }

  function mapToFraction(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.height <= 0) return;
    const fraction = (event.clientY - rect.top) / rect.height;
    const clamped = Math.min(1, Math.max(0, fraction - mapView.height / 2));
    const el = editorRef.current;
    if (el) el.scrollTop = clamped * el.scrollHeight;
  }

  const active = frameworks.find((f) => f.id === framework) ?? frameworks[0];
  const code = snippets[framework];

  const selectedMeta =
    selectedFile === "readme"
      ? { filename: "README.md", language: "markdown", label: "README" }
      : selectedFile === "model"
        ? { filename: DISC_MODEL_FILENAME, language: "glb", label: "Model" }
        : selectedFile === null
          ? { filename: "", language: "", label: "" }
          : {
              filename: active.filename,
              language: active.language,
              label: active.label,
            };

  const editorContent =
    selectedFile === "readme"
      ? getReadme(discModel)
      : selectedFile === "model"
        ? `Kubo Disc Sleeve — model asset\n\nFile: ${DISC_MODEL_FILENAME}\nDownload: ${getDownloadUrl(discModel, DISC_MODEL_FILENAME)}\n\nDrag to orbit in the Preview pane.\nUse Download model (.glb) below to save the file.`
        : selectedFile === null
          ? ""
          : code;

  function selectFile(id: SelectedFile) {
    setSelectedFile(id);
    setComponentsOpen(true);
    setSleeveOpen(true);
    if (id !== "readme" && id !== "model") setFramework(id);
    if (id === "model") setPreviewOpen(true);
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      setStatus(`${label} copy failed — select and copy manually`);
    }
  }

  function downloadText(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${filename}`);
  }

  function downloadModel() {
    const url = getDownloadUrl(discModel, DISC_MODEL_FILENAME);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = DISC_MODEL_FILENAME;
    anchor.click();
    setStatus(`Downloaded ${DISC_MODEL_FILENAME}`);
  }

  async function downloadZip() {
    setZipBusy(true);
    setStatus("Building ZIP…");
    lenis?.stop();
    try {
      let modelData: ArrayBuffer | null = null;
      try {
        const res = await fetch(discModel);
        if (res.ok) modelData = await res.arrayBuffer();
      } catch {
        modelData = null;
      }
      await buildZip(
        [
          { name: "README.md", data: getReadme(discModel) },
          { name: "model.txt", data: `Model: ${DISC_MODEL_FILENAME}\nDownload: ${getDownloadUrl(discModel, DISC_MODEL_FILENAME)}\n` },
          ...frameworks.map((f) => ({ name: f.filename, data: snippets[f.id] })),
        ],
        modelData,
      );
      setStatus(modelData ? "ZIP downloaded (model included)" : "ZIP downloaded (model URL in README)");
    } catch {
      setStatus("ZIP failed — use per-file downloads");
    } finally {
      setZipBusy(false);
      lenis?.start();
    }
  }

  const lineCount = editorContent.split("\n").length;
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (name: string) =>
    !normalizedQuery || name.toLowerCase().includes(normalizedQuery);
  const visibleFrameworks = frameworks.filter((f) => matchesQuery(f.filename));
  const readmeVisible = matchesQuery("README.md");
  const modelVisible = matchesQuery(DISC_MODEL_FILENAME);
  const anyFileVisible =
    visibleFrameworks.length > 0 || readmeVisible || modelVisible;

  const allFiles: Array<{ id: SelectedFile; filename: string; label: string }> = [
    ...frameworks.map((f) => ({ id: f.id as SelectedFile, filename: f.filename, label: f.label })),
    { id: "readme" as SelectedFile, filename: "README.md", label: "MD" },
    { id: "model" as SelectedFile, filename: DISC_MODEL_FILENAME, label: "GLB" },
  ];

  return (
    <div className="disc-sleeve">
      <section className="components-studio" aria-label="Kubo Components workspace">
        <div className="components-titlebar">
          <p className="components-workspace-title">Kubo.Archive</p>
          <p className="components-title">Components</p>
          <div className="components-titlebar-right">
            <button
              type="button"
              className="components-preview-toggle"
              onClick={() => setPanelOpen((open) => !open)}
              aria-pressed={panelOpen}
              title="Toggle Terminal (Ctrl+J)"
            >
              Terminal
            </button>
            <button
              type="button"
              className="components-preview-toggle"
              onClick={() => setPreviewOpen((open) => !open)}
              aria-pressed={previewOpen}
              title="Toggle Preview pane"
            >
              Preview
            </button>
            <Link
              href="/"
              className="components-close"
              title="Close — back to Home"
              aria-label="Close and return to Home"
            >
              <span aria-hidden="true">✕</span>
            </Link>
          </div>
        </div>

        <div
          className={`components-body${previewOpen ? " has-secondary" : " no-secondary"}`}
          style={
            {
              "--primary-w": `${primaryW}px`,
              "--secondary-w": `${secondaryW}px`,
            } as React.CSSProperties
          }
        >
          <aside
            className="components-explorer"
            aria-label="Explorer"
            data-lenis-prevent
          >
            <div className="components-explorer-head">
              <p className="components-explorer-title">Explorer</p>
            </div>

            <label className="components-search">
              <span className="sr-only">Filter files</span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter files…"
              />
            </label>

            <button
              type="button"
              className="components-folder"
              onClick={() => setComponentsOpen((open) => !open)}
              aria-expanded={componentsOpen}
              aria-controls="components-sleeve-folder"
            >
              <span className="components-chevron" aria-hidden="true">
                {componentsOpen ? "▾" : "›"}
              </span>
              <MonoFolderIcon />
              <span className="components-folder-name">Components</span>
            </button>

            {componentsOpen ? (
              <ul className="components-tree" id="components-sleeve-folder">
                <li>
                  <button
                    type="button"
                    className="components-folder components-folder-sub"
                    onClick={() => setSleeveOpen((open) => !open)}
                    aria-expanded={sleeveOpen}
                    aria-controls="disksleeve-files"
                  >
                    <span className="components-chevron" aria-hidden="true">
                      {sleeveOpen ? "▾" : "›"}
                    </span>
                    <MonoFolderIcon />
                    <span className="components-folder-name">disc-sleeve</span>
                    <span className="components-folder-count">
                      {frameworks.length + 2}
                    </span>
                  </button>

                  {sleeveOpen ? (
                    <ul className="components-files" id="disksleeve-files">
                      {visibleFrameworks.map((f) => {
                        const isActive = selectedFile === f.id;
                        return (
                          <li key={f.id}>
                            <button
                              type="button"
                              className={`components-file${isActive ? " is-active" : ""}`}
                              onClick={() => selectFile(f.id)}
                              aria-current={isActive ? "true" : undefined}
                              title={`${f.filename} — ${f.label}`}
                            >
                              <MonoFileIcon kind={f.id} />
                              <span className="components-file-name">
                                {f.filename}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {readmeVisible ? (
                        <li>
                          <button
                            type="button"
                            className={`components-file${selectedFile === "readme" ? " is-active" : ""}`}
                            onClick={() => selectFile("readme")}
                            aria-current={
                              selectedFile === "readme" ? "true" : undefined
                            }
                            title="README.md — Guide"
                          >
                            <MonoFileIcon kind="readme" />
                            <span className="components-file-name">README.md</span>
                          </button>
                        </li>
                      ) : null}
                      {modelVisible ? (
                        <li>
                          <button
                            type="button"
                            className={`components-file${selectedFile === "model" ? " is-active" : ""}`}
                            onClick={() => selectFile("model")}
                            aria-current={
                              selectedFile === "model" ? "true" : undefined
                            }
                            title={`${DISC_MODEL_FILENAME} — Model`}
                          >
                            <MonoFileIcon kind="model" />
                            <span className="components-file-name">
                              {DISC_MODEL_FILENAME}
                            </span>
                          </button>
                        </li>
                      ) : null}
                      {!anyFileVisible ? (
                        <li className="components-empty">No files match</li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              </ul>
            ) : null}

          </aside>

          <div
            className="components-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Explorer"
            onPointerDown={startResize("primary")}
          />

          <div className="components-main">
            {selectedFile !== null ? (
              <div className="components-breadcrumbs">
                <p className="components-breadcrumb-text">
                  <span>components</span>
                  <span aria-hidden="true">›</span>
                  <span>disc-sleeve</span>
                  <span aria-hidden="true">›</span>
                  <span className="components-breadcrumb-current">
                    {selectedMeta.filename}
                  </span>
                </p>
                <div className="components-breadcrumb-actions">
                  <p className="components-breadcrumb-meta">
                    {selectedMeta.language} · {lineCount} lines
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyText(editorContent, "Code")}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectedFile === "model"
                        ? downloadModel()
                        : downloadText(editorContent, selectedMeta.filename)
                    }
                  >
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="components-breadcrumbs">
                <p className="components-breadcrumb-text">
                  <span className="components-breadcrumb-current">No file open</span>
                </p>
              </div>
            )}

            {selectedFile === null ? (
              <div className="components-editor-empty">
                <p className="components-editor-empty-title">No file open</p>
                <p className="components-editor-empty-hint">
                  Select a file in Explorer to begin editing.
                </p>
              </div>
            ) : (
            <div className="components-editor-row">
              <div
                className="components-editor"
                role="tabpanel"
                ref={editorRef}
                tabIndex={0}
                aria-label={`${selectedMeta.filename} editor`}
                data-lenis-prevent
              >
                <pre className="vscode-code">
                  {editorContent.split("\n").map((line, index) => (
                    <span className="vscode-code-line" key={index}>
                      <span className="vscode-line-no" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="vscode-line-text">
                        {highlightLine(line, index)}
                      </span>
                    </span>
                  ))}
                </pre>
              </div>
              <div
                className="components-minimap"
                aria-hidden="true"
                onPointerDown={(event) => {
                  mapDrag.current = true;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  mapToFraction(event);
                }}
                onPointerMove={(event) => {
                  if (mapDrag.current) mapToFraction(event);
                }}
                onPointerUp={() => {
                  mapDrag.current = false;
                }}
                onPointerCancel={() => {
                  mapDrag.current = false;
                }}
              >
                <span
                  className="components-minimap-viewport"
                  style={{
                    top: `${mapView.top * 100}%`,
                    height: `${mapView.height * 100}%`,
                  }}
                />
                {editorContent.split("\n").map((line, index) => (
                  <i
                    key={index}
                    style={{
                      width: `${Math.min(100, Math.max(14, line.length * 1.4))}%`,
                      opacity: 0.18 + (index % 5) * 0.06,
                    }}
                  />
                ))}
              </div>
            </div>
            )}

            {panelOpen ? (
              <section className="components-panel" aria-label="Terminal panel">
                <div className="components-panel-head">
                  <p className="components-panel-title">Terminal</p>
                  <button
                    type="button"
                    className="components-panel-collapse"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Hide terminal (Ctrl+J)"
                  >
                    ▾
                  </button>
                </div>

                <div
                  className="components-terminal"
                  role="log"
                  aria-live="polite"
                  data-lenis-prevent
                >
                  <p className="components-terminal-line">
                    <span className="components-prompt">~/kubo-components</span>
                  </p>
                  <p className="components-terminal-line">
                    <span className="components-prompt">~/kubo-components</span>
                    <span>{status}</span>
                  </p>
                  <p className="components-terminal-line components-terminal-hint">
                    Select a file in COMPONENTS
                  </p>
                  <div className="components-terminal-actions">
                    <button type="button" onClick={downloadModel}>
                      .glb
                    </button>
                    <button
                      type="button"
                      disabled={zipBusy}
                      onClick={() => void downloadZip()}
                    >
                      {zipBusy ? "Building…" : "ZIP"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void copyText(
                          getAiPrompt(discModel, framework),
                          "AI prompt",
                        )
                      }
                    >
                      AI
                    </button>
                    <a
                      href="/models/kubo-disc-sleeve.html"
                      download="kubo-disc-sleeve.html"
                    >
                      HTML
                    </a>
                  </div>
                </div>
              </section>
            ) : null}

          </div>

          <div
            className="components-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Preview"
            onPointerDown={startResize("secondary")}
          />

          {previewOpen ? (
            <aside
              className="components-secondary"
              aria-label="Preview"
              data-secondary="open"
            >
              <div className="components-secondary-head">
                <p>Preview</p>
                <button
                  type="button"
                  className="components-panel-collapse"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Hide Preview pane"
                >
                  ×
                </button>
              </div>
              <div className="components-preview" data-lenis-prevent>
                <model-viewer
                  src={discModel}
                  alt="Kubo disc sleeve"
                  camera-orbit="0deg 90deg auto"
                  field-of-view="30deg"
                  camera-controls
                  disable-zoom
                  auto-rotate
                  auto-rotate-delay="1200"
                  rotation-per-second="10deg"
                  interaction-prompt="none"
                  shadow-intensity="0.7"
                  shadow-softness="1"
                  exposure="1.05"
                  tone-mapping="aces"
                  environment-image="neutral"
                  loading="lazy"
                />
                <p className="components-preview-note">
                  Drag to orbit · Kubo Disc Sleeve
                </p>
              </div>
            </aside>
          ) : null}
        </div>

        <div className="components-statusbar">
          <p className="components-status-left">Main</p>
          <p className="components-status-right">
            Total components: {allFiles.length}
          </p>
        </div>
      </section>
    </div>
  );
}
