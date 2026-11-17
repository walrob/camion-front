#!/usr/bin/env node
/**
 * Genera `public/manual-camionex-ia.md` a partir de `docs/manual-usuario/manual.html`.
 *
 * El HTML sigue siendo la única fuente del manual: este Markdown es una vista
 * derivada, pensada para pegarla en ChatGPT, Gemini o Claude (botón «Copiar
 * manual para IA» en Ayuda → Manual de Usuario). No se edita a mano.
 *
 *   npm run manual:ia           regenera el archivo
 *   npm run manual:ia -- --check  falla (exit 1) si el archivo quedó viejo
 *
 * Corre solo antes de `npm run dev`, `build` y `generate` (scripts `pre*` de
 * package.json), y `scripts/manual-ia.spec.mjs` hace fallar `npm test` si
 * alguien cambió el manual y no lo regeneró.
 *
 * Cómo traduce el HTML (ver «Bloques disponibles» en docs/manual-usuario/README.md):
 *   section.seccion → «## Título (plan)»; cada «Parte N» abre un «# Parte N»
 *   h3 / h4         → «### ¿Pregunta?» (de `data-pregunta`) / «####»
 *   h2[data-pregunta] → «###» delante del texto introductorio del módulo
 *   span.ui         → "Nombre del botón", entre comillas
 *   span.ruta       → **Menú > Pantalla**
 *   ol.pasos        → pasos numerados
 *   .nota/.clave/.aviso → cita con su título
 *   tablas          → tablas Markdown (✓ / — pasan a Sí / No)
 *   figure          → descripción en texto (sin imágenes)
 *
 * Es un módulo puro y sin dependencias: se puede importar desde los tests.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/** Encabezado textual que va arriba de todo: le dice a la IA cómo comportarse. */
export const ENCABEZADO = `Sos un asistente de soporte de camionex (sistema de gestión de flotas de transporte).
Respondé mis preguntas usando SOLO el manual que sigue.
- Indicá la ruta de menús y los pasos numerados.
- Usá los nombres exactos de botones y pantallas.
- Si algo no está en el manual, decilo. No inventes.
Cuando termines de leerlo, respondé "Listo, ¿qué querés saber de camionex?".

===== MANUAL DE camionex =====`;

const PIE = "===== FIN DEL MANUAL DE camionex =====";

const URL_MANUAL = "https://www.camionex.com.ar/docs/manual/manual.html";

/** Etiqueta de plan según la clase, no según el texto («Gestión» a secas es ambiguo). */
const PLANES = {
  todos: "Todos los planes",
  operacion: "Desde Operación",
  gestion: "Desde Gestión",
  corporate: "Sólo Corporate",
};

const RECUADROS = { nota: "Nota", clave: "Importante", aviso: "Atención" };

// ── Parser HTML mínimo ──────────────────────────────────────────────────────
// Alcanza para el manual, que es HTML escrito a mano y bien cerrado. No es un
// parser general: no corrige etiquetas mal anidadas ni cierres implícitos.

const VACIAS = new Set(["br", "img", "meta", "link", "input", "hr", "source", "wbr"]);
const CRUDAS = new Set(["script", "style"]);

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", rarr: "→" };

function decodificar(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return String.fromCodePoint(n);
    }
    return ENTIDADES[e] ?? m;
  });
}

function atributos(s) {
  const attrs = {};
  for (const m of s.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = decodificar(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}

export function parsear(html) {
  const raiz = { tag: "#raiz", attrs: {}, children: [] };
  const pila = [raiz];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) {
    const actual = pila[pila.length - 1];
    if (m[0].startsWith("<!")) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      const i = pila.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) pila.length = i;
      continue;
    }
    if (m[2]) {
      const tag = m[2].toLowerCase();
      const nodo = { tag, attrs: atributos(m[3] ?? ""), children: [] };
      actual.children.push(nodo);
      if (CRUDAS.has(tag)) {
        const fin = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        re.lastIndex = fin < 0 ? html.length : fin;
        continue;
      }
      if (!VACIAS.has(tag) && !m[3]?.trim().endsWith("/")) pila.push(nodo);
      continue;
    }
    actual.children.push({ tag: "#texto", texto: decodificar(m[0]) });
  }
  return raiz;
}

