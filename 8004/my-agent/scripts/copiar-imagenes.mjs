// Copia las dos imagenes generadas a public/ y reporta medidas para comprobar
// que el avatar es 1:1 y el banner 16:9 antes de publicarlos en el manifiesto.
import { copyFileSync, readFileSync, statSync } from 'node:fs';

const PARES = [
  ['C:/Users/petra/Downloads/Gemini_Generated_Image_cbqfztcbqfztcbqf.jpg', 'public/avatar-agent.jpg', 'avatar'],
  ['C:/Users/petra/Downloads/Gemini_Generated_Image_svixw4svixw4svix.jpg', 'public/featured-agent-check.jpg', 'banner'],
];

function medidas(ruta) {
  const b = readFileSync(ruta);
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i++; continue; }
    const marca = b[i + 1];
    if (marca >= 0xc0 && marca <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marca)) {
      return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    }
    const largo = b.readUInt16BE(i + 2);
    if (!largo) break;
    i += 2 + largo;
  }
  return null;
}

for (const [origen, destino, tipo] of PARES) {
  copyFileSync(origen, destino);
  const m = medidas(destino);
  const mb = (statSync(destino).size / 1024 / 1024).toFixed(2);
  console.log(`${tipo}: ${destino} ${mb} MB${m ? ` | ${m.ancho}x${m.alto} ratio ${(m.ancho / m.alto).toFixed(3)}` : ' | medidas desconocidas'}`);
  if (m && tipo === 'avatar' && m.ancho !== m.alto) console.log('  OJO: el avatar no es cuadrado');
  if (m && tipo === 'banner' && Math.abs(m.ancho / m.alto - 16 / 9) > 0.05) console.log('  OJO: el banner no es 16:9');
}
