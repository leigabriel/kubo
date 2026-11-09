import type { ReactNode } from "react";
import type { StudioFileId } from "./files";

type IconProps = { className?: string; size?: number };

function Svg({
  children,
  className,
  size = 16,
  fill = "none",
}: IconProps & { children: ReactNode; fill?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function FileIcon({
  kind,
  className = "",
}: {
  kind: StudioFileId;
  className?: string;
}) {
  const glyph: Record<StudioFileId, ReactNode> = {
    html: (
      <>
        <path d="M5.5 4 2 8l3.5 4" />
        <path d="M10.5 4 14 8l-3.5 4" />
      </>
    ),
    react: (
      <>
        <ellipse cx="8" cy="8" rx="6.2" ry="2.4" />
        <ellipse cx="8" cy="8" rx="6.2" ry="2.4" transform="rotate(60 8 8)" />
        <ellipse cx="8" cy="8" rx="6.2" ry="2.4" transform="rotate(120 8 8)" />
        <circle cx="8" cy="8" r="0.9" fill="currentColor" />
      </>
    ),
    vue: (
      <>
        <path d="M2 3.5h2.6L8 9.4l3.4-5.9H14L8 13.5Z" />
        <path d="M5.8 3.5 8 7.2l2.2-3.7" />
      </>
    ),
    angular: (
      <>
        <path d="M8 2 13.2 4l-.8 6.8L8 14l-4.4-3.2L2.8 4Z" />
        <path d="M5.9 10.6 8 5.2l2.1 5.4M6.6 9h2.8" />
      </>
    ),
    svelte: (
      <path d="M10.6 4.3c-.8-1.1-3.7-1.1-4.5.2-.8 1.4.5 2.4 3.9 3.2 2.3.6 1.9 2.8.5 3.7-1.3.9-3.8.7-4.6-.6" />
    ),
    readme: (
      <>
        <path d="M2 3.5h5a1 1 0 0 1 1 1v8a1.5 1.5 0 0 0-1.5-1.5H2Z" />
        <path d="M14 3.5H9a1 1 0 0 0-1 1v8a1.5 1.5 0 0 1 1.5-1.5H14Z" />
      </>
    ),
    model: (
      <>
        <path d="M8 2 13.5 5v6L8 14l-5.5-3V5Z" />
        <path d="M2.5 5 8 8l5.5-3M8 8v6" />
      </>
    ),
  };

  return (
    <Svg className={`vs-file-icon vs-file-icon--${kind} ${className}`}>
      {glyph[kind]}
    </Svg>
  );
}

export function FolderIcon({
  open,
  className = "",
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <Svg className={`vs-folder-icon ${className}`}>
      {open ? (
        <>
          <path d="M1.8 4.2v8.3h10.9l1.5-5.6H5.3L4.6 4.2Z" />
          <path d="M1.8 4.2h2.8l1 1.4" />
        </>
      ) : (
        <path d="M1.8 3.8h4l1.3 1.7h7.1v7H1.8Z" />
      )}
    </Svg>
  );
}

export function ChevronIcon({
  open,
  className = "",
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <Svg className={className} size={16}>
      <path d={open ? "m4.5 6.5 3.5 3.5 3.5-3.5" : "m6.5 4.5 3.5 3.5-3.5 3.5"} />
    </Svg>
  );
}

export function ExplorerIcon(props: IconProps) {
  return (
    <Svg {...props} size={props.size ?? 24}>
      <path d="M9.5 2.5h-5a1 1 0 0 0-1 1v8.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6Z" />
      <path d="M9.5 2.5V6h3.5" />
      <path d="M6 1.5h4.7L14 4.8V11" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.8" cy="6.8" r="4.3" />
      <path d="m10 10 4 4" />
    </Svg>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 1.8 13.6 5v6L8 14.2 2.4 11V5Z" />
      <path d="M2.4 5 8 8.2 13.6 5M8 8.2v6" />
    </Svg>
  );
}

export function TerminalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2" />
      <path d="m4.6 6.2 2.2 1.8-2.2 1.8M8.4 10h3" />
    </Svg>
  );
}

export function SidebarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.2" />
      <path d="M6 2.6v10.8" />
      {filled ? <rect x="2.3" y="3.1" width="3.2" height="9.8" fill="currentColor" stroke="none" /> : null}
    </Svg>
  );
}

export function PanelIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.2" />
      <path d="M1.8 9.4h12.4" />
      {filled ? <rect x="2.3" y="9.9" width="11.4" height="3" fill="currentColor" stroke="none" /> : null}
    </Svg>
  );
}

export function SecondaryIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.2" />
      <path d="M10 2.6v10.8" />
      {filled ? <rect x="10.5" y="3.1" width="3.2" height="9.8" fill="currentColor" stroke="none" /> : null}
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3.8 3.8 8.4 8.4M12.2 3.8l-8.4 8.4" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5.4" y="5.4" width="8.2" height="8.2" rx="1" />
      <path d="M10.6 5.4V3.4a1 1 0 0 0-1-1H3.4a1 1 0 0 0-1 1v6.2a1 1 0 0 0 1 1h2" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 2.2v8M4.8 7.2 8 10.4l3.2-3.2M2.6 13.4h10.8" />
    </Svg>
  );
}

export function CollapseAllIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.6" y="4.8" width="8.6" height="8.6" rx="1" />
      <path d="M4.8 4.8V3.4a1 1 0 0 1 1-1h6.8a1 1 0 0 1 1 1v6.8a1 1 0 0 1-1 1h-1.4M5 9h4.4" />
    </Svg>
  );
}

export function WrapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 3.5h12M2 8h9.2a2.2 2.2 0 0 1 0 4.4H8.4m0 0 1.6-1.6m-1.6 1.6L10 14M2 12.4h3.2" />
    </Svg>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="4.5" cy="3.6" r="1.4" />
      <circle cx="4.5" cy="12.4" r="1.4" />
      <circle cx="11.5" cy="5.4" r="1.4" />
      <path d="M4.5 5v6M11.5 6.8c0 2.4-3.4 1.6-7 3.2" />
    </Svg>
  );
}

export function ZipIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 1.8h6.2l3 3v9.4h-9.2Z" />
      <path d="M7 1.8v1.6h1.6V5H7v1.6h1.6v1.6M7 8.2v2.6h1.6V8.2Z" />
    </Svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 2.4 8.3 6l3.6 1.3L8.3 8.6 7 12.2 5.7 8.6 2.1 7.3 5.7 6Z" />
      <path d="M12.4 1.8v2.4M11.2 3h2.4" />
    </Svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c2 1.8 2.9 3.8 2.9 6S10 12.2 8 14C6 12.2 5.1 10.2 5.1 8S6 3.8 8 2Z" />
    </Svg>
  );
}

export function ChevronDownSmall(props: IconProps) {
  return (
    <Svg {...props} size={props.size ?? 12}>
      <path d="m3.5 6 4.5 4.5L12.5 6" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.4 8a5.4 5.4 0 1 1-1.6-3.8M13.6 2.4v3.2h-3.2" />
    </Svg>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 9.5 4-4 4 4" />
    </Svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 6.5 4 4 4-4" />
    </Svg>
  );
}
