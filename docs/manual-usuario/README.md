# Manual de Usuario — CamioNex

Fuente del manual **y** lo que ve el usuario: no hay copia ni build intermedio.

```
docs/manual-usuario/
  manual.html   ← el fuente: acá se edita todo
  img/          ← capturas de pantalla (opcional)
  README.md
```

## Cómo se publica

Nitro sirve esta carpeta tal cual bajo `/docs/manual`
(`nitro.publicAssets` en [nuxt.config.ts](../../nuxt.config.ts)), y la página
[manual-usuario.vue](../../pages/manual-usuario.vue) (menú lateral → sección
**Ayuda** → **Manual de Usuario**) lo muestra en un `iframe` apuntando a
`/docs/manual/manual.html`, con un botón para abrirlo en una pestaña aparte.

**Editar `manual.html` y deployar. Nada más.**

- El `iframe` aísla los estilos del manual de los de Vuetify.
- Va bajo `/docs/manual` y no `/manual` a propósito: Nitro matchea los
  `publicAssets` por prefijo, así que un `baseURL: "/manual"` se comería también
  la ruta `/manual-usuario` de la app y la dejaría en 404.
- La barra azul con el tip de impresión se oculta sola dentro del `iframe`
  (adentro de la app, `Ctrl+P` imprimiría la app, no el manual). Quien quiera el
  PDF abre el manual en su pestaña y lo imprime desde ahí.
- El **chofer** no llega a `/manual-usuario` (el middleware lo devuelve a
  `/chofer`): su acceso es el link del pie de `pages/chofer/index.vue`, que
  apunta al archivo estático directo.
- El logo de la portada se toma de `/images/logos/logo.png`, el mismo que usa
  la app: no hay copia que mantener sincronizada.

## Alcance

Este manual es **para el cliente**. El panel de plataforma (superadmin) no se
documenta acá ni se menciona: quien lo opera no lo aprende de un manual público.

## Actualizarlo cuando se suma una funcionalidad

1. Buscar la sección que corresponda dentro de `manual.html`.
   **Las secciones se numeran solas por CSS**: al insertar, mover o borrar una,
   no hay que renumerar nada, y el índice se rearma solo al abrir el archivo.
2. Escribir el texto. Si la funcionalidad depende del plan, etiquetar el
   `<h2>`/`<h3>` (o la fila de la tabla) con la etiqueta que corresponda:

   | Etiqueta HTML | Se ve como | Espeja en `types/plan.ts` |
   |---|---|---|
   | `<span class="plan todos">Todos los planes</span>` | verde | features base |
   | `<span class="plan operacion">Desde Operación</span>` | azul | grupo Operación |
   | `<span class="plan gestion">Desde Gestión</span>` | naranja | grupo Gestión |
   | `<span class="plan corporate">Corporate</span>` | violeta | grupo Corporate |

3. Si la funcionalidad va en la tabla comparativa (sección **Los planes y qué
   incluye cada uno**), agregar también la fila ahí.
4. Si cambian los roles de una sección, actualizar la tabla **Quién ve qué**
   (Parte 4), que espeja los `roles` de
   [`sidebarItem.ts`](../../components/layout/full/vertical-sidebar/sidebarItem.ts).
5. Actualizar la versión en la portada y en el cierre (`Versión D.M.AAAA`).
6. Cada `<h3>` nuevo lleva `data-pregunta` y, si su pantalla no es la del
   módulo, `data-ruta` (ver **Versión para IA**, más abajo). Los títulos de
   las preguntas frecuentes no lo necesitan: ya son preguntas.

## Versión para IA (`public/manual-camionex-ia.md`)

En **Ayuda → Manual de Usuario** está el botón **📋 Copiar manual para IA**
([CopiarParaIA.vue](../../components/shared/CopiarParaIA.vue)): copia el manual
entero en Markdown para que el cliente lo pegue en su propio ChatGPT, Gemini o
Claude. Al lado, **Descargar .md** baja el mismo archivo. Sin costo de IA para
nosotros. También lo enlaza [`public/llms.txt`](../../public/llms.txt).

Ese Markdown **no se edita a mano**: lo genera
[`scripts/manual-ia.mjs`](../../scripts/manual-ia.mjs) a partir de `manual.html`.

| Cuándo se regenera | Cómo |
|---|---|
| A mano | `npm run manual:ia` |
| Antes de `npm run dev`, `dev:host`, `build` y `generate` | scripts `pre*` de `package.json` |
| Si alguien se olvidó | `npm test` falla (`scripts/manual-ia.spec.mjs`) hasta que se regenere y se commitee |
| En CI | `npm run manual:ia -- --check` sale con error si quedó viejo |

Lo que el generador necesita del HTML:

- `data-pregunta="¿Cómo …?"` en cada `<h3>`: es el título de la tarea en la
  versión para IA. En un `<h2>`, titula el párrafo introductorio del módulo.
- `data-ruta="Flota → Mantenimiento"` en el `<h2>` del módulo: la ruta de menús
  que se imprime debajo de cada tarea. Un `<h3>` lleva la suya si cambia
  (otra pestaña, otra pantalla).
- El resto sale de las clases de siempre: `ui` → "Botón", `ruta` → **Menú > Pantalla**,
  `pasos` → pasos numerados, recuadros → citas, tablas → tablas.

Si falta un `data-pregunta`, el script avisa por consola y el test falla.

> La fuente de verdad del gating por plan es el enum `Feature` de
> [`types/plan.ts`](../../types/plan.ts) en el front, y los guards del backend.
> Si ahí cambia el gating, cambia la etiqueta acá.

## Bloques disponibles

```html
<div class="nota">  <span class="et">Título</span> … </div>   <!-- gris, aclaración -->
<div class="clave"> <span class="et">Título</span> … </div>   <!-- azul, concepto importante -->
<div class="aviso"> <span class="et">Título</span> … </div>   <!-- naranja, cuidado / límite -->

<ol class="pasos"> <li>…</li> </ol>                            <!-- pasos numerados en círculo -->

<span class="ui">Guardar</span>                                <!-- nombre literal de un botón -->
<span class="ruta">Operación → Viajes</span>                   <!-- ruta de navegación -->
<span class="punto verde"></span>                              <!-- puntito de estado: rojo/naranja/amarillo/verde/azul/gris -->

<p class="quien"><span class="et">Quién lo usa</span>          <!-- roles de la sección -->
  <span class="rol">Despachante</span></p>

<pre class="flujo">…</pre>                                     <!-- diagrama ASCII -->

<figure>
  <img src="img/archivo.png" alt="…">
  <figcaption>Epígrafe.</figcaption>
</figure>
```

## Capturas

Todavía no tiene ninguna: el manual se escribió para leerse sin ellas. Si se
agregan, van en `img/` con nombres descriptivos y se insertan con `<figure>`.
Las verticales (formularios angostos y altos) conviene marcarlas
`<figure class="angosta">` para que no ocupen una página entera al imprimir.