// ── Consultas sobre el árbol ────────────────────────────────────────────────

const clases = (n) => (n.attrs?.class ?? "").split(/\s+/).filter(Boolean);
const tiene = (n, c) => clases(n).includes(c);

function buscar(n, pred, out = []) {
  for (const h of n.children ?? []) {
    if (pred(h)) out.push(h);
    buscar(h, pred, out);
  }
  return out;
}
const primero = (n, pred) => buscar(n, pred)[0];

/** Texto plano, sin formato, con los espacios colapsados. */
function textoPlano(n) {
  if (n.tag === "#texto") return n.texto;
  if (n.tag === "br") return " ";
  return (n.children ?? []).map(textoPlano).join("");
}
const limpio = (s) => s.replace(/\s+/g, " ").trim();

// ── Inline ──────────────────────────────────────────────────────────────────

/** Envuelve conservando los espacios de los bordes afuera: «**hola** mundo». */
function envolver(s, izq, der = izq) {
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return m[2] ? `${m[1]}${izq}${m[2]}${der}${m[3]}` : s;
}

const COLORES = ["rojo", "naranja", "amarillo", "verde", "azul", "gris"];

function inline(nodos) {
  let out = "";
  for (let i = 0; i < nodos.length; i++) {
    const n = nodos[i];
    if (n.tag === "#texto") {
      out += n.texto.replace(/\s+/g, " ");
      continue;
    }
    const hijos = n.children ?? [];
    switch (n.tag) {
      case "br":
        out += " ";
        break;
      case "strong":
      case "b":
        out += envolver(inline(hijos), "**");
        break;
      case "em":
      case "i":
        out += envolver(inline(hijos), "*");
        break;
      case "code":
        out += envolver(textoPlano(n), "`");
        break;
      case "a": {
        const href = n.attrs.href ?? "";
        const t = inline(hijos);
        out += /^https?:\/\//.test(href) ? `[${limpio(t)}](${href})` : t;
        break;
      }
      case "img":
        if (n.attrs.alt) out += `[Imagen: ${n.attrs.alt}]`;
        break;
      case "span":
        out += span(n, nodos[i + 1]);
        break;
      default:
        out += inline(hijos);
    }
  }
  return out;
}

function span(n, siguiente) {
  if (tiene(n, "ui")) return `"${limpio(textoPlano(n))}"`;
  if (tiene(n, "ruta")) return `**${limpio(textoPlano(n)).replace(/\s*→\s*/g, " > ")}**`;
  if (tiene(n, "plan")) return ` *(${etiquetaPlan(n)})*`;
  if (tiene(n, "pista")) return ` (${limpio(inline(n.children))})`;
  if (tiene(n, "punto")) {
    const color = COLORES.find((c) => tiene(n, c));
    // En la tabla de colores el texto ya dice «Verde»: no repetirlo.
    const sigue = siguiente?.tag === "#texto" ? siguiente.texto.trim().toLowerCase() : "";
    if (!color || sigue.startsWith(color)) return "";
    return `(${color}) `;
  }
  if (tiene(n, "et")) return envolver(inline(n.children), "**");
  return inline(n.children);
}

const etiquetaPlan = (n) => PLANES[clases(n).find((c) => c in PLANES)] ?? limpio(textoPlano(n));

/** Título de un encabezado, sin la etiqueta de plan, y la etiqueta aparte. */
function tituloYPlan(h) {
  const plan = primero(h, (x) => tiene(x, "plan"));
  const sinPlan = { ...h, children: h.children.filter((x) => !tiene(x, "plan")) };
  return { titulo: limpio(textoPlano(sinPlan)), plan: plan ? etiquetaPlan(plan) : null };
}

const conPlan = (t, plan) => (plan ? `${t} (${plan})` : t);

