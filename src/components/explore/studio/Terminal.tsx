"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CloseIcon } from "./icons";
import {
  getFileText,
  resolveFile,
  studioFiles,
  type StudioFileId,
} from "./files";

export type TerminalActions = {
  downloadGlb: () => string;
  downloadZip: () => Promise<string>;
  downloadHtml: () => string;
  copyAi: () => Promise<string>;
  copyFile: (id: StudioFileId) => Promise<string>;
  downloadFile: (id: StudioFileId) => string;
};

type LineKind = "in" | "out" | "err" | "info";
type TermLine = { id: number; kind: LineKind; text: string };

const PROMPT = "~/kubo-components";
const MAX_LINES = 400;

const COMMANDS = [
  "help",
  "ls",
  "cat",
  "open",
  "copy",
  "download",
  "zip",
  "glb",
  "html",
  "ai",
  "clear",
];

const HELP = [
  "help                 show this list",
  "ls [-l]              list files in components/disc-sleeve",
  "cat <file>           print a file",
  "open <file>          open a file in the editor",
  "copy <file|ai>       copy a file or the AI prompt",
  "download <target>    target: zip | glb | html | <file>",
  "zip | glb | html     shortcuts for download",
  "ai                   copy the AI prompt",
  "clear                clear the terminal   (Ctrl+L)",
];

const SHORTCUT_TARGETS = ["zip", "glb", "html", "ai"];

function commonPrefix(values: string[]) {
  return values.reduce((prefix, value) => {
    let i = 0;
    while (i < prefix.length && prefix[i] === value[i]) i++;
    return prefix.slice(0, i);
  });
}

type TerminalProps = {
  open: boolean;
  actions: TerminalActions;
  onOpenFile: (id: StudioFileId) => void;
  onClose: () => void;
};

