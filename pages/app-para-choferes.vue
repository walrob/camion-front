<script setup lang="ts">
/**
 * Página temática: la app para choferes de camión.
 *
 * Ataca "app para choferes de camión", "checklist pre-viaje digital" y
 * "app para transportistas". La busca el dueño o el jefe de tráfico que quiere
 * sacar al chofer del cuaderno y del grupo de WhatsApp, y su duda principal no
 * es qué hace la app sino **si el chofer la va a usar**. La página está
 * escrita para responder eso.
 *
 * Todo lo que se describe sale de la Parte 3 del manual (la app del chofer).
 * Se instala desde el navegador, no desde una tienda: se dice tal cual.
 */
definePageMeta({ layout: "public" });

const SECCIONES = [
  { id: "problema", titulo: "Por qué fallan las apps para choferes" },
  { id: "que-hace", titulo: "Qué hace el chofer desde el celular" },
  { id: "checklist", titulo: "El checklist antes de salir" },
  { id: "sin-senal", titulo: "Sin señal, igual funciona" },
  { id: "oficina", titulo: "Qué ve la oficina" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

/** Lo que el chofer hace en un viaje, en el orden en que pasa. */
const PASOS = [
  {
    paso: "Recibe el viaje",
    detalle: "Aparece solo en la pantalla de inicio cuando la oficina lo asigna.",
  },
  {
    paso: "Completa el checklist",
    detalle: "Luces, frenos, cubiertas, documentación: con foto y firma en pantalla.",
  },
  {
    paso: "Inicia el viaje",
    detalle: "Con el odómetro de salida. La oficina lo ve en curso al instante.",
  },
  {
    paso: "Carga gastos y adelantos",
    detalle: "Combustible, peajes, viáticos, reparaciones: con la foto del ticket.",
  },
  {
    paso: "Reporta incidentes",
    detalle: "Rotura, accidente, problema con la carga: con foto, audio o video.",
  },
  {
    paso: "Finaliza",
    detalle: "Con el odómetro de llegada. Los kilómetros y la rendición salen solos.",
  },
];

const FAQ = [
  {
    p: "¿Qué tiene que tener una app para choferes de camión?",
    r: "Tiene que funcionar sin señal, cargarse con una mano y en pocos toques, y permitir dictar por voz en vez de escribir. Lo demás —checklist, gastos, incidentes, documentos— sirve sólo si se cumplen esas tres cosas, porque una app que el chofer abandona en la primera semana no registra nada.",
  },
  {
    p: "¿La app del chofer funciona sin señal?",
    r: "Sí. Todo lo que el chofer carga queda guardado en el celular y se sincroniza solo cuando vuelve la conexión. La pantalla muestra cuántos registros quedan pendientes, y el chofer no tiene que repetir ninguna carga.",
  },
  {
    p: "¿Hay que bajar la app de una tienda?",
    r: "No. Se abre la dirección del sistema en el navegador del celular, se inicia sesión y se instala desde ahí con un toque: queda en la pantalla de inicio como cualquier otra app. Funciona en Android y en iPhone.",
  },
  {
    p: "¿Tiene costo por chofer?",
    r: "No. En todos los planes de CamioNex los choferes son ilimitados: se paga el abono del plan y un precio por vehículo activo, no por persona.",
  },
  {
    p: "¿Reemplaza al grupo de WhatsApp con los choferes?",
    r: "Para lo operativo, sí. La app tiene un chat con la oficina, y lo que se habla ahí queda junto al viaje en vez de perderse entre audios. Los incidentes se reportan con su tipo, su ubicación y la evidencia, y el despachante los ve en un tablero, no en un mensaje que se hunde.",
  },
];

useSeoMeta({
  title: "App para choferes de camión que funciona sin señal",
  description:
    "App para choferes de camión que funciona sin señal: checklist pre-viaje " +
    "con foto y firma, gastos con el ticket, incidentes y documentos. Se " +
    "instala desde el navegador y no cobra por chofer.",
  ogTitle: "App para choferes de camión que funciona sin señal",
  ogDescription:
    "El chofer carga todo desde la cabina, con una mano y aunque no haya " +
    "señal. La oficina lo ve al instante.",
  ogType: "article",
  ogImage: `${SITIO.origen}${SITIO.imagenSocial}`,
  twitterCard: "summary_large_image",
});

useCanonical("/app-para-choferes");

useDatosEstructurados({
  "@context": "https://schema.org",
  "@graph": [
    migasJsonLd([
      { nombre: "Inicio", ruta: "/" },
      { nombre: "App para choferes", ruta: "/app-para-choferes" },
    ]),
    {
      "@type": "FAQPage",
      "@id": `${SITIO.origen}/app-para-choferes#faq`,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.p,
        acceptedAnswer: { "@type": "Answer", text: f.r },
      })),
    },
  ],
});
</script>