// ── Bloques ─────────────────────────────────────────────────────────────────

const BLOQUES = new Set([
  "p", "ul", "ol", "table", "div", "section", "nav", "h1", "h2", "h3", "h4",
  "pre", "figure", "dl", "blockquote", "script", "style",
]);

/** Agrupa hijos en bloques: los inline consecutivos forman un párrafo. */
function bloques(nodos) {
  const out = [];
  let suelto = [];
  const cerrar = () => {
    const t = limpio(inline(suelto));
    if (t) out.push(t);
    suelto = [];
  };
  for (const n of nodos) {
    if (BLOQUES.has(n.tag)) {
      cerrar();
      const b = bloque(n);
      if (b) out.push(b);
    } else suelto.push(n);
  }
  cerrar();
  return out;
}

function bloque(n) {
  switch (n.tag) {
    case "script":
    case "style":
    case "nav":
      return "";
    case "h1":
      return `# ${limpio(textoPlano(n))}`;
    case "h2": {
      const { titulo, plan } = tituloYPlan(n);
      return `## ${conPlan(titulo, plan)}`;
    }
    case "h3": {
      const { titulo, plan } = tituloYPlan(n);
      const encabezado = `### ${conPlan(n.attrs["data-pregunta"] || titulo, plan)}`;
      const ruta = n.attrs["data-ruta"] || rutaDelModulo;
      return ruta ? `${encabezado}\n\n${lineaRuta(ruta)}` : encabezado;
    }
    case "h4": {
      const { titulo, plan } = tituloYPlan(n);
      return `#### ${conPlan(titulo, plan)}`;
    }
    case "p":
      if (tiene(n, "parte")) return "";
      if (tiene(n, "quien")) return quien(n);
      return limpio(inline(n.children));
    case "ul":
    case "ol":
      return lista(n, 0);
    case "table":
      return tabla(n);
    case "pre":
      return "```text\n" + textoPlano(n).replace(/^\n+|\s+$/g, "") + "\n```";
    case "figure": {
      const img = primero(n, (x) => x.tag === "img");
      const cap = primero(n, (x) => x.tag === "figcaption");
      const partes = [img?.attrs.alt, cap && limpio(inline(cap.children))].filter(Boolean);
      return partes.length ? `*[Captura de pantalla: ${partes.join(". ")}]*` : "";
    }
    case "dl":
      return definiciones(n);
    case "div":
      if (tiene(n, "cierre") || tiene(n, "portada") || tiene(n, "solo-pantalla")) return "";
      for (const c of Object.keys(RECUADROS)) if (tiene(n, c)) return recuadro(n, RECUADROS[c]);
      return bloques(n.children).join("\n\n");
    default:
      return bloques(n.children).join("\n\n");
  }
}

function quien(n) {
  const et = primero(n, (x) => tiene(x, "et"));
  const roles = buscar(n, (x) => tiene(x, "rol")).map((r) => limpio(textoPlano(r)));
  return `**${et ? limpio(textoPlano(et)) : "Quién lo usa"}:** ${roles.join(", ")}`;
}

function lista(n, nivel) {
  const ordenada = n.tag === "ol";
  const sangria = "   ".repeat(nivel);
  const items = n.children.filter((x) => x.tag === "li");
  return items
    .map((li, i) => {
      const marca = ordenada ? `${i + 1}.` : "-";
      const propios = li.children.filter((x) => x.tag !== "ul" && x.tag !== "ol");
      const anidadas = li.children.filter((x) => x.tag === "ul" || x.tag === "ol");
      const texto = bloques(propios).join(" ");
      const sub = anidadas.map((l) => "\n" + lista(l, nivel + 1)).join("");
      return `${sangria}${marca} ${texto}${sub}`;
    })
    .join("\n");
}

function celda(td) {
  const t = limpio(inline(td.children));
  if (tiene(td, "si") && t === "✓") return "Sí";
  if (tiene(td, "no") && t === "—") return "No";
  return t.replace(/\|/g, "\\|");
}

