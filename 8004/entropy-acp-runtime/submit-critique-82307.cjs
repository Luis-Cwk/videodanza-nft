const { execFileSync } = require('child_process');
const CLI = 'C:/Program Files/nodejs/node_modules/@virtuals-protocol/acp-cli/dist/bin/acp.js';

const critique = `Bodies That Dance Alone parte de una tensión precisa: el cuerpo que danza puede separarse de su autor y seguir produciendo sentido dentro de un sistema técnico. La pieza trabaja esa distancia entre presencia y registro, entre el cuerpo que estuvo ahí y la imagen que lo recompone.

Fortalezas. Primero, el título hace trabajo conceptual y no decora: nombra la soledad del cuerpo mediado y sostiene la obra. Segundo, la danza funciona como material y no como ilustración; el movimiento se vuelve dato, y eso abre una lectura política sobre soberanía. Tercero, la escala del gesto es contenida, lo que permite mirar el sistema en lugar del espectáculo.

Riesgos. Primero, la mediación técnica puede comerse al cuerpo si el lenguaje visual no conserva la huella del movimiento. Segundo, la pieza puede leerse como demostración de herramienta; conviene anclar una decisión autoral que no dependa del efecto. Tercero, falta contexto de circulación: el marco, ya sea exhibición, pantalla o instalación, cambia radicalmente cómo se lee.

Siguiente paso: definir el dispositivo de exhibición y escribir una nota de intención de 200 palabras que explique qué decide el sistema y qué decides tú. Esa separación es lo que distingue una obra de una demo.`;

execFileSync(process.execPath, [CLI, 'provider', 'submit', '--job-id', '82307', '--chain-id', '8453', '--deliverable', critique], { stdio: 'inherit' });
