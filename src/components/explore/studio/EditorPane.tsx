"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ChevronIcon,
  CloseIcon,
  CopyIcon,
  CubeIcon,
  DownloadIcon,
  FileIcon,
  WrapIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "./icons";
import { ModelPreview } from "./ModelPreview";
import {
  getBreadcrumbs,
  getFile,
  getFileText,
  type StudioFile,
  type StudioFileId,
} from "./files";
import { highlight, type Token } from "./highlight";

export type Cursor = { line: number; col: number; selected: number };

type Match = { line: number; start: number; end: number };
type LineRange = { start: number; end: number; current: boolean };

const MAX_MATCHES = 1000;

function findMatches(lines: string[], query: string, matchCase: boolean) {
  if (!query) return [];
  const needle = matchCase ? query : query.toLowerCase();
  const matches: Match[] = [];
  for (let i = 0; i < lines.length && matches.length < MAX_MATCHES; i++) {
    const haystack = matchCase ? lines[i] : lines[i].toLowerCase();
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      matches.push({ line: i, start: at, end: at + needle.length });
      from = at + needle.length;
    }
  }
  return matches;
}

function renderTokens(tokens: Token[], ranges: LineRange[]): ReactNode[] {
  const className = (token: Token) => (token.cls ? `tok-${token.cls}` : undefined);
  if (ranges.length === 0) {
    return tokens.map((token, i) => (
      <span key={i} className={className(token)}>
        {token.text}
      </span>
    ));
  }

  const out: ReactNode[] = [];
  let offset = 0;
  let key = 0;
  for (const token of tokens) {
    const tokenEnd = offset + token.text.length;
    let cursor = offset;
    for (const range of ranges) {
      if (range.end <= cursor || range.start >= tokenEnd) continue;
      const from = Math.max(range.start, cursor);
      const to = Math.min(range.end, tokenEnd);
      if (from > cursor) {
        out.push(
          <span key={key++} className={className(token)}>
            {token.text.slice(cursor - offset, from - offset)}
          </span>,
        );
      }
      out.push(
        <mark
          key={key++}
          className={`vs-match${range.current ? " is-current" : ""} ${className(token) ?? ""}`}
        >
          {token.text.slice(from - offset, to - offset)}
        </mark>,
      );
      cursor = to;
    }
    if (cursor < tokenEnd) {
      out.push(
        <span key={key++} className={className(token)}>
          {token.text.slice(cursor - offset)}
        </span>,
      );
    }
    offset = tokenEnd;
  }
  return out;
}

/* ───────────────────────────── Tabs ───────────────────────────── */

