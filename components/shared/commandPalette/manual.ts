/**
 * Índice del manual de usuario para el buscador (Ctrl+K).
 *
 * Se arma leyendo el propio `manual.html`, no una lista a mano: si el manual
 * suma o mueve una sección, el buscador la encuentra sin tocar nada.
 *
 * Replica el índice automático del manual (el `<script>` del final de
 * `docs/manual-usuario/manual.html`): recorre `section.seccion` en orden,
 * saltea `#indice` y las que no tienen `<h2>`, y a las que no traen `id` les
 * pone `seccion-N`. Es ese id el que se usa como ancla.
 *
 * Se parsea el texto y no con `DOMParser` para poder probarlo en Node.
 */

export interface SeccionDelManual {
  id: string;
  titulo: string;
  /** Subtítulos (`h3`/`h4`) y la parte del manual: para encontrar, no para ordenar. */
  keywords: string;
}

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", laquo: "«", raquo: "»",
};

/** Texto de un fragmento HTML, sin la etiqueta de plan («Desde Operación»). */
function texto(html: string): string {
  return html
    .replace(/<span class="plan[^"]*"[^>]*>[\s\S]*?<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|\w+);/g, (m, e: string) =>
      e.startsWith("#") ? String.fromCharCode(Number(e.slice(1))) : (ENTIDADES[e] ?? m),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function indiceDelManual(html: string): SeccionDelManual[] {
  const secciones: SeccionDelManual[] = [];
  const partes = html.split(/<section\b/).slice(1);
  let n = 0;

  for (const parte of partes) {
    const apertura = parte.slice(0, parte.indexOf(">"));
    if (!/class="[^"]*\bseccion\b/.test(apertura)) continue;
    const cuerpo = parte.slice(0, parte.indexOf("</section>"));
    const id = apertura.match(/\bid="([^"]+)"/)?.[1];
    if (id === "indice") continue;

    const h2 = cuerpo.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
    if (!h2) continue;
    n++;

    const subtitulos = [...cuerpo.matchAll(/<h[34]\b[^>]*>([\s\S]*?)<\/h[34]>/g)].map(
      (m) => texto(m[1]),
    );
    const eyebrow = cuerpo.match(/<p class="parte"[^>]*>([\s\S]*?)<\/p>/);

    secciones.push({
      id: id ?? `seccion-${n}`,
      titulo: texto(h2[1]),
      keywords: [...subtitulos, eyebrow ? texto(eyebrow[1]) : ""].join(" "),
    });
  }
  return secciones;
}
