<script setup lang="ts">
import { computed } from "vue";

/**
 * Página temática: cómo se calcula el costo por kilómetro de un camión.
 *
 * Es la única de las tres con intención puramente informativa: quien busca
 * "cómo calcular el costo por kilómetro de un camión" no quiere comprar nada
 * todavía. Se responde igual, y completo, porque es la consulta que más se
 * repite del rubro y la que más enlaces atrae — un transportista comparte una
 * planilla explicada, no un folleto.
 *
 * El ejemplo numérico **se calcula**, no se escribe. Si los totales fueran
 * literales, cualquier ajuste de un renglón dejaría la tabla sin cerrar, y una
 * página que enseña a hacer una cuenta y se equivoca en la suya pierde lo único
 * que vino a construir.
 */
definePageMeta({ layout: "public" });

const { money, moneyFixed } = useFormatters();

const SECCIONES = [
  { id: "formula", titulo: "La fórmula" },
  { id: "fijos", titulo: "Los costos fijos" },
  { id: "variables", titulo: "Los costos variables" },
  { id: "ejemplo", titulo: "Un ejemplo con números" },
  { id: "errores", titulo: "Los cinco errores frecuentes" },
  { id: "camionex", titulo: "Cómo lo calcula CamioNex" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

/** Kilómetros mensuales del ejemplo. Un tractor con semi en larga distancia. */
const KM_MES = 10000;

/** Consumo del ejemplo, en km por litro. */
const KM_POR_LITRO = 2.4;

/** Precio del litro de gasoil del ejemplo. */
const PRECIO_LITRO = 1450;

/**
 * Costos fijos: los que corren aunque el camión no salga del galpón.
 *
 * Los importes son ilustrativos y están para mostrar el orden de magnitud y la
 * mecánica de la cuenta, no para que nadie los use como referencia de mercado.
 */
const FIJOS = [
  {
    concepto: "Sueldo y cargas sociales del chofer",
    monto: 1800000,
    nota: "Con aguinaldo y vacaciones prorrateados, no el bruto del recibo.",
  },
  {
    concepto: "Amortización de la unidad",
    monto: 1500000,
    nota: "Valor a reponer dividido por los meses de vida útil. Es el renglón que más se omite.",
  },
  {
    concepto: "Seguro",
    monto: 420000,
    nota: "Póliza del tractor y del semi.",
  },
  {
    concepto: "Patente, RUTA y tributos",
    monto: 120000,
    nota: "Prorrateados al mes.",
  },
  {
    concepto: "Estructura: cochera, taller y administración",
    monto: 350000,
    nota: "La parte que le toca a esta unidad del costo de la empresa.",
  },
];

/** Costos variables: los que sólo existen si el camión anda. */
const VARIABLES = [
  {
    concepto: "Combustible",
    monto: Math.round((KM_MES / KM_POR_LITRO) * PRECIO_LITRO),
    nota: `${KM_POR_LITRO} km/l a ${money(PRECIO_LITRO)} el litro.`,
  },
  {
    concepto: "Neumáticos",
    monto: 480000,
    nota: "Juego completo dividido por los kilómetros que rinde, llevado al mes.",
  },
  {
    concepto: "Mantenimiento y lubricantes",
    monto: 620000,
    nota: "Preventivo programado más el promedio de correctivo.",
  },
  { concepto: "Peajes", monto: 380000, nota: "Del recorrido habitual." },
  {
    concepto: "Viáticos del chofer",
    monto: 450000,
    nota: "Comidas y pernoctes del mes.",
  },
];

const totalFijos = computed(() => FIJOS.reduce((a, f) => a + f.monto, 0));
const totalVariables = computed(() =>
  VARIABLES.reduce((a, v) => a + v.monto, 0),
);
const totalMes = computed(() => totalFijos.value + totalVariables.value);
const costoPorKm = computed(() => totalMes.value / KM_MES);

/**
 * El mismo costo, repartido sólo sobre los kilómetros que se cobran.
 *
 * Es el número que de verdad hay que usar para cotizar, y el que casi nunca se
 * calcula: el retorno vacío consume combustible y desgaste igual, pero no lo
 * paga nadie.
 */
const PORCENTAJE_VACIO = 0.3;
const costoPorKmCargado = computed(
  () => totalMes.value / (KM_MES * (1 - PORCENTAJE_VACIO)),
);

const FAQ = [
  {
    p: "¿Cómo se calcula el costo por kilómetro de un camión?",
    r: "Se suman todos los costos de un período —los fijos, que corren aunque la unidad no salga, y los variables, que dependen del recorrido— y se dividen por los kilómetros hechos en ese mismo período. La fórmula es simple; lo difícil es no olvidarse renglones, sobre todo la amortización de la unidad y la parte de estructura que le corresponde.",
  },
  {
    p: "¿Qué costos son fijos y cuáles variables en el transporte de carga?",
    r: "Fijos: sueldo y cargas del chofer, amortización de la unidad, seguro, patente y tributos, y la parte de estructura de la empresa. Variables: combustible, neumáticos, mantenimiento y lubricantes, peajes y viáticos. La prueba práctica es preguntarse si el gasto existe con el camión parado un mes entero: si existe, es fijo.",
  },
  {
    p: "¿Hay que calcular el costo por kilómetro por camión o para toda la flota?",
    r: "Por camión, y después se promedia si hace falta. Un tractor nuevo y uno de doce años tienen amortización, consumo y mantenimiento muy distintos: el promedio de la flota esconde exactamente la unidad que está perdiendo plata, que es la que hay que encontrar.",
  },
  {
    p: "¿Por qué el costo por kilómetro que calculo me da más bajo que el real?",
    r: "Casi siempre por dos razones. La primera es que falta la amortización: se cuenta la cuota del crédito, que en algún momento termina, en vez del valor de reponer la unidad, que no termina nunca. La segunda es que se dividen los costos por los kilómetros totales en vez de por los kilómetros cargados, y el retorno vacío gasta igual pero no lo paga nadie.",
  },
  {
    p: "¿Cada cuánto conviene recalcularlo?",
    r: "Todos los meses. Con combustible, paritarias y repuestos moviéndose como se mueven en Argentina, un costo por kilómetro de hace seis meses no sirve para cotizar: sirve para perder plata con una tarifa que parecía buena.",
  },
];

useSeoMeta({
  title: "Costo por kilómetro de un camión: cómo se calcula",
  description:
    "La fórmula del costo por kilómetro en el transporte de carga, qué entra " +
    "en los costos fijos y variables, un ejemplo con números y los cinco " +
    "errores que hacen que el número dé más bajo de lo que es.",
  ogTitle: "Costo por kilómetro de un camión: cómo se calcula",
  ogDescription:
    "Fórmula, desglose de costos fijos y variables, un ejemplo completo y por " +
    "qué el número que casi todos calculan da más bajo que el real.",
  ogType: "article",
  ogImage: `${SITIO.origen}${SITIO.imagenSocial}`,
  twitterCard: "summary_large_image",
});

useCanonical("/costo-por-kilometro");

/**
 * Además de las migas y las preguntas, un `HowTo`: es contenido de instrucción
 * —una fórmula con pasos— y ese es el tipo que lo describe. Los pasos son los
 * mismos que el cuerpo desarrolla, en el mismo orden.
 */
useDatosEstructurados({
  "@context": "https://schema.org",
  "@graph": [
    migasJsonLd([
      { nombre: "Inicio", ruta: "/" },
      { nombre: "Costo por kilómetro", ruta: "/costo-por-kilometro" },
    ]),
    {
      "@type": "HowTo",
      "@id": `${SITIO.origen}/costo-por-kilometro#howto`,
      name: "Cómo calcular el costo por kilómetro de un camión",
      inLanguage: "es-AR",
      description:
        "Método para obtener el costo por kilómetro de una unidad de transporte " +
        "de carga sumando costos fijos y variables de un período y dividiéndolos " +
        "por los kilómetros recorridos.",
      step: [
        {
          "@type": "HowToStep",
          name: "Sumar los costos fijos del mes",
          text: "Sueldo y cargas del chofer, amortización de la unidad, seguro, patente y tributos, y la parte de estructura de la empresa. Son los que corren aunque el camión no salga.",
        },
        {
          "@type": "HowToStep",
          name: "Sumar los costos variables del mes",
          text: "Combustible, neumáticos, mantenimiento y lubricantes, peajes y viáticos. Dependen del recorrido.",
        },
        {
          "@type": "HowToStep",
          name: "Dividir por los kilómetros del período",
          text: "El total de costos dividido por los kilómetros recorridos en ese mismo mes da el costo por kilómetro de la unidad.",
        },
        {
          "@type": "HowToStep",
          name: "Ajustar por los kilómetros vacíos",
          text: "Para cotizar, dividir sólo por los kilómetros cargados: el retorno vacío consume igual pero no lo paga el cliente.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITIO.origen}/costo-por-kilometro#faq`,
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
    eyebrow="Costos y rentabilidad"
    miga="Costo por kilómetro"
    titulo="Costo por kilómetro de un camión: cómo se calcula"
    bajada="Es el número que decide si ganás o perdés en cada viaje, y el que casi
            nadie tiene bien. La fórmula es una división; el trabajo está en no
            olvidarse renglones."
    :secciones="SECCIONES"
    cierre-titulo="Que el número salga solo, todos los meses"
    cierre-texto="Con los gastos del viaje y las cargas de combustible ya cargados,
                  el costo por kilómetro por unidad y por chofer se calcula solo.
                  Treinta días de prueba con acceso completo."
  >
    <h2 id="formula">1. La fórmula</h2>
    <p>
      El costo por kilómetro es el total de lo que cuesta tener y mover una
      unidad durante un período, dividido por los kilómetros que hizo en ese
      mismo período:
    </p>

    <div class="tema-formula">
      <strong>Costo por km</strong> = ( Costos fijos + Costos variables ) ÷
      Kilómetros recorridos
    </div>

    <p>
      Hasta ahí no hay ningún misterio. El problema es que el resultado depende
      enteramente de qué se metió arriba, y ahí es donde se rompe: los costos
      que no se ven —la amortización, la estructura, el retorno vacío— son
      justamente los que hacen la diferencia entre un número que sirve para
      cotizar y uno que da lindo.
    </p>
    <p>
      Y se calcula <strong>por unidad</strong>, no para la flota entera. Un
      tractor nuevo y uno de doce años tienen amortización, consumo y
      mantenimiento distintos; el promedio esconde exactamente el camión que
      está perdiendo plata.
    </p>

    <h2 id="fijos">2. Los costos fijos</h2>
    <p>
      Son los que corren aunque el camión se quede un mes entero en el galpón.
      La prueba es esa: si el gasto existe con la unidad parada, es fijo.
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Sueldo y cargas sociales del chofer.</strong> Con aguinaldo,
          vacaciones y cargas prorrateados al mes. No el bruto del recibo.
        </span>
      </li>
      <li>
        <span>
          <strong>Amortización de la unidad.</strong> Lo que cuesta reponer el
          camión, dividido por los meses de vida útil que le quedan.
          <em>No es la cuota del crédito.</em> La cuota se termina; el desgaste
          no, y el día que haya que cambiar la unidad la plata tiene que estar.
        </span>
      </li>
      <li>
        <span>
          <strong>Seguro.</strong> Tractor y semi, con la cuota al día.
        </span>
      </li>
      <li>
        <span>
          <strong>Patente, RUTA y tributos.</strong> Anuales, divididos por
          doce.
        </span>
      </li>
      <li>
        <span>
          <strong>Estructura.</strong> La parte que le toca a esta unidad de la
          cochera, el taller propio, la administración y los sistemas. Si la
          empresa tiene ocho camiones, es un octavo — pero tiene que estar.
        </span>
      </li>
    </ul>

    <h2 id="variables">3. Los costos variables</h2>
    <p>Sólo existen si el camión anda, y crecen con el kilometraje.</p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Combustible.</strong> Es el renglón más grande y el único que
          se puede mejorar sin comprar nada: sale de los litros y el odómetro de
          cada carga. Sin esos dos datos no hay km/l, y sin km/l esto es una
          estimación.
        </span>
      </li>
      <li>
        <span>
          <strong>Neumáticos.</strong> El juego completo dividido por los
          kilómetros que rinde, recapados incluidos.
        </span>
      </li>
      <li>
        <span>
          <strong>Mantenimiento y lubricantes.</strong> El preventivo
          programado, más un promedio de correctivo: la rotura no se agenda,
          pero sí se promedia.
        </span>
      </li>
      <li>
        <span>
          <strong>Peajes.</strong> Del recorrido habitual de esa unidad.
        </span>
      </li>
      <li>
        <span>
          <strong>Viáticos.</strong> Comidas y pernoctes que efectivamente se
          pagan.
        </span>
      </li>
    </ul>

    <h2 id="ejemplo">4. Un ejemplo con números</h2>
    <p>
      Un tractor con semi que hace
      <strong>{{ KM_MES.toLocaleString("es-AR") }} km al mes</strong> en larga
      distancia, con un consumo de {{ KM_POR_LITRO }} km/l. Los importes son
      ilustrativos: sirven para ver la mecánica y el peso relativo de cada
      renglón, no como referencia de mercado.
    </p>

    <h3>Costos fijos del mes</h3>
    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="tema-num">Mensual</th>
            <th>Cómo se obtiene</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in FIJOS" :key="f.concepto">
            <td>{{ f.concepto }}</td>
            <td class="tema-num">{{ money(f.monto) }}</td>
            <td>{{ f.nota }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total fijos</td>
            <td class="tema-num">{{ money(totalFijos) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <h3>Costos variables del mes</h3>
    <div class="tema-tabla">
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th class="tema-num">Mensual</th>
            <th>Cómo se obtiene</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in VARIABLES" :key="v.concepto">
            <td>{{ v.concepto }}</td>
            <td class="tema-num">{{ money(v.monto) }}</td>
            <td>{{ v.nota }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>Total variables</td>
            <td class="tema-num">{{ money(totalVariables) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="tema-resultado">
      <div class="tema-resultado__valor">{{ moneyFixed(costoPorKm) }} por km</div>
      <p class="tema-resultado__pie">
        {{ money(totalMes) }} de costo mensual ÷
        {{ KM_MES.toLocaleString("es-AR") }} km recorridos.
      </p>
    </div>

    <p>
      Ahora el ajuste que casi nadie hace. Si el
      {{ Math.round(PORCENTAJE_VACIO * 100) }} % de esos kilómetros son de
      retorno vacío, el costo se sigue produciendo pero lo tienen que pagar sólo
      los kilómetros cargados:
    </p>

    <div class="tema-resultado">
      <div class="tema-resultado__valor">
        {{ moneyFixed(costoPorKmCargado) }} por km cargado
      </div>
      <p class="tema-resultado__pie">
        El mismo costo repartido sobre los
        {{ (KM_MES * (1 - PORCENTAJE_VACIO)).toLocaleString("es-AR") }} km que
        se cobran. Este es el número con el que se cotiza.
      </p>
    </div>

    <p>
      La diferencia entre los dos números es la que se come el margen de una
      tarifa que parecía razonable. Y encima queda afuera del cálculo la
      ganancia: el costo por kilómetro es el <em>piso</em>, no el precio.
    </p>

    <h2 id="errores">5. Los cinco errores frecuentes</h2>
    <ol>
      <li>
        <strong>Contar la cuota del crédito en vez de la amortización.</strong>
        La cuota se termina en tres años; la necesidad de reponer la unidad no.
        Cuando el crédito se salda, el costo parece bajar y en realidad no bajó
        nada.
      </li>
      <li>
        <strong>Dividir por los kilómetros totales.</strong> El retorno vacío
        consume gasoil, gasta gomas y paga peaje. Cotizar sobre el total es
        regalar esa parte.
      </li>
      <li>
        <strong>Promediar toda la flota.</strong> El promedio tapa la unidad que
        pierde. Si hay un camión con el consumo disparado, el promedio lo
        esconde justo hasta que es caro.
      </li>
      <li>
        <strong>Olvidarse de la estructura.</strong> La oficina, el taller, el
        que factura y el que atiende el teléfono se pagan con los mismos viajes.
        Si no están repartidos entre las unidades, salen de la ganancia.
      </li>
      <li>
        <strong>Calcularlo una vez.</strong> Con el combustible, las paritarias
        y los repuestos moviéndose como se mueven, un costo de hace seis meses
        no es un dato viejo: es un dato falso.
      </li>
    </ol>

    <h2 id="camionex">6. Cómo lo calcula CamioNex</h2>
    <p>
      Todo lo anterior se puede hacer en una planilla, y muchas flotas lo hacen.
      El problema no es la cuenta: es que los datos de arriba llegan tarde,
      incompletos y transcritos a mano.
      <NuxtLink to="/">CamioNex</NuxtLink> ataca eso:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Los kilómetros y los litros salen del uso.</strong> Cada carga
          de combustible entra con odómetro y litros desde la app del chofer, en
          la estación. De ahí sale el km/l real por unidad, sin que nadie cargue
          nada dos veces.
        </span>
      </li>
      <li>
        <span>
          <strong>Los gastos ya están imputados al viaje.</strong> Peajes,
          viáticos y reparaciones en ruta llegan por la
          <NuxtLink to="/rendicion-de-viajes">rendición del viaje</NuxtLink>,
          con comprobante y asociados a la unidad correcta.
        </span>
      </li>
      <li>
        <span>
          <strong>El mantenimiento suma solo.</strong> Las órdenes de trabajo
          del plan preventivo y de los correctivos se acumulan sobre la unidad
          que las consumió.
        </span>
      </li>
      <li>
        <span>
          <strong>El resultado se ve por camión y por chofer.</strong> Costo por
          kilómetro, consumo y ranking de manejo, para encontrar la unidad que
          se desvió antes de que se note en el balance.
        </span>
      </li>
    </ul>
    <p>
      Los indicadores de costo están en el plan Gestión;
      <NuxtLink to="/#planes">acá está el detalle de planes y precios</NuxtLink>.
      También te puede interesar el
      <NuxtLink to="/control-vencimientos-cnrt">
        control de vencimientos de la flota
      </NuxtLink>.
    </p>

    <h2 id="preguntas">7. Preguntas frecuentes</h2>
    <template v-for="f in FAQ" :key="f.p">
      <h3>{{ f.p }}</h3>
      <p>{{ f.r }}</p>
    </template>
  </LandingPaginaTema>
</template>
