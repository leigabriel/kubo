"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { FileIcon } from "./icons";
import type { StudioFile, StudioFileId } from "./files";

export type StudioCommand = {
  id: string;
  label: string;
  shortcut?: string;
  run: () => void;
};

type Item =
  | { kind: "file"; key: string; file: StudioFile }
  | { kind: "command"; key: string; command: StudioCommand };

/** Subsequence match; lower score is better, -1 means no match. */
function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const direct = t.indexOf(q);
  if (direct !== -1) return direct;
  let from = 0;
  let gaps = 0;
  for (const char of q) {
    const at = t.indexOf(char, from);
    if (at === -1) return -1;
    gaps += at - from;
    from = at + 1;
  }
  return 100 + gaps;
}

type QuickOpenProps = {
  initialQuery: string;
  files: StudioFile[];
  commands: StudioCommand[];
  onClose: () => void;
  onOpenFile: (id: StudioFileId) => void;
};

export function QuickOpen({
  initialQuery,
  files,
  commands,
  onClose,
  onOpenFile,
}: QuickOpenProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(initialQuery.length, initialQuery.length);
    return () => previous?.focus?.();
  }, [initialQuery]);

  const isCommandMode = query.startsWith(">");
  const term = (isCommandMode ? query.slice(1) : query).trim();

  const items = useMemo<Item[]>(() => {
    const ranked = <T,>(list: T[], text: (item: T) => string) =>
      list
        .map((item) => ({ item, score: fuzzyScore(term, text(item)) }))
        .filter((entry) => entry.score !== -1)
        .sort((a, b) => a.score - b.score)
        .map((entry) => entry.item);

    if (isCommandMode) {
      return ranked(commands, (command) => command.label).map((command) => ({
        kind: "command" as const,
        key: command.id,
        command,
      }));
    }
    return ranked(files, (file) => file.name).map((file) => ({
      kind: "file" as const,
      key: file.id,
      file,
    }));
  }, [commands, files, isCommandMode, term]);

  const active = Math.min(selected, Math.max(0, items.length - 1));

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, items]);

  function choose(item: Item | undefined) {
    if (!item) return;
    onClose();
    if (item.kind === "file") onOpenFile(item.file.id);
    else item.command.run();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected(items.length ? (active + 1) % items.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(items.length ? (active - 1 + items.length) % items.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="vs-quick-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="vs-quick" role="dialog" aria-modal="true" aria-label="Quick open">
        <input
          ref={inputRef}
          className="vs-quick-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="quick-list"
          aria-activedescendant={items[active] ? `quick-${items[active].key}` : undefined}
          aria-label="Search files by name, or type > for commands"
          placeholder="Search files by name (append > to run a command)"
          spellCheck={false}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul ref={listRef} className="vs-quick-list" id="quick-list" role="listbox">
          {items.length === 0 ? (
            <li className="vs-quick-empty" role="presentation">
              No matching {isCommandMode ? "commands" : "files"}
            </li>
          ) : (
            items.map((item, index) => (
              <li
                key={item.key}
                id={`quick-${item.key}`}
                role="option"
                aria-selected={index === active}
                className={`vs-quick-item${index === active ? " is-active" : ""}`}
                onMouseMove={() => setSelected(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item);
                }}
              >
                {item.kind === "file" ? (
                  <>
                    <FileIcon kind={item.file.id} />
                    <span className="vs-quick-label">{item.file.name}</span>
                    <span className="vs-quick-detail">components/disc-sleeve</span>
                  </>
                ) : (
                  <>
                    <span className="vs-quick-label">{item.command.label}</span>
                    {item.command.shortcut ? (
                      <kbd className="vs-quick-kbd">{item.command.shortcut}</kbd>
                    ) : null}
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
