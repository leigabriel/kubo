import Link from "next/link";
import { PixelMark } from "@/components/visual/PixelMark";

type VisualKind = "object" | "type" | "index" | "motion";

type ArchiveEntry = {
  index: string;
  category: string;
  title: string;
  description: string;
  meta: string;
  visual: VisualKind;
};

const archiveEntries: ArchiveEntry[] = [
  {
    index: "001",
    category: "Object",
    title: "The Archive Box",
    description:
      "A container for the raw material of a practice — models, images, type, and motion kept in one place.",
    meta: "Archive / 2026",
    visual: "object",
  },
  {
    index: "002",
    category: "Type",
    title: "On Keeping Things",
    description:
      "An archive is less about storage and more about making room for the next idea.",
    meta: "Essay / 2026",
    visual: "type",
  },
  {
    index: "003",
    category: "Index",
    title: "A Taxonomy of Useful Things",
    description:
      "How the archive sorts assets by the way they are made and the way they are used.",
    meta: "Index / 2026",
    visual: "index",
  },
  {
    index: "004",
    category: "Motion",
    title: "Open to Interpretation",
    description:
      "Every file is a starting point, not a verdict. The archive is meant to move.",
    meta: "Note / 2026",
    visual: "motion",
  },
];

function CubeArt() {
  return (
    <svg
      className="archive-visual-cube"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M50 12 84 31v38L50 88 16 69V31z" />
      <path d="M16 31 50 50l34-19M50 50v38" />
      <path d="M33 22 67 41v38L33 60z" opacity=".35" />
    </svg>
  );
}

function OrbitArt() {
  return (
    <svg
      className="archive-visual-orbit"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="9" />
      <circle cx="50" cy="50" r="21" opacity=".7" />
      <circle cx="50" cy="50" r="33" opacity=".45" />
      <circle cx="50" cy="50" r="45" opacity=".25" />
      <path d="M50 5v90M5 50h90" opacity=".3" />
    </svg>
  );
}

function ArchiveVisual({
  kind,
  label,
}: {
  kind: VisualKind;
  label: string;
}) {
  return (
    <span
      className={`archive-card-visual archive-visual-${kind}`}
      aria-hidden="true"
    >
      <span className="archive-visual-label">{label}</span>
      {kind === "object" && <CubeArt />}
      {kind === "type" && <span className="archive-type-sample">Aa</span>}
      {kind === "index" && (
        <>
          <span className="archive-index-field" />
          <PixelMark className="archive-pixel-mark" />
        </>
      )}
      {kind === "motion" && <OrbitArt />}
    </span>
  );
}

export function HomeArchive() {
  return (
    <section className="home-archive" aria-labelledby="archive-heading">
      <h2 className="sr-only" id="archive-heading">
        Kubo Archive
      </h2>

      <div className="archive-mark-wrap" data-reveal>
        <p className="archive-kicker">Kubo Archive</p>
        <PixelMark className="archive-mark" />
      </div>

      <p className="archive-lede" data-reveal>
        A living index of the objects, references, and ideas that shape Kubo —
        collected, catalogued, and kept open for whatever comes next.
      </p>

      <div className="archive-head" data-reveal>
        <p>Latest from the archive</p>
        <Link className="archive-explore" href="/explore">
          Explore all <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="archive-grid" data-reveal-group>
        {archiveEntries.map((entry) => (
          <article className="archive-card" key={entry.index}>
            <Link className="archive-card-link" href="/explore">
              <ArchiveVisual
                kind={entry.visual}
                label={`Archive / ${entry.index}`}
              />
              <div className="archive-card-body">
                <span className="archive-card-index">
                  {entry.index} / {entry.category}
                </span>
                <h3 className="archive-card-title">{entry.title}</h3>
                <p className="archive-card-description">{entry.description}</p>
                <span className="archive-card-meta">{entry.meta}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