export function Terminal({ open, actions, onOpenFile, onClose }: TerminalProps) {
  const nextId = useRef(1);
  const [lines, setLines] = useState<TermLine[]>(() => [
    { id: 0, kind: "info", text: "Kubo Components terminal. Type 'help' to list commands." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, busy]);

  function print(kind: LineKind, text: string | string[]) {
    const list = Array.isArray(text) ? text : [text];
    setLines((current) =>
      [
        ...current,
        ...list.map((line) => ({ id: nextId.current++, kind, text: line })),
      ].slice(-MAX_LINES),
    );
  }

  async function run(raw: string) {
    const text = raw.trim();
    print("in", text);
    if (!text) return;
    history.current.push(text);
    historyIndex.current = -1;

    const [command, ...args] = text.split(/\s+/);
    const target = args[0]?.toLowerCase();

    const needFile = (verb: string) => {
      if (!args[0]) {
        print("err", `${verb}: missing file operand`);
        return undefined;
      }
      const file = resolveFile(args[0]);
      if (!file) print("err", `${verb}: ${args[0]}: no such file`);
      return file;
    };

    try {
      switch (command.toLowerCase()) {
        case "help":
          print("out", HELP);
          break;
        case "clear":
          setLines([]);
          break;
        case "ls": {
          if (target === "-l") {
            const encoder = new TextEncoder();
            print(
              "out",
              studioFiles.map((file) => {
                const size = file.binary
                  ? "binary"
                  : `${encoder.encode(getFileText(file.id)).length} B`;
                return `${size.padStart(8)}  ${file.name}`;
              }),
            );
          } else {
            print("out", studioFiles.map((file) => file.name));
          }
          break;
        }
        case "cat": {
          const file = needFile("cat");
          if (!file) break;
          if (file.binary) print("err", `cat: ${file.name}: binary file (use 'download glb')`);
          else print("out", getFileText(file.id).split("\n"));
          break;
        }
        case "open": {
          const file = needFile("open");
          if (!file) break;
          onOpenFile(file.id);
          print("info", `Opened ${file.name}`);
          break;
        }
        case "copy": {
          if (target === "ai") {
            print("info", await actions.copyAi());
            break;
          }
          const file = needFile("copy");
          if (!file) break;
          if (file.binary) print("err", `copy: ${file.name}: binary file`);
          else print("info", await actions.copyFile(file.id));
          break;
        }
        case "ai":
          print("info", await actions.copyAi());
          break;
        case "zip":
          setBusy(true);
          print("info", await actions.downloadZip());
          break;
        case "glb":
          print("info", actions.downloadGlb());
          break;
        case "html":
          print("info", actions.downloadHtml());
          break;
        case "download": {
          if (!target) {
            print("err", "download: missing target (zip | glb | html | <file>)");
          } else if (target === "zip") {
            setBusy(true);
            print("info", await actions.downloadZip());
          } else if (target === "glb") {
            print("info", actions.downloadGlb());
          } else if (target === "html") {
            print("info", actions.downloadHtml());
          } else {
            const file = needFile("download");
            if (file) print("info", file.binary ? actions.downloadGlb() : actions.downloadFile(file.id));
          }
          break;
        }
        default:
          print("err", `${command}: command not found. Type 'help' to list commands.`);
      }
    } catch (error) {
      print("err", error instanceof Error ? error.message : "Command failed");
    } finally {
      setBusy(false);
    }
  }

  function complete() {
    const parts = input.split(/\s+/);
    const isCommand = parts.length <= 1;
    const word = parts[parts.length - 1].toLowerCase();
    const pool = isCommand
      ? COMMANDS
      : [
          ...studioFiles.map((file) => file.name),
          ...(["copy", "download"].includes(parts[0].toLowerCase()) ? SHORTCUT_TARGETS : []),
        ];
    const matches = pool.filter((candidate) => candidate.toLowerCase().startsWith(word));
    if (matches.length === 0) return;
    const completed = commonPrefix(matches);
    setInput([...parts.slice(0, -1), matches.length === 1 ? `${completed} ` : completed].join(" "));
    if (matches.length > 1) print("out", matches.join("   "));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (busy) return;
      const value = input;
      setInput("");
      void run(value);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const entries = history.current;
      if (entries.length === 0) return;
      historyIndex.current =
        historyIndex.current === -1
          ? entries.length - 1
          : Math.max(0, historyIndex.current - 1);
      setInput(entries[historyIndex.current]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const entries = history.current;
      if (historyIndex.current === -1) return;
      historyIndex.current += 1;
      if (historyIndex.current >= entries.length) {
        historyIndex.current = -1;
        setInput("");
      } else {
        setInput(entries[historyIndex.current]);
      }
    } else if (event.key === "Tab") {
      event.preventDefault();
      complete();
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setLines([]);
    }
  }

  return (
    <section className="vs-panel" aria-label="Terminal" hidden={!open}>
      <div className="vs-pane-head">
        <h2 className="vs-pane-title vs-pane-title--tab">Terminal</h2>
        <div className="vs-toolbar">
          <button
            type="button"
            className="vs-icon-btn"
            aria-label="Hide terminal"
            title="Hide terminal"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="vs-terminal"
        onClick={() => {
          if (!document.getSelection()?.toString()) inputRef.current?.focus();
        }}
      >
        <div role="log" aria-live="polite" aria-label="Terminal output">
          {lines.map((line) => (
            <p key={line.id} className={`vs-term-line is-${line.kind}`}>
              {line.kind === "in" ? (
                <>
                  <span className="vs-prompt">{PROMPT}</span>
                  <span className="vs-prompt-sign"> &gt; </span>
                </>
              ) : null}
              {line.text}
            </p>
          ))}
        </div>
        <label className="vs-term-input-row">
          <span className="vs-prompt">{PROMPT}</span>
          <span className="vs-prompt-sign">&gt;</span>
          <input
            ref={inputRef}
            className="vs-term-input"
            type="text"
            value={input}
            disabled={busy}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Terminal input"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </label>
      </div>
    </section>
  );
}
