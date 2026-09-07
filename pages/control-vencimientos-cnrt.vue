<script setup lang="ts">
/**
 * Página temática: control de vencimientos de una flota argentina.
 *
 * Ataca una intención de búsqueda que la portada no puede cubrir sin
 * desenfocarse: alguien que escribe "control de vencimientos CNRT" o "cuándo
 * vence la LiNTI" todavía no está buscando un software, está buscando una
 * respuesta. La página la da primero y recién al final ofrece la herramienta.
 *
 * Sobre la precisión regulatoria: se nombran los documentos y quién los exige,
 * pero **no se declaran periodicidades**. La vigencia de la RTO, de la LiNTI y
 * del psicofísico depende de la categoría de la unidad, de la edad del chofer y
 * de la jurisdicción, y publicar un número equivocado en una página que
 * pretende posicionarse como referencia del tema es peor que no publicarlo:
 * daña la credibilidad y, con el tiempo, el posicionamiento.
 */
definePageMeta({ layout: "public" });

const SECCIONES = [
  { id: "que-vence", titulo: "Qué vence en una flota" },
  { id: "por-que-falla", titulo: "Por qué falla el Excel" },
  { id: "costo", titulo: "Lo que cuesta un vencido" },
  { id: "como-resolverlo", titulo: "Cómo se controla de verdad" },
  { id: "camionex", titulo: "Cómo lo hace CamioNex" },
  { id: "preguntas", titulo: "Preguntas frecuentes" },
];

/**
 * Documentación por unidad.
 *
 * Sin periodicidades a propósito: varían por categoría y jurisdicción.
 */
const POR_UNIDAD = [
  {
    doc: "RTO — Revisión Técnica Obligatoria",
    detalle:
      "Habilita la unidad a circular. En transporte interjurisdiccional la controla la CNRT.",
  },
  {
    doc: "VTV",
    detalle:
      "El equivalente provincial o de CABA, según dónde esté radicada la unidad.",
  },
  {
    doc: "Póliza de seguro",
    detalle: "Con su cuota al día: una póliza vigente pero impaga no cubre.",
  },
  {
    doc: "RUTA — Registro Único del Transporte Automotor",
    detalle:
      "La inscripción de la empresa y de cada unidad afectada al servicio.",
  },
  {
    doc: "Patente y tributos del automotor",
    detalle: "La deuda impaga aparece en el control de ruta.",
  },
  { doc: "Tacógrafo", detalle: "Con su verificación vigente." },
  {
    doc: "Habilitaciones por tipo de carga",
    detalle:
      "Carga peligrosa, SENASA, bromatología: depende de qué se transporte.",
  },
  {
    doc: "Matafuegos y equipamiento de seguridad",
    detalle: "Con carga vigente. Es de lo primero que se mira en un control.",
  },
];

/** Documentación por persona. */
const POR_CHOFER = [
  {
    doc: "Licencia de conducir",
    detalle: "De la categoría que corresponde a la unidad que maneja.",
  },
  {
    doc: "LiNTI — Licencia Nacional de Transporte Interjurisdiccional",
    detalle:
      "Emitida por la CNRT. Es la habilitación específica del transporte de jurisdicción nacional.",
  },
  {
    doc: "Psicofísico",
    detalle:
      "Requisito de la LiNTI. Vence antes que la licencia y es el que más se olvida.",
  },
  {
    doc: "Cursos de capacitación",
    detalle:
      "Carga peligrosa, mercancías perecederas y los que exija el tipo de servicio.",
  },
  {
    doc: "ART y alta temprana",
    detalle:
      "No lo pide el control de ruta, pero sí la inspección laboral.",
  },
  {
    doc: "Libreta sanitaria",
    detalle: "Cuando el tipo de carga la exige.",
  },
];

const FAQ = [
  {
    p: "¿Qué documentación de un camión controla la CNRT en la ruta?",
    r: "En un control de transporte interjurisdiccional se verifica la habilitación de la unidad (RTO y RUTA), la del chofer (licencia y LiNTI vigente, con su psicofísico), el seguro al día, el tacógrafo y la documentación de la carga. Según el tipo de carga se suman habilitaciones específicas, como la de carga peligrosa.",
  },
  {
    p: "¿Cuándo vence la LiNTI?",
    r: "La LiNTI tiene una vigencia definida por la CNRT que depende del caso, y está atada al psicofísico: cuando vence el psicofísico, la habilitación deja de estar operativa aunque la fecha impresa diga otra cosa. Por eso conviene controlar las dos fechas por separado y no confiar sólo en la que figura en el plástico.",
  },
  {
    p: "¿Se puede llevar el control de vencimientos en Excel?",
    r: "Se puede, y funciona hasta que la flota crece. El problema del Excel no es guardar la fecha: es que nadie lo abre. No avisa, no bloquea la asignación de un viaje y nada garantiza que la fila diga lo mismo que el papel que está en la guantera. Apenas hay dos personas cargando datos, empiezan a convivir versiones distintas del mismo archivo.",
  },
  {
    p: "¿Con cuánta anticipación conviene avisar un vencimiento?",
    r: "Depende del trámite. Un psicofísico se saca en días; una RTO con el taller ocupado y la unidad en viaje puede llevar semanas. La regla práctica es que el aviso llegue con margen para resolverlo sin frenar la operación, y por eso el plazo debería configurarse por tipo de documento en vez de usar uno solo para todo.",
  },
  {
    p: "¿Qué pasa si sale un camión con la documentación vencida?",
    r: "El riesgo no es sólo la multa. Puede haber retención de la unidad en el lugar del control, con la carga arriba y el chofer parado, y en un siniestro una habilitación vencida es el argumento con el que la aseguradora discute la cobertura. El costo real casi nunca es el del acta.",
  },
];

