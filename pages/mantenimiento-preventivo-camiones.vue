<script setup lang="ts">
/**
 * Página temática: plan de mantenimiento preventivo de camiones.
 *
 * Ataca "plan de mantenimiento preventivo de camiones", "mantenimiento de
 * flota" y "control de service por kilómetros": consultas de quien ya tiene el
 * problema (un service que se pasó, una rotura en ruta) y busca cómo
 * ordenarlo. La portada no puede decir esto sin desenfocarse.
 *
 * Todo lo que se afirma del producto sale del módulo Mantenimiento tal como lo
 * describe el manual (planes por km, horas o fecha; pestaña Próximos; órdenes
 * de trabajo con costo). Los intervalos son orientativos y se dice: el que
 * manda es el manual del fabricante, y una página que da un número como regla
 * fija pierde la confianza del lector que sabe de camiones.
 */
definePageMeta({ layout: "public" });

const SECCIONES = [
  { id: "que-es", titulo: "Preventivo, correctivo y predictivo" },
  { id: "costo", titulo: "Lo que cuesta no hacerlo" },
  { id: "plan", titulo: "Cómo se arma un plan" },
  { id: "registro", titulo: "Qué hay que registrar" },
  { id: "camionex", titulo: "Cómo funciona en CamioNex" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

/** Disparadores de un plan: qué hace que un service "venza". */
const DISPARADORES = [
  {
    tipo: "Por kilómetros",
    cuando: "Unidades que ruedan mucho y parejo",
    ejemplo: "Aceite y filtros, rotación de cubiertas, engrase",
  },
  {
    tipo: "Por horas de uso",
    cuando: "Equipos que trabajan parados o a baja velocidad",
    ejemplo: "Equipo de frío, hidrogrúa, toma de fuerza",
  },
  {
    tipo: "Por fecha",
    cuando: "Lo que se degrada aunque el camión no se mueva",
    ejemplo: "Líquido de frenos, matafuegos, revisión anual completa",
  },
];

const FAQ = [
  {
    p: "¿Qué es un plan de mantenimiento preventivo de camiones?",
    r: "Es la lista de servicios que cada unidad tiene que recibir y cada cuánto: cambio de aceite y filtros, frenos, cubiertas, engrase, refrigeración. Cada servicio tiene un disparador —kilómetros, horas de uso o fecha— y un registro del último que se hizo, que es desde donde se cuenta el próximo.",
  },
  {
    p: "¿Cada cuántos kilómetros se hace el service de un camión?",
    r: "Depende del motor, del aceite que se use y del tipo de trabajo, y lo define el manual del fabricante. Un camión de larga distancia en ruta y uno de reparto urbano con el mismo motor pueden tener intervalos muy distintos. Lo que no cambia es la regla de fondo: el intervalo tiene que estar escrito por unidad y el sistema tiene que avisar antes de que se pase.",
  },
  {
    p: "¿Qué diferencia hay entre mantenimiento preventivo y correctivo?",
    r: "El preventivo se hace antes de que algo falle, según un plan. El correctivo se hace después, cuando ya se rompió. El correctivo siempre cuesta más: a la reparación se le suman el camión parado, el viaje que no se hizo, el auxilio y muchas veces un daño mayor que una pieza gastada arrastró.",
  },
  {
    p: "¿Sirve una planilla de Excel para el mantenimiento de la flota?",
    r: "Sirve para anotar, no para avisar. El problema de la planilla es que alguien tiene que abrirla y comparar el kilometraje actual de cada camión contra el del último service. Con cinco unidades se puede; con quince, el service que se pasa es el del camión del que nadie se acordó.",
  },
  {
    p: "¿Cómo sé cuánto me cuesta mantener cada camión?",
    r: "Registrando cada orden de trabajo con su costo y su unidad. Sumadas por camión dan el costo de mantenimiento, que dividido por los kilómetros recorridos se vuelve una parte del costo por kilómetro. Es el número que después dice si a una unidad le conviene seguir o ser reemplazada.",
  },
];

useSeoMeta({
  title: "Plan de mantenimiento preventivo de camiones",
  description:
    "Cómo armar un plan de mantenimiento preventivo para una flota de " +
    "camiones: services por kilómetros, horas o fecha, órdenes de trabajo con " +
    "costo y avisos antes de que se pase un service.",
  ogTitle: "Plan de mantenimiento preventivo de camiones",
  ogDescription:
    "Que no se pase ningún service y saber cuánto cuesta mantener cada " +
    "camión. Cómo se arma el plan y qué hay que registrar.",
  ogType: "article",
  ogImage: `${SITIO.origen}${SITIO.imagenSocial}`,
  twitterCard: "summary_large_image",
});

useCanonical("/mantenimiento-preventivo-camiones");

useDatosEstructurados({
  "@context": "https://schema.org",
  "@graph": [
    migasJsonLd([
      { nombre: "Inicio", ruta: "/" },
      {
        nombre: "Mantenimiento preventivo",
        ruta: "/mantenimiento-preventivo-camiones",
      },
    ]),
    {
      "@type": "FAQPage",
      "@id": `${SITIO.origen}/mantenimiento-preventivo-camiones#faq`,
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
    eyebrow="Taller y flota"
    miga="Mantenimiento preventivo"
    titulo="Plan de mantenimiento preventivo de camiones"
    bajada="El service que se pasa casi nunca es por falta de taller: es porque
            nadie se acordó de mirar el odómetro de ese camión a tiempo. Un plan
            escrito y un aviso automático resuelven las dos cosas."
    :secciones="SECCIONES"
    cierre-titulo="Que ningún service se pase"
    cierre-texto="Cargás el plan de cada camión una vez y el aviso aparece solo
                  antes de que venza. Treinta días de prueba con acceso
                  completo, sin tarjeta."
  >
    <h2 id="que-es">1. Preventivo, correctivo y predictivo</h2>
    <p>
      Hay tres maneras de mantener una flota, y todas las empresas usan una
      mezcla de las tres:
    </p>
    <ul>
      <li>
        <strong>Correctivo:</strong> se arregla lo que se rompió. Es inevitable
        en parte, pero cuando es la única forma de mantenimiento, la flota
        trabaja para el taller.
      </li>
      <li>
        <strong>Preventivo:</strong> se cambia y se revisa según un plan, antes
        de que falle. Aceite y filtros cada tantos kilómetros, frenos, cubiertas,
        engrase, refrigeración.
      </li>
      <li>
        <strong>Predictivo:</strong> se interviene cuando los datos muestran que
        algo empieza a andar mal. Por ejemplo, un camión cuyo consumo empeora
        mes a mes en la misma ruta, que casi siempre es una señal mecánica.
      </li>
    </ul>
    <p>
      Esta guía es sobre el segundo, que es el que más plata ahorra con menos
      esfuerzo. El tercero sale casi gratis una vez que el preventivo y el
      registro de combustible están ordenados.
    </p>

    <h2 id="costo">2. Lo que cuesta no hacerlo</h2>
    <p>
      La cuenta que justifica el preventivo no es el precio del service contra
      el de la reparación. Es todo lo que viene con una rotura en ruta:
    </p>
    <ul>
      <li>
        <strong>El camión parado.</strong> Cada día en el taller es un día sin
        facturar, con los costos fijos —seguro, patente, sueldo del chofer—
        corriendo igual.
      </li>
      <li>
        <strong>El viaje que no se hizo.</strong> O que se hizo tarde, con un
        cliente que la próxima vez llama a otro.
      </li>
      <li>
        <strong>El auxilio y la reparación lejos de casa.</strong> Remolque,
        repuestos al precio del lugar y un taller que no es el tuyo.
      </li>
      <li>
        <strong>El daño encadenado.</strong> Un filtro tapado o un nivel bajo
        que nadie revisó no se quedan en eso: arrastran piezas mucho más caras.
      </li>
    </ul>
    <p>
      Todo eso termina en el
      <NuxtLink to="/costo-por-kilometro">costo por kilómetro</NuxtLink> de la
      unidad, aunque nadie lo haya anotado como mantenimiento.
    </p>

    <h2 id="plan">3. Cómo se arma un plan</h2>
    <p>
      Un plan de mantenimiento es una lista de reglas, una por servicio y por
      unidad. Cada regla tiene tres partes:
    </p>
    <ol>
      <li>
        <strong>Qué se hace.</strong> Un nombre que el taller entienda sin
        preguntar: «Service de aceite y filtros», «Revisión de frenos».
      </li>
      <li>
        <strong>Cada cuánto.</strong> El intervalo y en qué se mide. El valor
        sale del manual del fabricante y se ajusta al uso real: el mismo motor
        no se gasta igual en ruta que en reparto urbano.
      </li>
      <li>
        <strong>Desde cuándo.</strong> El último service hecho, con su
        kilometraje o su fecha. Sin ese punto de partida, el intervalo no sirve
        para calcular nada.
      </li>
    </ol>
    <p>Y el intervalo se mide de una de estas tres maneras:</p>

    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th>Disparador</th>
            <th>Cuándo conviene</th>
            <th>Ejemplos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in DISPARADORES" :key="d.tipo">
            <td>
              <strong>{{ d.tipo }}</strong>
            </td>
            <td>{{ d.cuando }}</td>
            <td>{{ d.ejemplo }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Un consejo práctico: empezá por los tres o cuatro servicios que más
      roturas te causaron el último año, en todas las unidades. Un plan corto
      que se cumple vale más que uno completo que nadie mira.
    </p>

    <h2 id="registro">4. Qué hay que registrar</h2>
    <p>
      Cada vez que un camión pasa por el taller —por un service del plan o por
      una rotura— conviene dejar una orden de trabajo con estos datos:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Unidad y fecha.</strong> Lo mínimo para reconstruir la
          historia de cada camión.
        </span>
      </li>
      <li>
        <span>
          <strong>Odómetro.</strong> Es lo que reinicia la cuenta del próximo
          service y lo que permite comparar unidades por kilómetro recorrido.
        </span>
      </li>
      <li>
        <span>
          <strong>Qué se hizo.</strong> En palabras del taller, con el
          comprobante adjunto.
        </span>
      </li>
      <li>
        <span>
          <strong>Costo.</strong> El dato que más se omite y el que más vale.
          Sin él, decidir si conviene reparar o renovar una unidad es una
          sensación.
        </span>
      </li>
    </ul>
    <p>
      Los papeles del camión que vencen —RTO, seguro, habilitaciones— no son
      mantenimiento pero viven al lado. Los cubre la guía de
      <NuxtLink to="/control-vencimientos-cnrt">control de vencimientos</NuxtLink>.
    </p>

    <h2 id="camionex">5. Cómo funciona en CamioNex</h2>
    <p>
      El módulo de Mantenimiento de
      <NuxtLink to="/">CamioNex</NuxtLink> (incluido desde el plan Operación)
      hace exactamente lo de arriba, y la diferencia con una planilla es que
      avisa solo:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Planes por camión</strong>, con disparador por kilómetros,
          horas de uso o fecha, y el último service como punto de partida. Un
          plan se puede pausar sin borrarlo.
        </span>
      </li>
      <li>
        <span>
          <strong>Una lista de próximos y vencidos</strong>, con la patente y el
          motivo («faltan 1.200 km»): en naranja lo que está por vencer, en rojo
          lo que ya venció. También aparece en el panel de inicio.
        </span>
      </li>
      <li>
        <span>
          <strong>El kilometraje se actualiza solo.</strong> Sale del odómetro
          que el chofer carga desde su celular al terminar cada viaje. Nadie
          tiene que salir a leer tableros.
        </span>
      </li>
      <li>
        <span>
          <strong>Órdenes de trabajo</strong> con estado (abierta, en proceso,
          finalizada), odómetro, costo, archivos adjuntos y comprobante en PDF
          para el taller.
        </span>
      </li>
      <li>
        <span>
          <strong>Costo por unidad.</strong> Las órdenes suman al gasto de cada
          camión, que junto con el combustible y los gastos de viaje arma el
          costo por kilómetro real.
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