function TabBar({
  openTabs,
  activeId,
  onSelect,
  onClose,
}: {
  openTabs: StudioFileId[];
  activeId: StudioFileId | null;
  onSelect: (id: StudioFileId) => void;
  onClose: (id: StudioFileId) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<StudioFileId, HTMLDivElement>());

  useEffect(() => {
    const bar = barRef.current;
    const tab = activeId ? tabRefs.current.get(activeId) : undefined;
    if (!bar || !tab) return;
    if (tab.offsetLeft < bar.scrollLeft) bar.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = tab.offsetLeft + tab.offsetWidth - bar.clientWidth;
    }
  }, [activeId, openTabs.length]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const move = (next: number) => {
      const id = openTabs[(next + openTabs.length) % openTabs.length];
      onSelect(id);
      requestAnimationFrame(() => tabRefs.current.get(id)?.focus());
    };
    if (event.key === "ArrowRight") move(index + 1);
    else if (event.key === "ArrowLeft") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(openTabs.length - 1);
    else if (event.key === "Delete") onClose(openTabs[index]);
    else return;
    event.preventDefault();
  }

  return (
    <div ref={barRef} className="vs-tabs" role="tablist" aria-label="Open editors">
      {openTabs.map((id, index) => {
        const file = getFile(id);
        const active = id === activeId;
        return (
          <div
            key={id}
            ref={(node) => {
              if (node) tabRefs.current.set(id, node);
              else tabRefs.current.delete(id);
            }}
            className={`vs-tab${active ? " is-active" : ""}`}
            role="tab"
            id={`tab-${id}`}
            aria-selected={active}
            aria-controls="editor-panel"
            tabIndex={active ? 0 : -1}
            title={file.name}
            onClick={() => onSelect(id)}
            onAuxClick={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                onClose(id);
              }
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <FileIcon kind={id} />
            <span className="vs-tab-label">{file.name}</span>
            <button
              type="button"
              className="vs-tab-close"
              tabIndex={-1}
              aria-label={`Close ${file.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(id);
              }}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Find widget ─────────────────────────── */

function FindWidget({
  query,
  matchCase,
  total,
  current,
  focusToken,
  onQuery,
  onToggleCase,
  onStep,
  onClose,
}: {
  query: string;
  matchCase: boolean;
  total: number;
  current: number;
  focusToken: number;
  onQuery: (value: string) => void;
  onToggleCase: () => void;
  onStep: (direction: 1 | -1) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusToken]);

  const hasQuery = query.length > 0;
  const summary = !hasQuery
    ? "No results"
    : total === 0
      ? "No results"
      : `${current + 1} of ${total}${total >= MAX_MATCHES ? "+" : ""}`;

  return (
    <div className="vs-find" role="search" aria-label="Find in file">
      <input
        ref={inputRef}
        className="vs-find-input"
        type="text"
        value={query}
        placeholder="Find"
        aria-label="Find"
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onStep(event.shiftKey ? -1 : 1);
          } else if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      />
      <button
        type="button"
        className="vs-find-toggle"
        aria-pressed={matchCase}
        aria-label="Match case"
        title="Match case"
        onClick={onToggleCase}
      >
        Aa
      </button>
      <span
        className={`vs-find-count${hasQuery && total === 0 ? " is-empty" : ""}`}
        role="status"
      >
        {summary}
      </span>
      <button
        type="button"
        className="vs-icon-btn"
        aria-label="Previous match (Shift+Enter)"
        title="Previous match (Shift+Enter)"
        disabled={total === 0}
        onClick={() => onStep(-1)}
      >
        <ArrowUpIcon />
      </button>
      <button
        type="button"
        className="vs-icon-btn"
        aria-label="Next match (Enter)"
        title="Next match (Enter)"
        disabled={total === 0}
        onClick={() => onStep(1)}
      >
        <ArrowDownIcon />
      </button>
      <button
        type="button"
        className="vs-icon-btn"
        aria-label="Close find (Esc)"
        title="Close (Esc)"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/* ───────────────────────────── Minimap ───────────────────────────── */

const MINIMAP_ROW = 3;
const MINIMAP_PAD = 6;

function toneOf(tokens: Token[]) {
  const first = tokens.find((token) => token.text.trim());
  if (!first) return undefined;
  if (first.cls === "cmt") return "cmt";
  if (first.cls === "ctl" || first.cls === "kw" || first.cls === "head") return "kw";
  if (first.cls === "tag" || first.cls === "punc") return "tag";
  if (first.cls === "str") return "str";
  return undefined;
}

function Minimap({
  lines,
  tokens,
  editorRef,
}: {
  lines: string[];
  tokens: Token[][];
  editorRef: RefObject<HTMLDivElement | null>;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [view, setView] = useState({ top: 0, height: 0 });
  const contentHeight = lines.length * MINIMAP_ROW;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sync = () => {
      const total = editor.scrollHeight || 1;
      setView({
        top: (editor.scrollTop / total) * contentHeight,
        height: Math.min(contentHeight, (editor.clientHeight / total) * contentHeight),
      });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(editor);
    if (editor.firstElementChild) observer.observe(editor.firstElementChild);
    editor.addEventListener("scroll", sync, { passive: true });
    return () => {
      observer.disconnect();
      editor.removeEventListener("scroll", sync);
    };
  }, [editorRef, contentHeight]);

  function scrollTo(clientY: number) {
    const editor = editorRef.current;
    const map = mapRef.current;
    if (!editor || !map || contentHeight === 0) return;
    const rect = map.getBoundingClientRect();
    const fraction = (clientY - rect.top - MINIMAP_PAD) / contentHeight;
    editor.scrollTop = Math.max(
      0,
      fraction * editor.scrollHeight - editor.clientHeight / 2,
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    scrollTo(event.clientY);
  }

  return (
    <div
      ref={mapRef}
      className="vs-minimap"
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={(event) => {
        if (dragging.current) scrollTo(event.clientY);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <span
        className="vs-minimap-slider"
        style={{ top: MINIMAP_PAD + view.top, height: view.height }}
      />
      <div className="vs-minimap-rows" style={{ paddingTop: MINIMAP_PAD }}>
        {lines.map((line, index) => {
          const indent = line.length - line.trimStart().length;
          return (
            <i
              key={index}
              data-tone={toneOf(tokens[index] ?? [])}
              style={{
                marginLeft: Math.min(24, indent * 1.5),
                width: Math.min(46, line.trim().length * 1.4),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────── Code view ───────────────────────────── */

function CodeView({
  file,
  lines,
  tokens,
  wrap,
  activeLine,
  matches,
  currentMatch,
  onCursorChange,
}: {
  file: StudioFile;
  lines: string[];
  tokens: Token[][];
  wrap: boolean;
  activeLine: number;
  matches: Match[];
  currentMatch: number;
  onCursorChange: (cursor: Cursor) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = codeRef.current;
    if (!root) return;
    const onSelectionChange = () => {
      const selection = document.getSelection();
      const node = selection?.focusNode;
      if (!selection || !node || !root.contains(node)) return;
      const element = node instanceof Element ? node : node.parentElement;
      const lineEl = element?.closest<HTMLElement>("[data-line]");
      if (!lineEl) return;
      const textEl = lineEl.querySelector<HTMLElement>(".vs-line-text");
      let col = 1;
      if (textEl && textEl.contains(node)) {
        const range = document.createRange();
        range.selectNodeContents(textEl);
        range.setEnd(node, selection.focusOffset);
        col = range.toString().length + 1;
      }
      onCursorChange({
        line: Number(lineEl.dataset.line),
        col,
        selected: selection.isCollapsed ? 0 : selection.toString().length,
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [onCursorChange]);

  const current = matches[currentMatch];
  const currentLine = current?.line;
  const currentStart = current?.start;

  useEffect(() => {
    if (currentLine === undefined) return;
    const editor = editorRef.current;
    const row = editor?.querySelector<HTMLElement>(`[data-line="${currentLine + 1}"]`);
    if (!editor || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < editor.scrollTop + 8 || bottom > editor.scrollTop + editor.clientHeight - 8) {
      editor.scrollTop = Math.max(0, top - editor.clientHeight / 2);
    }
  }, [currentLine, currentStart]);

  const rangesByLine = useMemo(() => {
    const map = new Map<number, LineRange[]>();
    matches.forEach((match, index) => {
      const list = map.get(match.line) ?? [];
      list.push({ start: match.start, end: match.end, current: index === currentMatch });
      map.set(match.line, list);
    });
    return map;
  }, [matches, currentMatch]);

  const rows = useMemo(
    () =>
      tokens.map((lineTokens, index) =>
        renderTokens(lineTokens, rangesByLine.get(index) ?? []),
      ),
    [tokens, rangesByLine],
  );

  function selectLine(line: number) {
    const textEl = codeRef.current?.querySelector<HTMLElement>(
      `[data-line="${line}"] .vs-line-text`,
    );
    const selection = document.getSelection();
    if (!textEl || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(textEl);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      const texts = codeRef.current?.querySelectorAll(".vs-line-text");
      const selection = document.getSelection();
      if (!texts || texts.length === 0 || !selection) return;
      event.preventDefault();
      const range = document.createRange();
      range.setStartBefore(texts[0]);
      range.setEndAfter(texts[texts.length - 1]);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  return (
    <div className="vs-editor-row">
      <div
        ref={editorRef}
        className="vs-editor"
        id="editor-panel"
        role="region"
        aria-roledescription="read-only code editor"
        aria-label={`${file.name} (read only)`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div ref={codeRef} className={`vs-code${wrap ? " is-wrap" : ""}`}>
          {rows.map((row, index) => (
            <div
              key={index}
              className={`vs-line${activeLine === index + 1 ? " is-active" : ""}`}
              data-line={index + 1}
            >
              <span
                className="vs-gutter"
                aria-hidden="true"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectLine(index + 1);
                }}
              >
                {index + 1}
              </span>
              <span className="vs-line-text">{row}</span>
            </div>
          ))}
        </div>
      </div>
      <Minimap lines={lines} tokens={tokens} editorRef={editorRef} />
    </div>
  );
}

/* ───────────────────────────── Other views ───────────────────────────── */

function BinaryView({
  file,
  onShowPreview,
  onDownload,
}: {
  file: StudioFile;
  onShowPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="vs-empty vs-empty--binary" id="editor-panel" role="region" aria-label={file.name}>
      <CubeIcon size={40} className="vs-empty-glyph" />
      <p className="vs-empty-title">
        The file is not displayed in the text editor because it is either binary
        or uses an unsupported text encoding.
      </p>
      <div className="vs-empty-actions">
        <button type="button" className="vs-btn" onClick={onShowPreview}>
          Show 3D preview
        </button>
        <button type="button" className="vs-btn vs-btn--secondary" onClick={onDownload}>
          Download {file.name}
        </button>
      </div>
    </div>
  );
}

function Watermark({ mod }: { mod: string }) {
  const shortcuts = [
    ["Quick open", `${mod}K`],
    ["Command palette", `${mod}${mod === "⌘" ? "⇧" : "Shift+"}P`],
    ["Toggle terminal", `${mod}J`],
    ["Toggle sidebar", `${mod}B`],
    ["Find in file", `${mod}F`],
  ];
  return (
    <div className="vs-empty" id="editor-panel" role="region" aria-label="No file open">
      <p className="vs-watermark">Kubo.Archive</p>
      <dl className="vs-shortcuts">
        {shortcuts.map(([label, keys]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <kbd>{keys}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ───────────────────────────── Pane ───────────────────────────── */

type EditorPaneProps = {
  openTabs: StudioFileId[];
  activeId: StudioFileId | null;
  wrap: boolean;
  activeLine: number;
  findOpen: boolean;
  findToken: number;
  mod: string;
  onSelectTab: (id: StudioFileId) => void;
  onCloseTab: (id: StudioFileId) => void;
  onToggleWrap: () => void;
  onCursorChange: (cursor: Cursor) => void;
  onCloseFind: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onShowPreview: () => void;
  onDownloadModel: () => void;
  previewOpen: boolean;
  modelSrc: string;
  onHidePreview: () => void;
};

export function EditorPane({
  openTabs,
  activeId,
  wrap,
  activeLine,
  findOpen,
  findToken,
  mod,
  onSelectTab,
  onCloseTab,
  onToggleWrap,
  onCursorChange,
  onCloseFind,
  onCopy,
  onDownload,
  onShowPreview,
  onDownloadModel,
  previewOpen,
  modelSrc,
  onHidePreview,
}: EditorPaneProps) {
  const file = activeId ? getFile(activeId) : null;
  const content = useMemo(() => (activeId ? getFileText(activeId) : ""), [activeId]);
  const lines = useMemo(() => content.split("\n"), [content]);
  const tokens = useMemo(
    () => (file && !file.binary ? highlight(content, file.language) : []),
    [content, file],
  );

  const [query, setQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);

  const matches = useMemo(
    () => (findOpen && file && !file.binary ? findMatches(lines, query, matchCase) : []),
    [findOpen, file, lines, query, matchCase],
  );
  const currentMatch = matches.length ? Math.min(matchIndex, matches.length - 1) : 0;

  function step(direction: 1 | -1) {
    if (matches.length === 0) return;
    setMatchIndex((currentMatch + direction + matches.length) % matches.length);
  }

  const crumbs = activeId ? getBreadcrumbs(activeId) : [];

  return (
    <div className="vs-editor-group">
      {openTabs.length > 0 ? (
        <TabBar
          openTabs={openTabs}
          activeId={activeId}
          onSelect={onSelectTab}
          onClose={onCloseTab}
        />
      ) : (
        <div className="vs-tabs vs-tabs--empty" />
      )}

      {file ? (
        <div className="vs-breadcrumbs">
          <nav className="vs-crumbs" aria-label="Breadcrumbs">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="vs-crumb">
                {index > 0 ? <ChevronIcon className="vs-crumb-sep" /> : null}
                {index === crumbs.length - 1 ? (
                  <>
                    <FileIcon kind={file.id} />
                    <span className="vs-crumb-current" aria-current="page">
                      {crumb}
                    </span>
                  </>
                ) : (
                  <span>{crumb}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="vs-toolbar">
            {!file.binary ? (
              <button
                type="button"
                className="vs-icon-btn"
                aria-pressed={wrap}
                aria-label="Toggle word wrap (Alt+Z)"
                title="Toggle word wrap (Alt+Z)"
                onClick={onToggleWrap}
              >
                <WrapIcon />
              </button>
            ) : null}
            {!file.binary ? (
              <button
                type="button"
                className="vs-icon-btn"
                aria-label="Copy file contents"
                title="Copy file contents"
                onClick={onCopy}
              >
                <CopyIcon />
              </button>
            ) : null}
            <button
              type="button"
              className="vs-icon-btn"
              aria-label={`Download ${file.name}`}
              title={`Download ${file.name}`}
              onClick={onDownload}
            >
              <DownloadIcon />
            </button>
          </div>
        </div>
      ) : null}

      <div className="vs-editor-body">
        {previewOpen ? (
          <ModelPreview
            src={modelSrc}
            onDownload={onDownloadModel}
            onClose={onHidePreview}
          />
        ) : file && !file.binary ? (
          <>
            {findOpen ? (
              <FindWidget
                query={query}
                matchCase={matchCase}
                total={matches.length}
                current={currentMatch}
                focusToken={findToken}
                onQuery={(value) => {
                  setQuery(value);
                  setMatchIndex(0);
                }}
                onToggleCase={() => {
                  setMatchCase((value) => !value);
                  setMatchIndex(0);
                }}
                onStep={step}
                onClose={onCloseFind}
              />
            ) : null}
            <CodeView
              key={file.id}
              file={file}
              lines={lines}
              tokens={tokens}
              wrap={wrap}
              activeLine={activeLine}
              matches={matches}
              currentMatch={currentMatch}
              onCursorChange={onCursorChange}
            />
          </>
        ) : file ? (
          <BinaryView
            file={file}
            onShowPreview={onShowPreview}
            onDownload={onDownloadModel}
          />
        ) : (
          <Watermark mod={mod} />
        )}
      </div>
    </div>
  );
}
