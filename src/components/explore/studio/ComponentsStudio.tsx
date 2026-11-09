"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { DISC_MODEL_FILENAME, frameworks, getAiPrompt, getReadme, snippets } from "@/lib/disc-sleeve-snippets";
import { getDownloadUrl } from "@/lib/storage";
import { Explorer } from "./Explorer";
import { EditorPane, type Cursor } from "./EditorPane";
import { ModelPreview } from "./ModelPreview";
import { QuickOpen, type StudioCommand } from "./QuickOpen";
import { Splitter } from "./Splitter";
import { Terminal, type TerminalActions } from "./Terminal";
import {
  BranchIcon,
  ChevronIcon,
  CloseIcon,
  CollapseAllIcon,
  CubeIcon,
  DownloadIcon,
  ExplorerIcon,
  GlobeIcon,
  PanelIcon,
  SearchIcon,
  SecondaryIcon,
  SidebarIcon,
  SparkleIcon,
  TerminalIcon,
  ZipIcon,
} from "./icons";
import {
  COMPONENT_COUNT,
  DISC_MODEL_URL,
  getAncestorFolderIds,
  getFile,
  getFileText,
  getStandaloneHtml,
  studioFiles,
  studioTree,
  type StudioFileId,
} from "./files";
import { copyToClipboard, downloadBlob, downloadText, downloadUrl } from "./download";
import { createZip } from "./zip";

const DEFAULT_SIDEBAR = 260;
const DEFAULT_PREVIEW = 340;
const DEFAULT_PANEL = 200;
const DEFAULT_FOLDERS = ["components", "components/disc-sleeve"];
const STATUS_IDLE = "Ready";

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Guards against overlapping ZIP builds (the studio is a single page instance).
let zipInFlight = false;
let statusTimer: number | undefined;

const subscribeNever = () => () => {};
const isApplePlatform = () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

