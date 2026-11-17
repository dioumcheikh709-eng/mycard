/* Encodeur GIF89a autonome (quantification median-cut + LZW), sans dépendance ni worker. */
/* Encodeur GIF89a autonome : pas de dépendance, pas de worker. */
function quantizeMedianCut(pixelsList, maxColors) {
  // pixelsList: tableau de Uint8ClampedArray RGBA (une par frame) ; on échantillonne.
  const samples = [];
  for (const px of pixelsList) {
    const step = 4 * Math.max(1, Math.floor(px.length / 4 / 20000)); // ~20000 échantillons / frame
    for (let i = 0; i < px.length; i += step) {
      if (px[i + 3] < 8) continue; // ignore le quasi-transparent
      samples.push([px[i], px[i + 1], px[i + 2]]);
    }
  }
  if (samples.length === 0) samples.push([0, 0, 0]);
  let boxes = [samples];
  while (boxes.length < maxColors) {
    let bi = -1, brange = -1, bch = 0;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i]; if (b.length < 2) continue;
      for (let ch = 0; ch < 3; ch++) {
        let mn = 255, mx = 0;
        for (const p of b) { if (p[ch] < mn) mn = p[ch]; if (p[ch] > mx) mx = p[ch]; }
        const r = mx - mn;
        if (r > brange) { brange = r; bi = i; bch = ch; }
      }
    }
    if (bi === -1 || brange <= 0) break;
    const b = boxes[bi];
    b.sort((p, q) => p[bch] - q[bch]);
    const mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  const palette = boxes.map(b => {
    let r = 0, g = 0, bl = 0;
    for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
    const n = b.length || 1;
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)];
  });
  while (palette.length < 2) palette.push([0, 0, 0]);
  return palette;
}

function buildLUT(palette, bits) {
  // LUT indexée par (r>>s,g>>s,b>>s) -> index palette le plus proche (calculé une seule fois).
  const side = 1 << bits, s = 8 - bits, LUT = new Uint8Array(side * side * side);
  for (let r = 0; r < side; r++) for (let g = 0; g < side; g++) for (let b = 0; b < side; b++) {
    const R = (r << s) + (1 << (s - 1)), G = (g << s) + (1 << (s - 1)), B = (b << s) + (1 << (s - 1));
    let best = 0, bd = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i], dr = R - p[0], dg = G - p[1], db = B - p[2], d = dr * dr + dg * dg + db * db;
      if (d < bd) { bd = d; best = i; }
    }
    LUT[(r * side + g) * side + b] = best;
  }
  return { LUT, bits, side, s };
}

function ditherToIndices(px, w, h, palette, lut) {
  const { LUT, side, s } = lut;
  const idx = new Uint8Array(w * h);
  const errR = new Float32Array(w * h), errG = new Float32Array(w * h), errB = new Float32Array(w * h);
  const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x), o = p * 4;
      let R = clamp(px[o] + errR[p]), G = clamp(px[o + 1] + errG[p]), B = clamp(px[o + 2] + errB[p]);
      const ri = R >> s, gi = G >> s, bi = B >> s;
      const ci = LUT[(ri * side + gi) * side + bi];
      idx[p] = ci;
      const cp = palette[ci];
      const er = (R - cp[0]) * 0.6, eg = (G - cp[1]) * 0.6, eb = (B - cp[2]) * 0.6; // att\u00e9nu\u00e9 pour limiter le bruit
      if (x + 1 < w) { errR[p + 1] += er * 7/16; errG[p + 1] += eg * 7/16; errB[p + 1] += eb * 7/16; }
      if (y + 1 < h) {
        if (x > 0) { errR[p + w - 1] += er * 3/16; errG[p + w - 1] += eg * 3/16; errB[p + w - 1] += eb * 3/16; }
        errR[p + w] += er * 5/16; errG[p + w] += eg * 5/16; errB[p + w] += eb * 5/16;
        if (x + 1 < w) { errR[p + w + 1] += er * 1/16; errG[p + w + 1] += eg * 1/16; errB[p + w + 1] += eb * 1/16; }
      }
    }
  }
  return idx;
}

