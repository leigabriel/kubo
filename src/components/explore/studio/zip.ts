const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export type ZipEntry = { name: string; data: Uint8Array | string };

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const VERSION = 20;
const FLAG_UTF8 = 0x0800;
const MAX_32 = 0xffffffff;

function toDosDateTime(date: Date) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (date.getSeconds() >> 1);
  const day =
    ((Math.max(date.getFullYear(), 1980) - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
}

/**
 * Builds a ZIP archive (stored, no compression) entirely in memory.
 *
 * Layout follows the PKWARE APPNOTE: a local header + data per file, then a
 * central directory, then the end-of-central-directory record. Every field
 * below sits at the offset the specification defines, so `unzip`, Finder,
 * Explorer and Python's `zipfile` can all read the result.
 */
export function createZip(entries: ZipEntry[], now: Date = new Date()): Blob {
  const encoder = new TextEncoder();
  const { time, day } = toDosDateTime(now);

  const files = entries.map((entry) => ({
    name: encoder.encode(entry.name),
    data:
      typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data,
  }));

  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const size = file.data.length;
    const crc = crc32(file.data);

    if (size > MAX_32 || offset > MAX_32) {
      throw new Error("ZIP too large (Zip64 is not supported)");
    }

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, LOCAL_SIGNATURE, true);
    local.setUint16(4, VERSION, true); // version needed to extract
    local.setUint16(6, FLAG_UTF8, true); // general purpose flags
    local.setUint16(8, 0, true); // compression method: stored
    local.setUint16(10, time, true); // last modified time
    local.setUint16(12, day, true); // last modified date
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true); // compressed size
    local.setUint32(22, size, true); // uncompressed size
    local.setUint16(26, file.name.length, true);
    local.setUint16(28, 0, true); // extra field length
    parts.push(new Uint8Array(local.buffer), file.name, file.data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, CENTRAL_SIGNATURE, true);
    entry.setUint16(4, VERSION, true); // version made by
    entry.setUint16(6, VERSION, true); // version needed to extract
    entry.setUint16(8, FLAG_UTF8, true);
    entry.setUint16(10, 0, true); // compression method: stored
    entry.setUint16(12, time, true);
    entry.setUint16(14, day, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, size, true); // compressed size
    entry.setUint32(24, size, true); // uncompressed size
    entry.setUint16(28, file.name.length, true);
    entry.setUint16(30, 0, true); // extra field length
    entry.setUint16(32, 0, true); // file comment length
    entry.setUint16(34, 0, true); // disk number start
    entry.setUint16(36, 0, true); // internal attributes
    entry.setUint32(38, 0, true); // external attributes
    entry.setUint32(42, offset, true); // local header offset
    central.push(new Uint8Array(entry.buffer), file.name);

    offset += 30 + file.name.length + size;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, END_SIGNATURE, true);
  end.setUint16(8, files.length, true); // entries on this disk
  end.setUint16(10, files.length, true); // total entries
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true); // central directory offset

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
    type: "application/zip",
  });
}