export function ComponentsStudio() {
  const isMobile = useMediaQuery("(max-width: 700px)");
  const isMac = useSyncExternalStore(subscribeNever, isApplePlatform, () => false);
  const mod = isMac ? "⌘" : "Ctrl+";

  const [openTabs, setOpenTabs] = useState<StudioFileId[]>(["react"]);
  const [activeId, setActiveId] = useState<StudioFileId | null>("react");
  const [expanded, setExpanded] = useState(() => new Set(DEFAULT_FOLDERS));
  const [treeOpen, setTreeOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  // null = follow the viewport default (open on desktop, closed on mobile)
  const [sidebarPref, setSidebarPref] = useState<boolean | null>(null);
  const [previewPref, setPreviewPref] = useState<boolean | null>(null);
  const [panelPref, setPanelPref] = useState<boolean | null>(null);
  const sidebarOpen = sidebarPref ?? !isMobile;
  const previewOpen = previewPref ?? !isMobile;
  const panelOpen = panelPref ?? !isMobile;

  const [sidebarW, setSidebarW] = useState(DEFAULT_SIDEBAR);
  const [previewW, setPreviewW] = useState(DEFAULT_PREVIEW);
  const [panelH, setPanelH] = useState(DEFAULT_PANEL);

  const [wrap, setWrap] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findToken, setFindToken] = useState(0);
  const [cursor, setCursor] = useState<Cursor>({ line: 1, col: 1, selected: 0 });
  const [quick, setQuick] = useState<{ query: string; token: number } | null>(null);
  const [status, setStatus] = useState(STATUS_IDLE);
  const [zipBusy, setZipBusy] = useState(false);


  useEffect(() => () => window.clearTimeout(statusTimer), []);

  const flash = useCallback((message: string) => {
    window.clearTimeout(statusTimer);
    setStatus(message);
    statusTimer = window.setTimeout(() => setStatus(STATUS_IDLE), 4000);
    return message;
  }, []);

  const onCursorChange = useCallback((next: Cursor) => {
    setCursor((prev) =>
      prev.line === next.line && prev.col === next.col && prev.selected === next.selected
        ? prev
        : next,
    );
  }, []);

  /* ───────────── file / tab actions ───────────── */

  const openFile = useCallback((id: StudioFileId) => {
    setOpenTabs((tabs) => (tabs.includes(id) ? tabs : [...tabs, id]));
    setActiveId(id);
    setCursor({ line: 1, col: 1, selected: 0 });
    setExpanded((current) => {
      const next = new Set(current);
      getAncestorFolderIds(id).forEach((folder) => next.add(folder));
      return next;
    });
    if (id === "model") setPreviewPref(true);
  }, []);

  const closeTab = useCallback(
    (id: StudioFileId) => {
      const index = openTabs.indexOf(id);
      if (index === -1) return;
      const remaining = openTabs.filter((tab) => tab !== id);
      setOpenTabs(remaining);
      if (activeId === id) {
        const next = remaining[Math.min(index, remaining.length - 1)] ?? null;
        setActiveId(next);
        setCursor({ line: 1, col: 1, selected: 0 });
      }
    },
    [openTabs, activeId],
  );

  const toggleFolder = useCallback((folderId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  /* ───────────── downloads / clipboard ───────────── */

  const copyText = useCallback(
    async (text: string, label: string) =>
      flash((await copyToClipboard(text)) ? `${label} copied` : `${label}: copy failed — select and copy manually`),
    [flash],
  );

  const actions = useMemo<TerminalActions>(
    () => ({
      downloadGlb() {
        downloadUrl(getDownloadUrl(DISC_MODEL_URL, DISC_MODEL_FILENAME), DISC_MODEL_FILENAME);
        return flash(`Downloading ${DISC_MODEL_FILENAME}`);
      },
      async downloadZip() {
        if (zipInFlight) return "ZIP already building…";
        zipInFlight = true;
        setZipBusy(true);
        setStatus("Building ZIP…");
        try {
          let model: Uint8Array | null = null;
          try {
            const response = await fetch(DISC_MODEL_URL);
            if (response.ok) model = new Uint8Array(await response.arrayBuffer());
          } catch {
            model = null;
          }
          const blob = createZip([
            { name: "README.md", data: getReadme(DISC_MODEL_URL) },
            ...frameworks.map((framework) => ({
              name: framework.filename,
              data: snippets[framework.id],
            })),
            model
              ? { name: DISC_MODEL_FILENAME, data: model }
              : {
                  name: "model.txt",
                  data: `Model: ${DISC_MODEL_FILENAME}\nDownload: ${getDownloadUrl(DISC_MODEL_URL, DISC_MODEL_FILENAME)}\n`,
                },
          ]);
          downloadBlob(blob, "kubo-disc-sleeve.zip");
          return flash(
            model ? "ZIP downloaded (model included)" : "ZIP downloaded (model URL in model.txt)",
          );
        } catch {
          return flash("ZIP failed — use per-file downloads");
        } finally {
          zipInFlight = false;
          setZipBusy(false);
        }
      },
      downloadHtml() {
        downloadText(getStandaloneHtml(window.location.origin), "kubo-disc-sleeve.html");
        return flash("Downloaded kubo-disc-sleeve.html");
      },
      async copyAi() {
        const framework = activeId && activeId !== "readme" && activeId !== "model" ? activeId : "react";
        return copyText(getAiPrompt(DISC_MODEL_URL, framework), "AI prompt");
      },
      copyFile: (id) => copyText(getFileText(id), getFile(id).name),
      downloadFile(id) {
        const file = getFile(id);
        downloadText(getFileText(id), file.name);
        return flash(`Downloaded ${file.name}`);
      },
    }),
    [activeId, copyText, flash],
  );

  /* ───────────── layout toggles ───────────── */

  const toggleSidebar = useCallback(() => setSidebarPref(!sidebarOpen), [sidebarOpen]);
  const togglePreview = useCallback(() => setPreviewPref(!previewOpen), [previewOpen]);
  const togglePanel = useCallback(() => setPanelPref(!panelOpen), [panelOpen]);

  const activeFile = activeId ? getFile(activeId) : null;
  const canFind = Boolean(activeFile && !activeFile.binary);

  const openFind = useCallback(() => {
    if (!canFind) return;
    setFindOpen(true);
    setFindToken((token) => token + 1);
  }, [canFind]);

  const openQuick = useCallback((query: string) => {
    setQuick((current) => ({ query, token: (current?.token ?? 0) + 1 }));
  }, []);

  /* ───────────── keyboard shortcuts ───────────── */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (event.key === "F1" || (meta && event.shiftKey && key === "p")) {
        event.preventDefault();
        openQuick(">");
      } else if (meta && !event.shiftKey && (key === "k" || key === "p")) {
        event.preventDefault();
        openQuick("");
      } else if (meta && !event.shiftKey && key === "j") {
        event.preventDefault();
        togglePanel();
      } else if (meta && !event.shiftKey && key === "b") {
        event.preventDefault();
        toggleSidebar();
      } else if (meta && !event.shiftKey && key === "f" && canFind) {
        event.preventDefault();
        openFind();
      } else if (event.altKey && key === "z") {
        event.preventDefault();
        setWrap((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canFind, openFind, openQuick, togglePanel, toggleSidebar]);

  /* ───────────── command palette ───────────── */

  const commands = useMemo<StudioCommand[]>(() => {
    const list: StudioCommand[] = [
      { id: "toggle-terminal", label: "View: Toggle Terminal", shortcut: `${mod}J`, run: togglePanel },
      { id: "toggle-sidebar", label: "View: Toggle Explorer", shortcut: `${mod}B`, run: toggleSidebar },
      { id: "toggle-preview", label: "View: Toggle 3D Preview", run: togglePreview },
      { id: "toggle-wrap", label: "View: Toggle Word Wrap", shortcut: "Alt+Z", run: () => setWrap((value) => !value) },
      {
        id: "collapse",
        label: "Explorer: Collapse Folders",
        run: () => setExpanded(new Set()),
      },
      { id: "zip", label: "Kubo: Download ZIP", run: () => void actions.downloadZip() },
      { id: "glb", label: "Kubo: Download .glb Model", run: () => actions.downloadGlb() },
      { id: "html", label: "Kubo: Download Standalone HTML", run: () => actions.downloadHtml() },
      { id: "ai", label: "Kubo: Copy AI Prompt", run: () => void actions.copyAi() },
    ];
    if (canFind) {
      list.unshift({ id: "find", label: "Find in File", shortcut: `${mod}F`, run: openFind });
    }
    if (activeId && !getFile(activeId).binary) {
      list.push(
        { id: "copy-file", label: "File: Copy Contents", run: () => void actions.copyFile(activeId) },
        { id: "download-file", label: "File: Download Current File", run: () => actions.downloadFile(activeId) },
      );
    }
    if (activeId) {
      list.push({ id: "close-tab", label: "View: Close Active Editor", run: () => closeTab(activeId) });
    }
    return list;
  }, [actions, activeId, canFind, closeTab, mod, openFind, togglePanel, togglePreview, toggleSidebar]);

  const activeLine = activeFile && !activeFile.binary ? cursor.line : 0;
  const quickHint = `${mod}K`;

  return (
    <div
      className="studio"
      data-lenis-prevent
      style={
        {
          "--sidebar-w": `${sidebarW}px`,
          "--preview-w": `${previewW}px`,
          "--panel-h": `${panelH}px`,
        } as React.CSSProperties
      }
    >
      <header className="vs-titlebar">
        <div className="vs-title-left">
          <span className="vs-brand">Kubo.Archive</span>
        </div>

        <button
          type="button"
          className="vs-command-center"
          onClick={() => openQuick("")}
          aria-label={`Quick open (${quickHint})`}
          title={`Quick open (${quickHint})`}
        >
          <SearchIcon size={14} />
          <span className="vs-command-label">kubo-components</span>
          <kbd>{quickHint}</kbd>
        </button>

        <div className="vs-title-right">
          <button
            type="button"
            className="vs-icon-btn"
            aria-pressed={sidebarOpen}
            aria-label={`Toggle explorer (${mod}B)`}
            title={`Toggle explorer (${mod}B)`}
            onClick={toggleSidebar}
          >
            <SidebarIcon filled={sidebarOpen} />
          </button>
          <button
            type="button"
            className="vs-icon-btn"
            aria-pressed={panelOpen}
            aria-label={`Toggle terminal (${mod}J)`}
            title={`Toggle terminal (${mod}J)`}
            onClick={togglePanel}
          >
            <PanelIcon filled={panelOpen} />
          </button>
          <button
            type="button"
            className="vs-icon-btn"
            aria-pressed={previewOpen}
            aria-label="Toggle 3D preview"
            title="Toggle 3D preview"
            onClick={togglePreview}
          >
            <SecondaryIcon filled={previewOpen} />
          </button>
          <Link
            href="/"
            className="vs-window-close"
            title="Close — back to Home"
            aria-label="Close and return to Home"
          >
            <CloseIcon />
          </Link>
        </div>
      </header>

      <div className="vs-workbench">
        <nav className="vs-activitybar" aria-label="Activity bar">
          <button
            type="button"
            className="vs-activity"
            aria-pressed={sidebarOpen}
            aria-label={`Explorer (${mod}B)`}
            title={`Explorer (${mod}B)`}
            onClick={toggleSidebar}
          >
            <ExplorerIcon />
          </button>
          <button
            type="button"
            className="vs-activity"
            aria-label={`Quick open (${quickHint})`}
            title={`Quick open (${quickHint})`}
            onClick={() => openQuick("")}
          >
            <SearchIcon size={22} />
          </button>
          <button
            type="button"
            className="vs-activity"
            aria-pressed={previewOpen}
            aria-label="3D preview"
            title="3D preview"
            onClick={togglePreview}
          >
            <CubeIcon size={22} />
          </button>
          <button
            type="button"
            className="vs-activity"
            aria-pressed={panelOpen}
            aria-label={`Terminal (${mod}J)`}
            title={`Terminal (${mod}J)`}
            onClick={togglePanel}
          >
            <TerminalIcon size={22} />
          </button>
        </nav>

        {sidebarOpen ? (
          <>
            <aside className="vs-sidebar" aria-label="Explorer">
              <div className="vs-pane-head">
                <h2 className="vs-pane-title">Explorer</h2>
              </div>

              <div className="vs-section">
                <div className="vs-section-head">
                  <button
                    type="button"
                    className="vs-section-toggle"
                    aria-expanded={treeOpen}
                    onClick={() => setTreeOpen((value) => !value)}
                  >
                    <ChevronIcon open={treeOpen} />
                    <span>kubo-components</span>
                  </button>
                  <button
                    type="button"
                    className="vs-icon-btn"
                    aria-label="Collapse folders"
                    title="Collapse folders"
                    onClick={() => setExpanded(new Set())}
                  >
                    <CollapseAllIcon />
                  </button>
                </div>
                {treeOpen ? (
                  <Explorer
                    tree={studioTree}
                    expanded={expanded}
                    activeId={activeId}
                    onToggleFolder={toggleFolder}
                    onOpenFile={(id) => {
                      openFile(id);
                      if (isMobile) setSidebarPref(false);
                    }}
                  />
                ) : null}
              </div>

              <div className="vs-section vs-section--actions">
                <div className="vs-section-head">
                  <button
                    type="button"
                    className="vs-section-toggle"
                    aria-expanded={actionsOpen}
                    onClick={() => setActionsOpen((value) => !value)}
                  >
                    <ChevronIcon open={actionsOpen} />
                    <span>Actions</span>
                  </button>
                </div>
                {actionsOpen ? (
                  <ul className="vs-actions">
                    <li>
                      <button type="button" onClick={() => void actions.downloadZip()} disabled={zipBusy}>
                        <ZipIcon />
                        {zipBusy ? "Building ZIP…" : "Download ZIP"}
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => actions.downloadGlb()}>
                        <DownloadIcon />
                        Download .glb model
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => actions.downloadHtml()}>
                        <GlobeIcon />
                        Download standalone HTML
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => void actions.copyAi()}>
                        <SparkleIcon />
                        Copy AI prompt
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>
            </aside>
            {!isMobile ? (
              <Splitter
                orientation="vertical"
                label="Resize explorer"
                value={sidebarW}
                min={180}
                max={420}
                onChange={setSidebarW}
                onReset={() => setSidebarW(DEFAULT_SIDEBAR)}
              />
            ) : null}
          </>
        ) : null}

        <div className="vs-main">
          <div className="vs-editor-col">
            <EditorPane
              openTabs={openTabs}
              activeId={activeId}
              wrap={wrap}
              activeLine={activeLine}
              findOpen={findOpen && canFind}
              findToken={findToken}
              mod={mod}
              onSelectTab={(id) => {
                setActiveId(id);
                setCursor({ line: 1, col: 1, selected: 0 });
              }}
              onCloseTab={closeTab}
              onToggleWrap={() => setWrap((value) => !value)}
              onCursorChange={onCursorChange}
              onCloseFind={() => setFindOpen(false)}
              onCopy={() => activeId && void actions.copyFile(activeId)}
              onDownload={() => {
                if (!activeId) return;
                if (getFile(activeId).binary) actions.downloadGlb();
                else actions.downloadFile(activeId);
              }}
              onShowPreview={() => setPreviewPref(true)}
              onDownloadModel={() => actions.downloadGlb()}
            />
          </div>

          {panelOpen && !isMobile ? (
            <Splitter
              orientation="horizontal"
              label="Resize terminal"
              value={panelH}
              min={90}
              max={460}
              invert
              onChange={setPanelH}
              onReset={() => setPanelH(DEFAULT_PANEL)}
            />
          ) : null}
          <Terminal
            open={panelOpen}
            actions={actions}
            onOpenFile={openFile}
            onClose={() => setPanelPref(false)}
          />
        </div>

        {previewOpen ? (
          <>
            {!isMobile ? (
              <Splitter
                orientation="vertical"
                label="Resize preview"
                value={previewW}
                min={240}
                max={640}
                invert
                onChange={setPreviewW}
                onReset={() => setPreviewW(DEFAULT_PREVIEW)}
              />
            ) : null}
            <aside className="vs-secondary" aria-label="3D preview">
              <ModelPreview
                src={DISC_MODEL_URL}
                onDownload={() => actions.downloadGlb()}
                onClose={() => setPreviewPref(false)}
              />
            </aside>
          </>
        ) : null}
      </div>

      <footer className="vs-statusbar">
        <div className="vs-status-group">
          <span className="vs-status-item" title="Branch">
            <BranchIcon size={14} />
            main
          </span>
          <span className="vs-status-item vs-status-message" role="status">
            {status}
          </span>
        </div>
        <div className="vs-status-group">
          {activeFile && !activeFile.binary ? (
            <>
              <span className="vs-status-item">
                Ln {cursor.line}, Col {cursor.col}
                {cursor.selected > 0 ? ` (${cursor.selected} selected)` : ""}
              </span>
              <span className="vs-status-item vs-status-optional">Spaces: 2</span>
              <span className="vs-status-item vs-status-optional">UTF-8</span>
              <span className="vs-status-item vs-status-optional">LF</span>
            </>
          ) : null}
          {activeFile ? <span className="vs-status-item">{activeFile.label}</span> : null}
          <span className="vs-status-item vs-status-optional">
            {COMPONENT_COUNT} component · {studioFiles.length} files
          </span>
        </div>
      </footer>

      {quick ? (
        <QuickOpen
          key={quick.token}
          initialQuery={quick.query}
          files={studioFiles}
          commands={commands}
          onClose={() => setQuick(null)}
          onOpenFile={openFile}
        />
      ) : null}
    </div>
  );
}
