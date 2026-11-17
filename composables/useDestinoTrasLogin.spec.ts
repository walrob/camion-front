import { describe, expect, it } from 'vitest'
import { destinoTrasLogin } from './useDestinoTrasLogin'

describe('Destino después del login', () => {
  it('vuelve a la ruta interna que se estaba abriendo, con su query', () => {
    expect(
      destinoTrasLogin('/admin/viajes?nuevo=1&utm_source=email', '/admin'),
    ).toBe('/admin/viajes?nuevo=1&utm_source=email')
  })

  it.each([
    ['sin destino', undefined],
    ['un array de la query', ['/admin/viajes']],
    ['URL absoluta', 'https://otro-sitio.com/login'],
    ['URL sin esquema', '//otro-sitio.com'],
    ['barra invertida', '/\\otro-sitio.com'],
    ['una pantalla de acceso', '/auth/login'],
  ])('%s → la página de inicio', (_caso, redirect) => {
    expect(destinoTrasLogin(redirect, '/admin')).toBe('/admin')
  })
})