useSeoMeta({
  title: "Control de vencimientos de flota: CNRT, LiNTI, RTO y seguros",
  description:
    "Qué documentación vence en una flota de camiones en Argentina —RTO, RUTA, " +
    "seguro, LiNTI, psicofísico— y cómo controlarla sin planillas: alertas por " +
    "anticipación y bloqueo de asignación cuando un papel está vencido.",
  ogTitle: "Control de vencimientos de flota: CNRT, LiNTI, RTO y seguros",
  ogDescription:
    "El inventario completo de lo que vence en una flota argentina, por unidad " +
    "y por chofer, y cómo dejar de controlarlo en Excel.",
  // `article` y no `website`: es contenido editorial, no la portada de un sitio.
  ogType: "article",
  ogImage: `${SITIO.origen}${SITIO.imagenSocial}`,
  twitterCard: "summary_large_image",
});

useCanonical("/control-vencimientos-cnrt");

/**
 * Migas y preguntas, en un solo `@graph`.
 *
 * El `FAQPage` es lo que puede hacer que las preguntas aparezcan desplegables
 * debajo del resultado. Sale del mismo arreglo que dibuja la sección visible:
 * un marcado que declara preguntas que la página no muestra es motivo de
 * penalización manual.
 */
useDatosEstructurados({
  "@context": "https://schema.org",
  "@graph": [
    migasJsonLd([
      { nombre: "Inicio", ruta: "/" },
      {
        nombre: "Control de vencimientos",
        ruta: "/control-vencimientos-cnrt",
      },
    ]),
    {
      "@type": "FAQPage",
      "@id": `${SITIO.origen}/control-vencimientos-cnrt#faq`,
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
    eyebrow="Documentación y habilitaciones"
    miga="Control de vencimientos"
    titulo="Control de vencimientos de flota: CNRT, LiNTI, RTO y seguros"
    bajada="En una flota de camiones vencen unas quince cosas distintas, algunas
            por unidad y otras por persona, y ninguna avisa sola. Esto es el
            inventario completo de qué controlar y cómo hacerlo sin depender de
            que alguien se acuerde."
    :secciones="SECCIONES"
    cierre-titulo="Que el vencimiento te avise a vos, no Gendarmería"
    cierre-texto="Cargá tu flota y tus choferes con sus fechas y CamioNex te avisa
                  con la anticipación que definas. Treinta días de prueba con
                  acceso completo."
  >
    <h2 id="que-vence">1. Qué vence en una flota</h2>
    <p>
      El primer problema del control de vencimientos no es el seguimiento: es el
      inventario. Casi todas las flotas controlan bien las tres o cuatro fechas
      que ya les costaron un disgusto, y descubren el resto en el peor momento.
      Esta es la lista completa, separada en las dos cosas que vencen por
      caminos distintos: la unidad y la persona.
    </p>

    <h3>Por unidad</h3>
    <ul class="tema-items">
      <li v-for="d in POR_UNIDAD" :key="d.doc">
        <span>
          <strong>{{ d.doc }}.</strong>
          {{ d.detalle }}
        </span>
      </li>
    </ul>

    <h3>Por chofer</h3>
    <ul class="tema-items">
      <li v-for="d in POR_CHOFER" :key="d.doc">
        <span>
          <strong>{{ d.doc }}.</strong>
          {{ d.detalle }}
        </span>
      </li>
    </ul>

    <div class="legal-nota">
      <p>
        Las vigencias no son iguales para todos: dependen de la categoría de la
        unidad, de la edad del chofer, del tipo de carga y de la jurisdicción en
        la que esté radicado el vehículo. Este listado dice <em>qué</em> hay que
        controlar; <em>cada cuánto</em> se verifica contra el documento que
        emitió el organismo, no contra una regla general.
      </p>
    </div>

    <h2 id="por-que-falla">2. Por qué falla el Excel</h2>
    <p>
      La planilla de vencimientos es probablemente el archivo más común del
      rubro, y no falla por estar mal armada. Falla por tres razones
      estructurales que ninguna fórmula arregla:
    </p>
    <ul>
      <li>
        <strong>No avisa.</strong> Una celda que se pone roja sólo sirve si
        alguien abre el archivo ese día. El día que hay quilombo —que es
        justamente el día en que se vence algo— nadie lo abre.
      </li>
      <li>
        <strong>No bloquea nada.</strong> Podés asignarle un viaje a un chofer
        con el psicofísico vencido y la planilla no se entera. El archivo que
        guarda la fecha y el proceso que arma el viaje son dos cosas separadas.
      </li>
      <li>
        <strong>No tiene el papel.</strong> La fila dice una fecha; el
        comprobante está en un cajón, en una foto de WhatsApp o en la guantera.
        Cuando hay que mostrarlo, la fecha sola no alcanza.
      </li>
    </ul>
    <p>
      A eso se suma lo previsible: apenas hay dos personas cargando datos
      empiezan a circular versiones distintas del mismo archivo, y la que está
      abierta en el escritorio no siempre es la última.
    </p>

    <h2 id="costo">3. Lo que cuesta un vencido</h2>
    <p>El acta es la parte barata. Lo caro es todo lo demás:</p>
    <ul>
      <li>
        <strong>La unidad retenida.</strong> Un camión frenado en un control es
        una entrega que no llega, un cliente al que hay que avisarle y, muchas
        veces, un flete de rescate.
      </li>
      <li>
        <strong>El chofer parado.</strong> Se le paga igual, y el viaje que iba
        a hacer lo hace otro o no lo hace nadie.
      </li>
      <li>
        <strong>La cobertura discutida.</strong> En un siniestro, una
        habilitación vencida es exactamente el argumento que busca la
        aseguradora. Ahí el número deja de tener coma.
      </li>
      <li>
        <strong>El cliente que no vuelve.</strong> Las cargas que exigen
        auditoría de proveedores piden documentación al día, y una observación
        te saca de la lista.
      </li>
    </ul>

    <h2 id="como-resolverlo">4. Cómo se controla de verdad</h2>
    <p>
      Un control de vencimientos que funciona tiene cuatro propiedades, y las
      cuatro son sobre el proceso antes que sobre la herramienta:
    </p>
    <ol>
      <li>
        <strong>Una sola fuente.</strong> Una fecha, un lugar. Si la fecha vive
        en dos planillas, en algún momento van a decir cosas distintas y no vas
        a saber cuál creer.
      </li>
      <li>
        <strong>El documento adjunto a la fecha.</strong> El PDF o la foto
        guardados junto al vencimiento, no en una carpeta aparte. Sirve para
        mostrarlo en un control y para verificar que la fecha cargada es la que
        dice el papel.
      </li>
      <li>
        <strong>Aviso empujado, no consultado.</strong> El sistema tiene que
        buscarte a vos. Y con anticipación distinta según el trámite: un
        psicofísico se resuelve en días, una RTO con la unidad en viaje puede
        llevar semanas.
      </li>
      <li>
        <strong>Consecuencia en la operación.</strong> Si un chofer tiene la
        licencia vencida, el sistema que asigna los viajes tiene que impedirlo.
        Un aviso que se puede ignorar termina ignorándose.
      </li>
    </ol>

    <h2 id="camionex">5. Cómo lo hace CamioNex</h2>
    <p>
      <NuxtLink to="/">CamioNex</NuxtLink> es un software de gestión de flotas
      para empresas de transporte de carga, y el control de documentación es uno
      de sus módulos. Concretamente:
    </p>
    <ul class="tema-items">
      <li>
        <span>
          <strong>Documentación por unidad y por persona</strong>, cada una con
          su fecha de vencimiento y el archivo adjunto —foto o PDF—, cargado
          desde la computadora o desde el celular.
        </span>
      </li>
      <li>
        <span>
          <strong>Alertas con anticipación configurable</strong>, distintas por
          tipo de documento, que llegan a una bandeja ordenada por prioridad en
          lugar de perderse entre los mensajes del grupo de WhatsApp.
        </span>
      </li>
      <li>
        <span>
          <strong>Bloqueo de asignación</strong>: un chofer con la licencia
          vencida no puede ser asignado a un viaje. La regla vive en el sistema,
          no en la memoria del que arma la hoja de ruta.
        </span>
      </li>
      <li>
        <span>
          <strong>Legajo del chofer</strong> con las habilitaciones argentinas
          que importan —LiNTI, CNRT, psicofísico, cursos de carga peligrosa—, y
          no un campo de texto libre donde cada uno escribe lo que le parece.
        </span>
      </li>
      <li>
        <span>
          <strong>El chofer ve lo suyo</strong> desde su propio celular y puede
          mostrar el documento en un control sin llamar a la oficina.
        </span>
      </li>
    </ul>
    <p>
      Está disponible en todos los planes, incluido el más chico. Podés ver el
      detalle en <NuxtLink to="/#planes">planes y precios</NuxtLink>, y también
      cómo se resuelve la
      <NuxtLink to="/rendicion-de-viajes">
        rendición de gastos del viaje
      </NuxtLink>
      y el
      <NuxtLink to="/costo-por-kilometro">costo por kilómetro</NuxtLink>.
    </p>

    <h2 id="preguntas">6. Preguntas frecuentes</h2>
    <template v-for="f in FAQ" :key="f.p">
      <h3>{{ f.p }}</h3>
      <p>{{ f.r }}</p>
    </template>
  </LandingPaginaTema>
</template>
