/**
 * Búsqueda tolerante del buscador (Ctrl+K).
 *
 * La gente no escribe títulos de menú: escribe «cómo doy de alta un camión» o
 * «configuracion» sin tilde. Para que eso encuentre «Nuevo camión» y
 * «Configuración» la consulta y los títulos pasan por lo mismo:
 *
 * 1. `normalizar`: sin tildes, sin mayúsculas, sin signos.
 * 2. Se descartan las palabras vacías («cómo», «un», «quiero»…).
 * 3. Cada palabra se reduce a una raíz aproximada («anulo» ↔ «anular»,
 *    «cobros» ↔ «cobro») y se expande con unos pocos sinónimos del dominio.
 *
 * Tienen que aparecer **todas** las palabras de la consulta (o un sinónimo).
 * Pesa más una coincidencia en el título, y más cuanto más al principio; las
 * `keywords` sirven para encontrar pero casi no ordenan.
 *
 * Es un módulo puro, sin Vue ni Nuxt, para poder probarlo con frases reales
 * (`busqueda.spec.ts`).
 */

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PALABRAS_VACIAS = new Set(
  (
    "a al como con cual cuales de del donde e el en es esta este esto hacer " +
    "hago hay la las le lo los me mi mis necesito no o para poder por puede " +
    "puedo que queria quiero quisiera se si su sus tengo tu tus un una unas " +
    "unos y ya dar doy"
  ).split(" "),
);

/** Terminaciones de plural, y después las de verbo, género y derivación. */
const SUFIJOS = [
  "amiento", "imiento", "acion", "icion", "cion", "sion", "mente",
  "ando", "iendo", "ada", "ida", "ado", "ido", "ar", "er", "ir", "a", "e", "o",
];

/**
 * Raíz aproximada de una palabra ya normalizada. No es un stemmer de verdad:
 * sólo tiene que dar lo mismo para las formas que la gente usa de una palabra
 * («factura», «facturas», «facturar», «facturación» → «factur»).
 */
export function raiz(palabra: string): string {
  let p = palabra;
  // Plural: «camiones» → «camion», «viajes» → «viaj», «pagos» → «pago».
  if (p.length > 4 && p.endsWith("es")) p = p.slice(0, -2);
  else if (p.length > 3 && p.endsWith("s")) p = p.slice(0, -1);
  for (const s of SUFIJOS) {
    if (p.endsWith(s) && p.length - s.length >= 3) return p.slice(0, -s.length);
  }
  return p;
}

/** Sinónimos del dominio: cualquiera de un grupo encuentra a los demás. */
const GRUPOS_DE_SINONIMOS = [
  // «Invitar»: a un usuario se lo da de alta invitándolo (pantalla Equipo).
  "agregar crear nuevo cargar alta anadir registrar generar sumar invitar",
  "borrar eliminar anular cancelar quitar baja sacar",
  "viaje pedido orden flete",
  "camion unidad vehiculo tractor",
  "chofer conductor camionero",
  "empleado personal legajo trabajador rrhh",
  "usuario acceso miembro integrante",
  "rendicion liquidacion",
  "gasto comprobante ticket",
  "combustible gasoil diesel nafta surtidor",
  "mantenimiento service taller reparacion",
  "documento papel archivo",
  "incidente problema siniestro accidente novedad",
  "configuracion ajuste preferencia opcion",
  "plan suscripcion abono",
  "pago cobro factura facturacion cuota",
  "contrasena clave password",
  "indicador estadistica reporte metrica",
  "mensaje chat",
  "alerta aviso notificacion",
].map((g) => g.split(" ").map(raiz));

const SINONIMOS = new Map<string, Set<string>>();
for (const grupo of GRUPOS_DE_SINONIMOS) {
  for (const r of grupo) {
    const set = SINONIMOS.get(r) ?? new Set<string>();
    grupo.forEach((x) => x !== r && set.add(x));
    SINONIMOS.set(r, set);
  }
}

interface Palabra {
  texto: string;
  raiz: string;
}

const palabras = (texto: string): Palabra[] =>
  normalizar(texto)
    .split(" ")
    .filter((p) => p && !PALABRAS_VACIAS.has(p))
    .map((p) => ({ texto: p, raiz: raiz(p) }));

export interface Consulta {
  texto: string;
  palabras: (Palabra & { sinonimos: Set<string> })[];
}

export function prepararConsulta(texto: string): Consulta {
  const norm = normalizar(texto);
  let lista = palabras(texto);
  // «de», «a»: si la consulta es sólo palabras vacías, se buscan tal cual.
  if (!lista.length && norm) {
    lista = norm.split(" ").map((p) => ({ texto: p, raiz: raiz(p) }));
  }
  return {
    texto: norm,
    palabras: lista.map((p) => ({
      ...p,
      sinonimos: SINONIMOS.get(p.raiz) ?? new Set(),
    })),
  };
}

export interface Indexado {
  titulo: string;
  palabrasTitulo: Palabra[];
  palabrasExtra: Palabra[];
}

export function indexar(titulo: string, keywords = ""): Indexado {
  return {
    titulo: normalizar(titulo),
    palabrasTitulo: palabras(titulo),
    palabrasExtra: palabras(keywords),
  };
}

/** 1 = misma raíz; menos para prefijo (todavía escribiendo) o sinónimo. */
function coincidencia(q: Consulta["palabras"][number], t: Palabra): number {
  if (q.raiz === t.raiz) return 1;
  if (q.texto.length >= 2 && t.texto.startsWith(q.texto)) return 0.8;
  if (q.sinonimos.has(t.raiz)) return 0.75;
  if (q.raiz.length >= 4 && t.raiz.startsWith(q.raiz)) return 0.7;
  return 0;
}

/**
 * Puntaje de un ítem para la consulta; 0 = no aparece. Cada palabra suma lo
 * de su mejor coincidencia: hasta 13 en el título (10 + bonus por posición),
 * hasta 3 en las keywords.
 */
export function puntaje(consulta: Consulta, item: Indexado): number {
  if (!consulta.palabras.length) return 0;
  let total = 0;
  for (const q of consulta.palabras) {
    let mejor = 0;
    item.palabrasTitulo.forEach((t, i) => {
      const c = coincidencia(q, t);
      if (c) mejor = Math.max(mejor, c * 10 + Math.max(0, 3 - i));
    });
    for (const t of item.palabrasExtra) {
      mejor = Math.max(mejor, coincidencia(q, t) * 3);
    }
    if (!mejor) return 0;
    total += mejor;
  }
  if (item.titulo === consulta.texto) total += 10;
  else if (item.titulo.startsWith(consulta.texto)) total += 5;
  return total;
}
