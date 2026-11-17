import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DESTINO,
  ENCABEZADO,
  ORIGEN,
  generarManualIA,
  titulosSinPregunta,
} from "./manual-ia.mjs";

const html = readFileSync(ORIGEN, "utf8");
const md = generarManualIA(html);

describe("manual para IA (public/manual-camionex-ia.md)", () => {
  it("está al día con docs/manual-usuario/manual.html", () => {
    // Si falla: cambió el manual y no se regeneró. Corré `npm run manual:ia`.
    const publicado = readFileSync(DESTINO, "utf8").replace(/\r\n?/g, "\n");
    expect(publicado === md, "Corré `npm run manual:ia` y commiteá el .md").toBe(true);
  });

  it("arranca con el encabezado textual para la IA", () => {
    expect(md.startsWith(ENCABEZADO)).toBe(true);
  });

  it("cada tarea (h3) sale como pregunta", () => {
    expect(titulosSinPregunta(html)).toEqual([]);
  });

  it("no deja etiquetas HTML sueltas", () => {
    const sinCodigo = md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
    expect(sinCodigo).not.toMatch(/<\/?[a-z][a-z0-9]*[\s>]/i);
  });

  it("termina con las preguntas frecuentes y el glosario", () => {
    const iFaq = md.indexOf("\n## Preguntas frecuentes\n");
    const iGlosario = md.indexOf("\n## Glosario\n");
    expect(iFaq).toBeGreaterThan(0);
    expect(iGlosario).toBeGreaterThan(iFaq);
    expect(md.slice(iGlosario + 1)).not.toMatch(/\n## /);
  });

  it("traduce los bloques del manual", () => {
    expect(md).toContain('1. Menú **Operación > Viajes** → botón "Nuevo viaje".');
    expect(md).toContain("Ruta: **Flota > Mantenimiento > pestaña Órdenes**");
    expect(md).toContain("| Flota, Documentos y Alertas | Sí | Sí | Sí | Sí |");
    expect(md).toMatch(/^> \*\*Atención — Sobre el historial:\*\*$/m);
  });
});
