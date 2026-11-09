import {
  DISC_MODEL_FILENAME,
  frameworks,
  getReadme,
  snippets,
  type FrameworkId,
} from "@/lib/disc-sleeve-snippets";
import { getModelUrl } from "@/lib/storage";

export type StudioFileId = FrameworkId | "readme" | "model";

export type FileLanguage =
  | "html"
  | "tsx"
  | "vue"
  | "typescript"
  | "svelte"
  | "markdown"
  | "glb";

export type StudioFile = {
  id: StudioFileId;
  name: string;
  language: FileLanguage;
  /** Human readable language / type shown in the status bar. */
  label: string;
  binary: boolean;
};

export type TreeNode =
  | { type: "folder"; id: string; name: string; children: TreeNode[] }
  | { type: "file"; id: StudioFileId };

export const DISC_MODEL_URL = getModelUrl(DISC_MODEL_FILENAME);

const LANGUAGE_LABELS: Record<FileLanguage, string> = {
  html: "HTML",
  tsx: "TypeScript React",
  vue: "Vue",
  typescript: "TypeScript",
  svelte: "Svelte",
  markdown: "Markdown",
  glb: "Binary glTF",
};

export const studioFiles: StudioFile[] = [
  ...frameworks.map((framework) => ({
    id: framework.id,
    name: framework.filename,
    language: framework.language as FileLanguage,
    label: LANGUAGE_LABELS[framework.language as FileLanguage] ?? framework.label,
    binary: false,
  })),
  {
    id: "readme",
    name: "README.md",
    language: "markdown",
    label: LANGUAGE_LABELS.markdown,
    binary: false,
  },
  {
    id: "model",
    name: DISC_MODEL_FILENAME,
    language: "glb",
    label: LANGUAGE_LABELS.glb,
    binary: true,
  },
];

const filesById = new Map<StudioFileId, StudioFile>(
  studioFiles.map((file) => [file.id, file]),
);

export function getFile(id: StudioFileId): StudioFile {
  const file = filesById.get(id);
  if (!file) throw new Error(`Unknown studio file: ${id}`);
  return file;
}

export const COMPONENT_FOLDER_ID = "components/disc-sleeve";

export const studioTree: TreeNode[] = [
  {
    type: "folder",
    id: "components",
    name: "components",
    children: [
      {
        type: "folder",
        id: COMPONENT_FOLDER_ID,
        name: "disc-sleeve",
        children: studioFiles.map((file) => ({
          type: "file" as const,
          id: file.id,
        })),
      },
    ],
  },
];

/** Folder ids that must be open for a file to be visible in the tree. */
export function getAncestorFolderIds(id: StudioFileId): string[] {
  const walk = (nodes: TreeNode[], trail: string[]): string[] | null => {
    for (const node of nodes) {
      if (node.type === "file") {
        if (node.id === id) return trail;
      } else {
        const found = walk(node.children, [...trail, node.id]);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(studioTree, []) ?? [];
}

/** Breadcrumb segments for a file, e.g. components › disc-sleeve › DiscSleeve.tsx */
export function getBreadcrumbs(id: StudioFileId): string[] {
  const names = new Map<string, string>();
  const collect = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "folder") {
        names.set(node.id, node.name);
        collect(node.children);
      }
    }
  };
  collect(studioTree);
  return [
    ...getAncestorFolderIds(id).map((folderId) => names.get(folderId) ?? folderId),
    getFile(id).name,
  ];
}

export function getFileText(id: StudioFileId): string {
  if (id === "readme") return getReadme(DISC_MODEL_URL);
  if (id === "model") return "";
  return snippets[id];
}

/** Resolves user input ("react", "README", "DiscSleeve.vue") to a file. */
export function resolveFile(input: string): StudioFile | undefined {
  const query = input.trim().toLowerCase();
  if (!query) return undefined;
  return (
    studioFiles.find((file) => file.name.toLowerCase() === query) ??
    studioFiles.find((file) => file.id === query) ??
    studioFiles.find((file) => file.name.toLowerCase().startsWith(query)) ??
    studioFiles.find((file) => file.name.toLowerCase().split(".")[0] === query)
  );
}

/** Standalone page for the zero-build HTML download. */
export function getStandaloneHtml(origin: string): string {
  const absolute = new URL(DISC_MODEL_URL, origin).href;
  return snippets.html.replace(
    `src="${DISC_MODEL_FILENAME}"`,
    `src="${absolute}"`,
  );
}

export const COMPONENT_COUNT = 1;
