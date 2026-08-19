// Gera os PNGs de icone sem nenhuma dependencia externa: rasteriza a marca
// direto num buffer de pixels e escreve o PNG com o zlib do proprio Node.
//
//   node tools/gen-icons.mjs
//
// A marca e um halter dourado sobre o verde escuro do app. Sem texto, para
// continuar legivel no tamanho de um icone de tela inicial.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "icons");

const FUNDO = [31, 51, 41];    // #1F3329
const DOURADO = [221, 191, 137]; // #DDBF89

const SUPER = 4; // supersampling, para as bordas nao ficarem serrilhadas

// Ponto dentro de um retangulo de cantos arredondados.
function dentro(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Halter centrado, escalado por `escala` (fracao do lado do icone).
function pecas(lado, escala) {
  const c = lado / 2;
  const u = lado * escala; // largura total do halter
  const r = u * 0.05;
  const meia = u / 2;
  return [
    // barra central
    { x0: c - meia * 0.62, y0: c - u * 0.055, x1: c + meia * 0.62, y1: c + u * 0.055, r: r * 0.6 },
    // anilhas internas
    { x0: c - meia * 0.72, y0: c - u * 0.24, x1: c - meia * 0.52, y1: c + u * 0.24, r },
    { x0: c + meia * 0.52, y0: c - u * 0.24, x1: c + meia * 0.72, y1: c + u * 0.24, r },
    // anilhas externas
    { x0: c - meia, y0: c - u * 0.15, x1: c - meia * 0.8, y1: c + u * 0.15, r },
    { x0: c + meia * 0.8, y0: c - u * 0.15, x1: c + meia, y1: c + u * 0.15, r }
  ];
}

function rasterizar(lado, escala) {
  const grande = lado * SUPER;
  const formas = pecas(grande, escala);
  // Acumula cobertura por pixel final, em vez de guardar a imagem gigante.
  const cobertura = new Float32Array(lado * lado);

  for (let gy = 0; gy < grande; gy++) {
    const y = gy + 0.5;
    const destY = (gy / SUPER) | 0;
    for (let gx = 0; gx < grande; gx++) {
      const x = gx + 0.5;
      for (const f of formas) {
        if (dentro(x, y, f.x0, f.y0, f.x1, f.y1, f.r)) {
          cobertura[destY * lado + ((gx / SUPER) | 0)] += 1;
          break;
        }
      }
    }
  }

  const porPixel = SUPER * SUPER;
  const linhas = Buffer.alloc(lado * (1 + lado * 3));
  let p = 0;
  for (let y = 0; y < lado; y++) {
    linhas[p++] = 0; // filtro "none"
    for (let x = 0; x < lado; x++) {
      const a = cobertura[y * lado + x] / porPixel;
      for (let ch = 0; ch < 3; ch++) {
        linhas[p++] = Math.round(FUNDO[ch] + (DOURADO[ch] - FUNDO[ch]) * a);
      }
    }
  }
  return linhas;
}

// ------------------------------------------------------------------ PNG
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function png(lado, linhas) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8;  // 8 bits por canal
  ihdr[9] = 2;  // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(linhas, { level: 9 })),
    bloco("IEND", Buffer.alloc(0))
  ]);
}

// O iOS aplica a propria mascara arredondada, entao o icone e quadrado cheio.
// O maskable usa a marca menor, para caber na zona segura de 80% do Android.
const ICONES = [
  { arquivo: "icon-180.png", lado: 180, escala: 0.68 },
  { arquivo: "icon-192.png", lado: 192, escala: 0.68 },
  { arquivo: "icon-512.png", lado: 512, escala: 0.68 },
  { arquivo: "icon-512-maskable.png", lado: 512, escala: 0.52 }
];

mkdirSync(SAIDA, { recursive: true });
for (const { arquivo, lado, escala } of ICONES) {
  const dados = png(lado, rasterizar(lado, escala));
  writeFileSync(join(SAIDA, arquivo), dados);
  console.log(arquivo, lado + "x" + lado, dados.length + " bytes");
}
