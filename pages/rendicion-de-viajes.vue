<script setup lang="ts">
/**
 * Página temática: rendición de gastos de viaje del chofer.
 *
 * Es el diferencial comercial del producto (§8.3 de docs/MODELO-COMERCIAL.md:
 * ningún competidor internacional resuelve la rendición del chofer argentino) y
 * hasta ahora sólo se mencionaba de paso en la portada. La consulta
 * —"rendición de gastos de viaje camión", "planilla de gastos del chofer"— es
 * de intención comercial alta y muy poco disputada en castellano rioplatense.
 *
 * La página se estructura como el proceso real, porque quien busca esto ya lo
 * está haciendo de alguna manera y quiere comparar contra lo suyo.
 */
definePageMeta({ layout: "public" });

const SECCIONES = [
  { id: "que-es", titulo: "Qué es una rendición de viaje" },
  { id: "hoy", titulo: "Cómo se hace hoy y qué se pierde" },
  { id: "que-lleva", titulo: "Qué tiene que tener" },
  { id: "camionex", titulo: "Cómo funciona en CamioNex" },
  { id: "planilla", titulo: "Planilla o sistema" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

/** Los movimientos que componen el saldo de un viaje. */
const MOVIMIENTOS = [
  {
    tipo: "Adelantos",
    signo: "A favor de la empresa",
    detalle:
      "La plata que se le entregó al chofer antes de salir o en el camino, en efectivo o por transferencia.",
  },
  {
    tipo: "Combustible",
    signo: "Gasto",
    detalle:
      "Litros, importe y estación. Es el gasto más grande del viaje y el que alimenta el consumo por unidad.",
  },
  {
    tipo: "Peajes",
    signo: "Gasto",
    detalle: "Con su comprobante, que es lo que después se le factura al cliente.",
  },
  {
    tipo: "Viáticos y comidas",
    signo: "Gasto",
    detalle: "Lo que se rinde y lo que es no remunerativo se tratan distinto.",
  },
  {
    tipo: "Reparaciones en ruta",
    signo: "Gasto",
    detalle:
      "Gomería, service de urgencia, repuestos. Es el gasto que más se pierde porque ocurre lejos.",
  },
  {
    tipo: "Multas",
    signo: "Gasto",
    detalle: "Cargadas al viaje, para saber a qué unidad y a qué chofer corresponden.",
  },
];

const FAQ = [
  {
    p: "¿Qué es la rendición de gastos de un viaje?",
    r: "Es el cierre de cuentas entre la empresa y el chofer al terminar un viaje: se toman los adelantos que se le entregaron, se restan los gastos que rindió con comprobante y queda un saldo a favor de uno o del otro. Bien hecha, además de saldar la cuenta deja registrado el costo real de ese viaje.",
  },
  {
    p: "¿Cómo se controla que un gasto de viaje sea real?",
    r: "Con el comprobante y con el contexto. Una foto del ticket cargada en el momento y en el lugar del gasto es mucho más difícil de discutir que un papel arrugado que aparece dos semanas después. Si además queda registrada la fecha, la hora y la unidad, el gasto se puede cruzar contra el recorrido del viaje.",
  },
  {
    p: "¿El chofer puede cargar los gastos sin señal?",
    r: "En CamioNex sí. La app guarda el movimiento en el celular y lo sincroniza sola cuando vuelve la conexión. El chofer no tiene que acordarse de reintentar ni volver a cargar nada, que es la razón por la que fallan casi todas las apps de este tipo en rutas argentinas.",
  },
  {
    p: "¿Sirve una planilla de Excel para la rendición de viajes?",
    r: "Sirve para hacer la cuenta, no para conseguir el dato. El problema de la rendición no es sumar: es que el gasto se anota en un cuaderno en la ruta y se transcribe días después, sin comprobante y de memoria. La planilla recibe ese dato ya deteriorado. Cargar en el momento y en el lugar es lo que cambia el resultado.",
  },
  {
    p: "¿Qué pasa con los adelantos que quedan a favor del chofer?",
    r: "Quedan como saldo del viaje y se arrastran hasta que se salden, en efectivo o contra la liquidación. Lo importante es que el saldo sea del sistema y no de un cuaderno, porque es el punto donde más discusiones aparecen entre administración y choferes.",
  },
];

useSeoMeta({
  title: "Rendición de gastos de viaje del chofer, sin cuaderno",
  description:
    "Cómo hacer la rendición de gastos de un viaje de camión: adelantos, " +
    "combustible, peajes y viáticos con comprobante, cargados por el chofer " +
    "desde la ruta y sin señal. Reemplazá la planilla y el cuaderno.",
  ogTitle: "Rendición de gastos de viaje del chofer, sin cuaderno",
  ogDescription:
    "Los gastos se cargan donde ocurren, con foto del ticket y aunque no haya " +
    "señal. La rendición se arma sola y el saldo del viaje deja de discutirse.",
  ogType: "article",
  ogImage: `${SITIO.origen}${SITIO.imagenSocial}`,
  twitterCard: "summary_large_image",
});

useCanonical("/rendicion-de-viajes");

useDatosEstructurados({
  "@context": "https://schema.org",
  "@graph": [
    migasJsonLd([
      { nombre: "Inicio", ruta: "/" },
      { nombre: "Rendición de viajes", ruta: "/rendicion-de-viajes" },
    ]),
    {
      "@type": "FAQPage",
      "@id": `${SITIO.origen}/rendicion-de-viajes#faq`,
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
    eyebrow="Gastos y adelantos"
    miga="Rendición de viajes"
    titulo="Rendición de gastos de viaje del chofer, sin cuaderno"
    bajada="El gasto ocurre a seiscientos kilómetros de la oficina y se registra
            tres semanas después, de memoria y sin comprobante. Todo lo que le
            falta a la rendición se pierde ahí, en el medio."
    :secciones="SECCIONES"
    cierre-titulo="Que la rendición se arme sola"
    cierre-texto="El chofer carga el gasto donde ocurre, con la foto del ticket, y
                  vos cerrás el viaje con el saldo ya calculado. Treinta días de
                  prueba con acceso completo, sin tarjeta."
  >
    <h2 id="que-es">1. Qué es una rendición de viaje</h2>
    <p>
      Una rendición de viaje es el cierre de cuentas entre la empresa y el
      chofer cuando el viaje termina: se toman los adelantos que se le
      entregaron, se restan los gastos que rindió con comprobante y queda un
      saldo a favor de uno o del otro.
    </p>
    <p>
      Esa es la mitad administrativa, y es la que todo el mundo hace. La otra
      mitad —la que se pierde casi siempre— es que esa misma rendición es el
      único registro del <strong>costo real de ese viaje</strong>. Si los gastos
      llegan incompletos, la cuenta con el chofer igual cierra, pero el número
      con el que después vas a cotizar una tarifa está mal.
    </p>

    <h2 id="hoy">2. Cómo se hace hoy y qué se pierde</h2>
    <p>El circuito típico de una flota que todavía no tiene sistema:</p>
    <ol>
      <li>El chofer sale con un adelanto en efectivo y un cuaderno.</li>
      <li>Anota lo que puede, cuando puede. Los tickets van al bolsillo.</li>
      <li>
        Vuelve, entrega el fajo de comprobantes y cuenta de memoria lo que
        falta.
      </li>
      <li>
        Administración transcribe todo a una planilla, días o semanas después.
      </li>
    </ol>
    <p>Y esto es lo que ese circuito pierde, en orden de cuánto cuesta:</p>
    <ul>
      <li>
        <strong>Los gastos sin ticket.</strong> El comprobante que se mojó, el
        que no dieron, el de la gomería a la madrugada. Se rinden de palabra o
        no se rinden: en los dos casos el número final es dudoso.
      </li>
      <li>
        <strong>El detalle del combustible.</strong> Si sólo queda el importe y
        no los litros ni el odómetro, no hay forma de calcular el consumo, y sin
        consumo no hay
        <NuxtLink to="/costo-por-kilometro">costo por kilómetro</NuxtLink>.
      </li>
      <li>
        <strong>La discusión del saldo.</strong> Cuando la única fuente es el
        cuaderno del chofer contra la memoria de la oficina, la conversación
        deja de ser sobre números.
      </li>
      <li>
        <strong>El tiempo de administración.</strong> Transcribir es trabajo
        puro que no agrega nada: el dato ya existía, sólo estaba en papel.
      </li>
      <li>
        <strong>La foto en tiempo real.</strong> Mientras el viaje está en curso
        nadie sabe cuánto lleva gastado. Se sabe cuando ya no se puede hacer
        nada.
      </li>
    </ul>

    <h2 id="que-lleva">3. Qué tiene que tener</h2>
    <p>
      Una rendición completa se arma con estos movimientos. Los adelantos van de
      un lado, todo lo demás del otro, y la diferencia es el saldo:
    </p>

    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th>Movimiento</th>
            <th>Cómo entra</th>
            <th>Por qué importa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in MOVIMIENTOS" :key="m.tipo">
            <td>
              <strong>{{ m.tipo }}</strong>
            </td>
            <td>{{ m.signo }}</td>
            <td>{{ m.detalle }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>Y cada movimiento, para servir de algo, necesita cuatro cosas:</p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Comprobante.</strong> La foto del ticket adjunta al
          movimiento, no en una carpeta aparte ni en un chat.
        </span>
      </li>
      <li>
        <span>
          <strong>Fecha y hora reales.</strong> Las del gasto, no las de la
          carga en la oficina.
        </span>
      </li>
      <li>
        <span>
          <strong>Viaje y unidad.</strong> Sin eso el gasto existe pero no se le
          puede imputar a nada.
        </span>
      </li>
      <li>
        <span>
          <strong>Odómetro, cuando corresponde.</strong> Es lo que convierte una
          carga de combustible en un dato de consumo.
        </span>
      </li>
    </ul>

    <h2 id="camionex">4. Cómo funciona en CamioNex</h2>
    <p>
      La decisión de fondo de
      <NuxtLink to="/">CamioNex</NuxtLink> es que el gasto se carga donde
      ocurre. Todo lo demás sale de ahí:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>El chofer carga desde su celular</strong>, en la estación o en
          la gomería. Saca la foto del ticket y puede dictar el resto por voz,
          que es lo único razonable con las manos sucias y el motor en marcha.
        </span>
      </li>
      <li>
        <span>
          <strong>Funciona sin señal.</strong> El movimiento queda guardado en
          el teléfono y se sincroniza solo cuando vuelve la conexión. El chofer
          no tiene que acordarse de nada ni reintentar la carga: esto es lo que
          decide si una app de rendiciones se usa o se abandona en la primera
          semana.
        </span>
      </li>
      <li>
        <span>
          <strong>La rendición se arma sola.</strong> Al cerrar el viaje los
          adelantos y los gastos ya están cargados, con sus comprobantes, y el
          saldo está calculado. No hay transcripción.
        </span>
      </li>
      <li>
        <span>
          <strong>Se ve mientras el viaje pasa.</strong> El tablero muestra lo
          gastado en un viaje en curso, no al mes siguiente.
        </span>
      </li>
      <li>
        <span>
          <strong>Alimenta el resto.</strong> Los litros y el odómetro de cada
          carga son los que después producen el consumo por unidad y el
          <NuxtLink to="/costo-por-kilometro">costo por kilómetro</NuxtLink>.
        </span>
      </li>
    </ul>

    <h2 id="planilla">5. Planilla o sistema</h2>
    <p>
      La pregunta que se hace todo el mundo antes de cambiar. Puesto de la forma
      más honesta posible:
    </p>

    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Cuaderno y planilla</th>
            <th>Sistema</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dónde se carga</strong></td>
            <td>En la oficina, después</td>
            <td>En la ruta, cuando pasa</td>
          </tr>
          <tr>
            <td><strong>Comprobante</strong></td>
            <td>Suelto, si sobrevivió</td>
            <td>Adjunto al movimiento</td>
          </tr>
          <tr>
            <td><strong>Saldo del viaje</strong></td>
            <td>Se calcula al cerrar</td>
            <td>Actualizado siempre</td>
          </tr>
          <tr>
            <td><strong>Transcripción</strong></td>
            <td>Sí, y es donde entra el error</td>
            <td>No hay</td>
          </tr>
          <tr>
            <td><strong>Costo por km</strong></td>
            <td>Estimado a ojo</td>
            <td>Sale del dato cargado</td>
          </tr>
          <tr>
            <td><strong>Costo mensual</strong></td>
            <td>Cero, más las horas de administración</td>
            <td>Abono, y esas horas liberadas</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      La planilla no está mal: está en el lugar equivocado del proceso. Recibe
      un dato que ya se deterioró en el camino, y ninguna fórmula recupera un
      ticket que no existe.
    </p>

    <h2 id="preguntas">6. Preguntas frecuentes</h2>
    <template v-for="f in FAQ" :key="f.p">
      <h3>{{ f.p }}</h3>
      <p>{{ f.r }}</p>
    </template>
  </LandingPaginaTema>
</template>
