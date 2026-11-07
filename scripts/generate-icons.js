import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // +1 filter byte
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return crc ^ -1;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type 6 (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw GigPilot App Icon
function drawIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background rounded squircle / gradient
  const bgR = 2;
  const bgG = 44;
  const bgB = 34;

  // Outer border glow
  if (dist > w * 0.44 && dist < w * 0.47) {
    return [16, 185, 129, 255]; // emerald glow ring
  }

  // Inner radar ring
  if (dist > w * 0.28 && dist < w * 0.30) {
    return [52, 211, 153, 200];
  }

  // Center Bolt / Shield
  if (dist < w * 0.22) {
    // Lightning bolt pattern
    if (Math.abs(dx * 0.6 + dy) < w * 0.12) {
      return [56, 189, 248, 255]; // cyan accent
    }
    return [16, 185, 129, 255]; // emerald
  }

  // Base background
  const grad = Math.min(1, dist / (w * 0.5));
  return [
    Math.round(bgR + grad * 8),
    Math.round(bgG - grad * 20),
    Math.round(bgB + grad * 12),
    255
  ];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
const png192 = createPng(192, 192, drawIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 512x512
const png512 = createPng(512, 512, drawIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

console.log('Generated PWA icons successfully in public/');
