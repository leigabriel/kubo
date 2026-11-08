"use client";

import { useEffect, useRef, useState } from "react";
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

export function DiscSleeve() {
  const [framework, setFramework] = useState<FrameworkId>("react");
  const [status, setStatus] = useState("Ready");
  const [zipBusy, setZipBusy] = useState(false);
  const lenis = useLenis(() => {}, []);

  useEffect(() => {
    loadModelViewer().catch((error) => {
      console.error("Model viewer failed to load", error);
    });
  }, []);

  const active = frameworks.find((f) => f.id === framework) ?? frameworks[0];
  const code = snippets[framework];

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

  return (
    <div className="disc-sleeve" data-intro>
      <div className="disc-preview">
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
        <p className="disc-preview-note">Drag to orbit · Scroll to zoom disabled · 001 / Component</p>
      </div>

      <div className="disc-panel">
        <div className="disc-tabs" role="tablist" aria-label="Framework">
          {frameworks.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={framework === f.id}
              aria-pressed={framework === f.id}
              onClick={() => setFramework(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="disc-code" role="tabpanel">
          <div className="disc-code-head">
            <span>{active.filename}</span>
            <span>{active.language}</span>
          </div>
          <pre>
            <code>{code}</code>
          </pre>
        </div>

        <div className="disc-actions">
          <button type="button" onClick={() => void copyText(code, "Code")}>
            Copy code
          </button>
          <button type="button" onClick={() => downloadText(code, active.filename)}>
            Download {active.label}
          </button>
          <button type="button" onClick={downloadModel}>
            Download model (.glb)
          </button>
          <button type="button" disabled={zipBusy} onClick={() => void downloadZip()}>
            {zipBusy ? "Building…" : "Download ZIP (5 frameworks + model)"}
          </button>
          <button type="button" onClick={() => void copyText(getAiPrompt(discModel, framework), "AI prompt")}>
            Copy AI prompt
          </button>
          <a href="/models/kubo-disc-sleeve.html" download="kubo-disc-sleeve.html">
            Open standalone HTML
          </a>
        </div>

        <p className="disc-status" aria-live="polite">
          {status}
        </p>
      </div>
    </div>
  );
}
