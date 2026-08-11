import { describe, expect, it } from 'vitest'
import {
  RUTAS_PUBLICAS_POR_PREFIJO,
  esRutaPublica,
} from './useRutasPublicas'

/**
 * Riesgo R7.1 del plan SaaS: si la raíz `/` se comparara con `startsWith`,
 * **toda la aplicación quedaría pública**, porque cualquier ruta empieza con
 * `/`. Es el error más probable de esta fase y el más caro: no rompe nada
 * visible, sólo deja el backoffice abierto.
 *
 * Estos tests existen para que ese error no pueda volver sin que algo falle.
 */
describe('Rutas públicas', () => {
  describe('R7.1 — la raíz no puede abrir el sistema entero', () => {
    it('la landing es pública', () => {
      expect(esRutaPublica('/')).toBe(true)
    })

    it.each([
      '/admin',
      '/admin/viajes',
      '/admin/liquidaciones',
      '/admin/indicadores',
      '/chofer',
      '/chofer/viaje/123',
      '/initial',
      '/estado-plan',
      '/upgrade/settlements',
    ])('%s NO es pública', (ruta) => {
      expect(esRutaPublica(ruta)).toBe(false)
    })

    it('ninguna ruta privada se cuela por culpa de la raíz', () => {
      // Barrido: cualquier cosa que arranque con `/` y no esté declarada tiene
      // que dar false. Si alguien vuelve a poner `/` en la lista de prefijos,
      // este test cae.
      const privadas = [
        '/a',
        '/x/y/z',
        '/admin/cualquier/cosa',
        '/api',
        '/billing',
      ]
      for (const r of privadas) {
        expect(esRutaPublica(r)).toBe(false)
      }
    })
  })

  describe('Rutas públicas declaradas', () => {
    it.each([...RUTAS_PUBLICAS_POR_PREFIJO])('%s es pública', (ruta) => {
      expect(esRutaPublica(ruta)).toBe(true)
    })

    it('las subrutas de una pública también lo son', () => {
      expect(esRutaPublica('/invite/abc-123')).toBe(true)
      expect(esRutaPublica('/planes/comparar')).toBe(true)
    })

    it('la barra final no cambia el resultado', () => {
      expect(esRutaPublica('/planes/')).toBe(true)
      expect(esRutaPublica('/admin/')).toBe(false)
    })

    it('un prefijo parecido pero distinto no pasa', () => {
      // `/invitados` NO debe colarse por empezar igual que `/invite`.
      expect(esRutaPublica('/invitados')).toBe(false)
      expect(esRutaPublica('/planesx')).toBe(false)
      expect(esRutaPublica('/contactos-internos')).toBe(false)
    })
  })
})