<template>
  <LandingPaginaTema
    eyebrow="En la cabina"
    miga="App para choferes"
    titulo="App para choferes de camión que se usa de verdad"
    bajada="Cualquier app sirve en la oficina con wifi. La que importa es la que
            el chofer puede usar en una estación de servicio a las cuatro de la
            mañana, con una mano y sin señal."
    :secciones="SECCIONES"
    cierre-titulo="Sacá al chofer del cuaderno"
    cierre-texto="Choferes ilimitados en todos los planes y una app que se
                  instala desde el navegador en un minuto. Treinta días de
                  prueba con acceso completo, sin tarjeta."
  >
    <h2 id="problema">1. Por qué fallan las apps para choferes</h2>
    <p>
      Casi todas las empresas que probaron una app con sus choferes cuentan lo
      mismo: la primera semana se usó, la segunda menos, y al mes el chofer
      había vuelto al cuaderno y al audio de WhatsApp. Las razones se repiten:
    </p>
    <ul>
      <li>
        <strong>No funciona sin señal.</strong> En medio de la ruta la carga
        falla, el chofer pierde lo que escribió y no lo vuelve a intentar.
      </li>
      <li>
        <strong>Pide demasiado.</strong> Formularios largos, teclado chico,
        campos obligatorios que no aplican. Con guantes o las manos sucias, cada
        campo de más es una carga que no se hace.
      </li>
      <li>
        <strong>No le sirve al chofer.</strong> Si sólo le sirve a la oficina,
        es un trámite. Si además le muestra lo que se le debe y le evita
        discusiones, la usa.
      </li>
    </ul>

    <h2 id="que-hace">2. Qué hace el chofer desde el celular</h2>
    <p>
      En <NuxtLink to="/">CamioNex</NuxtLink> el chofer tiene su propia app,
      hecha para usarse con una mano, con botones grandes y dictado por voz en
      los campos de texto. Un viaje completo, de punta a punta:
    </p>

    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th>Paso</th>
            <th>Qué hace</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in PASOS" :key="p.paso">
            <td>
              <strong>{{ p.paso }}</strong>
            </td>
            <td>{{ p.detalle }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Y lo que más le importa al chofer: arriba de la pantalla del viaje ve
      siempre sus <strong>gastos</strong>, sus <strong>adelantos</strong> y la
      <strong>diferencia</strong> —lo que se le debe o lo que tiene que
      devolver—. Es lo que termina con la discusión al cierre, y lo que
      convierte la carga en algo que le conviene hacer. Cómo se arma esa cuenta
      lo explica la guía de
      <NuxtLink to="/rendicion-de-viajes">rendición de viajes</NuxtLink>.
    </p>

    <h2 id="checklist">3. El checklist antes de salir</h2>
    <p>
      El checklist pre-viaje es la parte que más cambia cuando sale del papel.
      En la app, el chofer recorre los puntos que definió la empresa —luces,
      frenos, cubiertas, aceite, matafuego, documentación, acoplado— y:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Saca la foto donde el punto la pide.</strong> Sin las fotos
          obligatorias no puede firmar, y la pantalla le avisa cuántas faltan.
        </span>
      </li>
      <li>
        <span>
          <strong>Firma con el dedo.</strong> La planilla queda con su firma y
          la hora, imposible de completar a la vuelta.
        </span>
      </li>
      <li>
        <span>
          <strong>Los puntos críticos frenan la salida.</strong> Si falla uno
          marcado como crítico, el viaje no se puede iniciar hasta que el
          despacho lo resuelva.
        </span>
      </li>
      <li>
        <span>
          <strong>Tráfico puede validar antes de liberar la unidad.</strong>
          Cuando algo queda para revisar, el botón de inicio sigue bloqueado
          hasta que el operador lo apruebe.
        </span>
      </li>
    </ul>
    <p>
      Para las empresas que trabajan como Operador Económico Autorizado, la app
      incluye además la planilla OEA de los 7 puntos del vehículo y los
      precintos, con foto y firma.
    </p>

    <h2 id="sin-senal">4. Sin señal, igual funciona</h2>
    <p>
      Es la condición que decide si una app para choferes sobrevive en las rutas
      argentinas. En CamioNex, si no hay datos, el chofer sigue cargando igual:
      todo queda guardado en el teléfono y se sincroniza solo cuando vuelve la
      señal. Arriba ve «Sin conexión» y un contador de registros pendientes;
      cuando llega a cero, ya está todo enviado. No tiene que repetir nada y no
      se pierde nada.
    </p>
    <p>
      Tampoco hay que pasar por una tienda de aplicaciones: se abre la dirección
      del sistema en el navegador del celular, se inicia sesión y se instala con
      un toque. Queda en la pantalla de inicio como cualquier otra app, en
      Android y en iPhone.
    </p>

    <h2 id="oficina">5. Qué ve la oficina</h2>
    <p>Cada cosa que el chofer carga aparece del otro lado en el momento:</p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Viajes en curso</strong> y su estado, sin llamar a nadie.
        </span>
      </li>
      <li>
        <span>
          <strong>Incidentes en un tablero</strong>, con el tipo, la ubicación y
          la evidencia, para atenderlos y dejar registro de cómo se resolvieron.
        </span>
      </li>
      <li>
        <span>
          <strong>Gastos con su comprobante</strong>, que al cerrar el viaje ya
          son la rendición.
        </span>
      </li>
      <li>
        <span>
          <strong>Litros y odómetro de cada carga</strong>, que producen el
          consumo por camión y el
          <NuxtLink to="/costo-por-kilometro">costo por kilómetro</NuxtLink>.
        </span>
      </li>
      <li>
        <span>
          <strong>Los documentos al día.</strong> El chofer lleva en el celular
          los papeles del camión, del acoplado y los suyos, y la oficina recibe
          el aviso antes de que venzan. Más en
          <NuxtLink to="/control-vencimientos-cnrt">control de vencimientos</NuxtLink>.
        </span>
      </li>
    </ul>

    <h2 id="preguntas">6. Preguntas frecuentes</h2>
    <template v-for="f in FAQ" :key="f.p">
      <h3>{{ f.p }}</h3>
      <p>{{ f.r }}</p>
    </template>
  </LandingPaginaTema>
</template>