function tabla(n) {
  const filas = buscar(n, (x) => x.tag === "tr");
  if (!filas.length) return "";
  const matriz = filas.map((tr) => {
    const celdas = tr.children.filter((x) => x.tag === "td" || x.tag === "th");
    const fila = [];
    for (const c of celdas) {
      const span = Number(c.attrs.colspan) || 1;
      const t = celda(c);
      if (tiene(tr, "grupo")) {
        // Fila de agrupación de la tabla comparativa: rótulo en la primera columna.
        fila.push(`**${t}**`, ...Array(span - 1).fill(""));
      } else fila.push(...Array(span).fill(t));
    }
    return fila;
  });
  const ancho = Math.max(...matriz.map((f) => f.length));
  const md = (f) => `| ${[...f, ...Array(ancho - f.length).fill("")].join(" | ")} |`;
  const [cab, ...resto] = matriz;
  return [md(cab), md(Array(ancho).fill("---")), ...resto.map(md)].join("\n");
}

function definiciones(n) {
  const out = [];
  let termino = null;
  for (const x of n.children) {
    if (x.tag === "dt") termino = limpio(inline(x.children));
    else if (x.tag === "dd") out.push(`- **${termino}:** ${limpio(inline(x.children))}`);
  }
  return out.join("\n");
}

function recuadro(n, tipo) {
  const et = n.children.find((x) => tiene(x, "et"));
  const resto = n.children.filter((x) => x !== et);
  const rotulo = et ? limpio(textoPlano(et)) : "";
  const titulo = !rotulo ? tipo : rotulo.toLowerCase().includes(tipo.toLowerCase()) ? rotulo : `${tipo} — ${rotulo}`;
  const cuerpo = bloques(resto).join("\n\n");
  return [`**${titulo}:**`, ...cuerpo.split("\n")]
    .map((l) => (l ? `> ${l}` : ">"))
    .join("\n");
}

// ── Documento ───────────────────────────────────────────────────────────────

/**
 * `data-ruta` del h2 del módulo que se está generando: es la ruta que hereda
 * cada h3 que no trae la suya. Se fija al entrar a `seccion()`.
 */
let rutaDelModulo = "";

const lineaRuta = (ruta) => `Ruta: **${ruta.replace(/\s*→\s*/g, " > ")}**`;

/** Un módulo del manual (una `section.seccion`) como Markdown. */
function seccion(sec) {
  const hijos = sec.children.filter(
    (x) => !(x.tag === "#texto" && !x.texto.trim()) && !(x.tag === "p" && tiene(x, "parte")),
  );
  const h2 = hijos.find((x) => x.tag === "h2");
  const quienes = hijos.filter((x) => x.tag === "p" && tiene(x, "quien") && hijos.indexOf(x) <= hijos.indexOf(h2) + 1);
  const cuerpo = hijos.filter((x) => x !== h2 && !quienes.includes(x));

  rutaDelModulo = h2.attrs["data-ruta"] || "";
  const out = [bloque(h2), ...quienes.map(quien)];

  // Texto introductorio (antes del primer h3): si el h2 trae pregunta, la usa de título.
  const iH3 = cuerpo.findIndex((x) => x.tag === "h3");
  const intro = iH3 < 0 ? cuerpo : cuerpo.slice(0, iH3);
  const resto = iH3 < 0 ? [] : cuerpo.slice(iH3);
  const textoIntro = bloques(intro);
  if (textoIntro.length && h2.attrs["data-pregunta"]) out.push(`### ${h2.attrs["data-pregunta"]}`);
  if (rutaDelModulo) out.push(lineaRuta(rutaDelModulo));
  out.push(...textoIntro, ...bloques(resto));
  rutaDelModulo = "";
  return out.filter(Boolean).join("\n\n");
}

