"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { FileIcon, FolderIcon } from "./icons";
import { getFile, type StudioFileId, type TreeNode } from "./files";

type Row = {
  key: string;
  node: TreeNode;
  depth: number;
  parentKey: string | null;
};

function flatten(
  nodes: TreeNode[],
  expanded: Set<string>,
  depth = 0,
  parentKey: string | null = null,
): Row[] {
  const rows: Row[] = [];
  for (const node of nodes) {
    const key = node.type === "folder" ? node.id : `file:${node.id}`;
    rows.push({ key, node, depth, parentKey });
    if (node.type === "folder" && expanded.has(node.id)) {
      rows.push(...flatten(node.children, expanded, depth + 1, key));
    }
  }
  return rows;
}

function countFiles(node: TreeNode): number {
  if (node.type === "file") return 1;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

type ExplorerProps = {
  tree: TreeNode[];
  expanded: Set<string>;
  activeId: StudioFileId | null;
  onToggleFolder: (folderId: string) => void;
  onOpenFile: (id: StudioFileId) => void;
};

export function Explorer({
  tree,
  expanded,
  activeId,
  onToggleFolder,
  onOpenFile,
}: ExplorerProps) {
  const rows = flatten(tree, expanded);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const activeKey = activeId ? `file:${activeId}` : null;
  const tabbableKey =
    (focusKey && rows.some((row) => row.key === focusKey) && focusKey) ||
    (activeKey && rows.some((row) => row.key === activeKey) && activeKey) ||
    rows[0]?.key ||
    null;

  function focusRow(key: string) {
    setFocusKey(key);
    requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(key)}"]`)
        ?.focus();
    });
  }

  function activate(row: Row) {
    if (row.node.type === "folder") onToggleFolder(row.node.id);
    else onOpenFile(row.node.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const row = rows[index];
    const folderId = row.node.type === "folder" ? row.node.id : null;
    const isOpen = folderId !== null && expanded.has(folderId);

    switch (event.key) {
      case "ArrowDown":
        if (rows[index + 1]) focusRow(rows[index + 1].key);
        break;
      case "ArrowUp":
        if (rows[index - 1]) focusRow(rows[index - 1].key);
        break;
      case "Home":
        focusRow(rows[0].key);
        break;
      case "End":
        focusRow(rows[rows.length - 1].key);
        break;
      case "ArrowRight":
        if (folderId && !isOpen) onToggleFolder(folderId);
        else if (folderId && rows[index + 1]) focusRow(rows[index + 1].key);
        break;
      case "ArrowLeft":
        if (folderId && isOpen) onToggleFolder(folderId);
        else if (row.parentKey) focusRow(row.parentKey);
        break;
      case "Enter":
      case " ":
        activate(row);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div
      ref={containerRef}
      className="vs-tree"
      role="tree"
      aria-label="Kubo components"
    >
      {rows.map((row, index) => {
        const { node, depth } = row;
        const isFolder = node.type === "folder";
        const isOpen = isFolder && expanded.has(node.id);
        const isActive = !isFolder && node.id === activeId;
        const file = !isFolder ? getFile(node.id) : null;

        return (
          <div
            key={row.key}
            className={`vs-row${isActive ? " is-active" : ""}${isFolder ? " is-folder" : ""}`}
            role="treeitem"
            aria-level={depth + 1}
            aria-selected={isActive}
            aria-expanded={isFolder ? isOpen : undefined}
            data-row-key={row.key}
            tabIndex={row.key === tabbableKey ? 0 : -1}
            style={{ paddingLeft: 6 + depth * 12 }}
            title={file ? `${file.name} — ${file.label}` : undefined}
            onClick={() => {
              setFocusKey(row.key);
              activate(row);
            }}
            onFocus={() => setFocusKey(row.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {Array.from({ length: depth }, (_, level) => (
              <span
                key={level}
                className="vs-guide"
                style={{ left: 13 + level * 12 }}
                aria-hidden="true"
              />
            ))}
            {isFolder ? (
              <>
                <FolderIcon open={isOpen} />
                <span className="vs-row-label">{node.name}</span>
                <span className="vs-row-count">{countFiles(node)}</span>
              </>
            ) : (
              <>
                <span className="vs-twistie vs-twistie--blank" aria-hidden="true" />
                <FileIcon kind={node.id} />
                <span className="vs-row-label">{file?.name}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