function lzwEncode(indices, minCodeSize) {
  const clearCode = 1 << minCodeSize, endCode = clearCode + 1;
  let codeSize = minCodeSize + 1, nextCode = endCode + 1;
  let dict = new Map();
  const out = [];
  let bitBuf = 0, bitCnt = 0;
  const emit = code => {
    bitBuf |= code << bitCnt; bitCnt += codeSize;
    while (bitCnt >= 8) { out.push(bitBuf & 0xFF); bitBuf >>= 8; bitCnt -= 8; }
  };
  const resetDict = () => { dict = new Map(); for (let i = 0; i < clearCode; i++) dict.set(String.fromCharCode(i), i); nextCode = endCode + 1; codeSize = minCodeSize + 1; };
  resetDict(); emit(clearCode);
  let w = '';
  for (let i = 0; i < indices.length; i++) {
    const c = String.fromCharCode(indices[i]), wc = w + c;
    if (dict.has(wc)) { w = wc; }
    else {
      emit(dict.get(w));
      if (nextCode < 4096) {
        dict.set(wc, nextCode);                                          // code de la nouvelle entrée = valeur AVANT incrément
        if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;   // seuil testé sur cette même valeur, avant l'incrément
        nextCode++;
      } else { emit(clearCode); resetDict(); }
      w = c;
    }
  }
  if (w !== '') emit(dict.get(w));
  emit(endCode);
  if (bitCnt > 0) out.push(bitBuf & 0xFF);
  return out;
}

function packSubBlocks(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
  }
  out.push(0);
  return out;
}

export function buildGIF(frames, w, h, delayCs, loop, maxColors) {
  // frames: tableau de Uint8ClampedArray RGBA (m\u00eame taille w x h)
  maxColors = maxColors || 200;
  const palette = quantizeMedianCut(frames, maxColors);
  const tIdx = palette.length; palette.push([0, 0, 0]);   // couleur réservée à la transparence (hors de la forme de la carte)
  const bits = Math.max(2, Math.ceil(Math.log2(palette.length)));
  const tableSize = 1 << bits;
  while (palette.length < tableSize) palette.push([0, 0, 0]);
  const lut = buildLUT(palette, 5);
  const bytes = [];
  const push = (...a) => bytes.push(...a);
  push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // GIF89a
  push(w & 255, w >> 8, h & 255, h >> 8);
  push(0x80 | ((bits - 1) << 4) | (bits - 1), 0, 0); // global color table flag + taille, bg index, pixel aspect
  for (const p of palette) push(p[0], p[1], p[2]);
  push(0x21, 0xFF, 0x0B); for (const c of 'NETSCAPE2.0') push(c.charCodeAt(0)); push(3, 1, loop & 255, (loop >> 8) & 255, 0);
  for (const frame of frames) {
    const idx = ditherToIndices(frame, w, h, palette, lut);
    for (let p = 0, n = w * h; p < n; p++) if (frame[p * 4 + 3] < 128) idx[p] = tIdx;
    push(0x21, 0xF9, 4, (2 << 2) | 1, delayCs & 255, delayCs >> 8, tIdx, 0); // disposition 2 (effacer avant l'image suivante) + couleur transparente
    push(0x2C, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0);
    push(bits);
    const lzw = lzwEncode(idx, bits);
    push(...packSubBlocks(lzw));
  }
  push(0x3B);
  return new Uint8Array(bytes);
}



import { drawCard } from './draw.js';
/* GIF animé : montre l'effet holo choisi en train de bouger, pour le partage */
export async function gifBlob(c,onProgress){
  const N=11,W=260,H=Math.round(W*5/3),fx=c.fx||'classic',k=c.k!=null?c.k:1,frames=[];
  for(let i=0;i<N;i++){
    const t=i/N,ang=2*Math.PI*t,mx=50+42*Math.sin(ang),my=50+34*Math.cos(ang*0.82+1);
    const state={mx,my,rx:-(my-50)/50*13,ry:(mx-50)/50*13,o:Math.min(1,.78+.3*Math.max(0,Math.sin(ang+.4)))};
    const cv=await drawCard(c,{W,fx,k,state});
    frames.push(cv.getContext('2d').getImageData(0,0,W,H).data);
    if(onProgress)onProgress(i+1,N);
    await new Promise(r=>setTimeout(r,0));
  }
  if(onProgress)onProgress(null);
  return new Blob([buildGIF(frames,W,H,8,0,96)],{type:'image/gif'});
}
export async function pngBlob(c){const cv=await drawCard(c);return new Promise(ok=>cv.toBlob(ok,'image/png'))}