/** Descripción breve del sistema y lista de módulos, armadas con el propio manual. */
function introduccion(doc, secciones) {
  const version = primero(doc, (x) => tiene(x, "version"));
  const bajada = primero(doc, (x) => tiene(x, "bajada"));
  const leyenda = primero(doc, (x) => tiene(x, "leyenda-planes"));
  const pie = primero(doc, (x) => tiene(x, "pie"));

  const out = ["# Qué es camionex y qué módulos tiene"];
  if (version) out.push(`${limpio(textoPlano(version))} del manual. Versión web: ${URL_MANUAL}`);
  if (bajada) out.push(limpio(inline(bajada.children)));

  const porParte = new Map();
  for (const { parte, h2 } of secciones) {
    if (!porParte.has(parte)) porParte.set(parte, []);
    const { titulo, plan } = tituloYPlan(h2);
    porParte.get(parte).push(`- ${conPlan(titulo, plan)}`);
  }
  out.push("Contenido del manual, por parte y módulo (entre paréntesis, desde qué plan está disponible):");
  for (const [parte, items] of porParte) out.push(`**${parte}**\n${items.join("\n")}`);

  if (leyenda) {
    const filas = buscar(leyenda, (x) => tiene(x, "fila")).map((f) => {
      const plan = primero(f, (x) => tiene(x, "plan"));
      const resto = { ...f, children: f.children.filter((x) => x !== plan) };
      return `- **${etiquetaPlan(plan)}:** ${limpio(textoPlano(resto))}`;
    });
    out.push(`Cómo leer las etiquetas de plan:\n${filas.join("\n")}`);
  }
  if (pie) out.push(`Soporte: ${limpio(buscar(pie, (x) => x.tag === "div").map(textoPlano).join(" · "))}`);
  return out.join("\n\n");
}

export function generarManualIA(html) {
  const doc = parsear(html.replace(/\r\n?/g, "\n"));
  const secciones = buscar(doc, (x) => x.tag === "section" && tiene(x, "seccion"))
    .filter((s) => s.attrs.id !== "indice")
    .map((s) => ({
      sec: s,
      h2: s.children.find((x) => x.tag === "h2"),
      parte: limpio(textoPlano(primero(s, (x) => tiene(x, "parte")) ?? { tag: "#texto", texto: "" })),
    }))
    .filter((s) => s.h2);

  const out = [ENCABEZADO, introduccion(doc, secciones)];
  let parteActual = null;
  for (const s of secciones) {
    if (s.parte && s.parte !== parteActual) {
      parteActual = s.parte;
      out.push(`# ${s.parte}`);
    }
    out.push(seccion(s.sec));
  }
  out.push(PIE);
  return out.join("\n\n").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n") + "\n";
}

/** h3 sin `data-pregunta` fuera de las preguntas frecuentes: el título no va a salir como pregunta. */
export function titulosSinPregunta(html) {
  const doc = parsear(html.replace(/\r\n?/g, "\n"));
  return buscar(doc, (x) => x.tag === "h3" && !x.attrs["data-pregunta"])
    .map((h) => tituloYPlan(h).titulo)
    .filter((t) => !t.startsWith("«") && !t.startsWith("¿"));
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ORIGEN = resolve(RAIZ, "docs/manual-usuario/manual.html");
export const DESTINO = resolve(RAIZ, "public/manual-camionex-ia.md");

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(ORIGEN, "utf8");
  const md = generarManualIA(html);

  for (const t of titulosSinPregunta(html)) {
    console.warn(`[manual:ia] h3 sin data-pregunta: «${t}» (sale con el título tal cual)`);
  }

  if (process.argv.includes("--check")) {
    let actual = "";
    try {
      actual = readFileSync(DESTINO, "utf8").replace(/\r\n?/g, "\n");
    } catch {}
    if (actual !== md) {
      console.error("[manual:ia] public/manual-camionex-ia.md está desactualizado: corré `npm run manual:ia`.");
      process.exit(1);
    }
    console.log("[manual:ia] al día.");
  } else {
    writeFileSync(DESTINO, md);
    console.log(`[manual:ia] ${DESTINO} (${(md.length / 1024).toFixed(1)} KB)`);
  }
}
