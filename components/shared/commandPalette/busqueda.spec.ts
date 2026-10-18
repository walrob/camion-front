import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sidebarItems from "~/components/layout/full/vertical-sidebar/sidebarItem";
import { ACCIONES_DE_ALTA } from "~/components/layout/full/vertical-sidebar/accionesDeAlta";
import { indexar, normalizar, prepararConsulta, puntaje, raiz } from "./busqueda";
import { indiceDelManual } from "./manual";

/**
 * Se prueba con los títulos reales (menú, acciones y el manual leído del
 * archivo), no con ejemplos inventados: lo que importa es que las frases que
 * escribe la gente encuentren lo que existe hoy.
 */
const manual = indiceDelManual(
  readFileSync(new URL("../../../docs/manual-usuario/manual.html", import.meta.url), "utf8"),
);

const catalogo = [
  ...ACCIONES_DE_ALTA.map((a) => ({ grupo: "Acciones", titulo: a.title, indice: indexar(a.title, a.keywords) })),
  ...sidebarItems
    .filter((i) => i.to && i.title)
    .map((i) => ({ grupo: "Ir a", titulo: i.title!, indice: indexar(i.title!, i.keywords) })),
  ...manual.map((s) => ({ grupo: "Manual", titulo: s.titulo, indice: indexar(s.titulo, s.keywords) })),
];

/** Los mejores resultados de cada grupo, como «Grupo: Título». */
function buscar(texto: string, porGrupo = 3): string[] {
  const c = prepararConsulta(texto);
  const puntuados = catalogo
    .map((x) => ({ ...x, s: puntaje(c, x.indice) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return ["Acciones", "Ir a", "Manual"].flatMap((g) =>
    puntuados
      .filter((x) => x.grupo === g)
      .slice(0, porGrupo)
      .map((x) => `${g}: ${x.titulo}`),
  );
}

describe("normalización y raíces", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(normalizar("Configuración")).toBe("configuracion");
  });

  it("une las formas de una misma palabra", () => {
    expect(raiz("anulo")).toBe(raiz("anular"));
    expect(raiz("cobros")).toBe(raiz("cobro"));
    expect(raiz("camiones")).toBe(raiz("camion"));
    expect(raiz("choferes")).toBe(raiz("chofer"));
    expect(raiz(normalizar("facturación"))).toBe(raiz("facturas"));
  });
});

describe("índice del manual", () => {
  it("se arma leyendo el manual, con las mismas anclas que su índice", () => {
    expect(manual.length).toBeGreaterThan(20);
    expect(manual[0]).toMatchObject({ id: "seccion-1", titulo: "Qué es CamioNex" });
    // La etiqueta de plan no es parte del título.
    expect(manual.map((s) => s.titulo)).toContain("Viajes");
  });
});

describe("frases reales", () => {
  it("«configuración» sin tilde", () => {
    const r = buscar("configuracion");
    expect(r[0]).toBe("Ir a: Configuración");
    expect(r).toContain("Manual: Configuración: adaptar el sistema a tu empresa");
  });

  it("«nuevo pedido» → Nuevo viaje (pedido = viaje)", () => {
    expect(buscar("nuevo pedido")[0]).toBe("Acciones: Nuevo viaje");
  });

  it("«agregar usuario» → Invitar a alguien y Equipo", () => {
    const r = buscar("agregar usuario");
    expect(r[0]).toBe("Acciones: Invitar a alguien");
    expect(r).toContain("Ir a: Equipo");
  });

  it("«cómo doy de alta un camión» → Nuevo camión", () => {
    const r = buscar("cómo doy de alta un camión");
    expect(r[0]).toBe("Acciones: Nuevo camión");
  });

  it("«cómo anulo un cobro» exige las dos palabras (o sinónimos)", () => {
    // En CamioNex no hay cobros que anular: no puede aparecer cualquier cosa
    // que sólo hable de pagos.
    const r = buscar("cómo anulo un cobro");
    expect(r.every((x) => !x.startsWith("Ir a: Mi plan"))).toBe(true);
  });

  it("imprime lo que devuelve cada frase", () => {
    for (const frase of [
      "cómo anulo un cobro",
      "agregar usuario",
      "configuración",
      "nuevo pedido",
      "cómo doy de alta un camión",
      "cargar combustible",
      "rendicion",
      "vencimientos",
      "olvidé mi contraseña",
      "conf",
    ]) {
      console.log(`\n«${frase}»\n  ${buscar(frase).join("\n  ") || "(nada)"}`);
    }
  });
});
