<script setup lang="ts">
/**
 * Términos y condiciones del servicio.
 *
 * Es un contrato B2B de software como servicio, no un texto de e-commerce: el
 * cliente es una empresa de transporte, no un consumidor final. Está redactado
 * sobre derecho argentino (Código Civil y Comercial, Ley 25.326, Ley 25.506) y
 * con las previsiones necesarias para clientes de otros Estados del Mercosur,
 * porque el transporte de carga de la región es transfronterizo por definición.
 *
 * Los `[completar: …]` son datos societarios que sólo la empresa conoce. Se
 * resaltan en amarillo (`.legal-completar`) para que sea imposible publicar la
 * página sin verlos. El texto necesita revisión de un abogado antes de salir a
 * producción: es una base sólida y específica del negocio, no un dictamen.
 */
definePageMeta({ layout: "public" });

const ACTUALIZADO = "17 de agosto de 2026";

const SECCIONES = [
  { id: "prestador", titulo: "Quiénes prestamos el servicio" },
  { id: "aceptacion", titulo: "Aceptación y capacidad" },
  { id: "objeto", titulo: "Qué es FleetLog y qué no es" },
  { id: "cuentas", titulo: "Cuenta, usuarios y credenciales" },
  { id: "prueba", titulo: "Prueba gratuita de 30 días" },
  { id: "planes", titulo: "Planes, unidades y precios" },
  { id: "facturacion", titulo: "Facturación, pago y mora" },
  { id: "uso", titulo: "Uso permitido y prohibido" },
  { id: "datos-cliente", titulo: "Datos del cliente y exportación" },
  { id: "choferes", titulo: "Obligaciones sobre choferes y empleados" },
  { id: "disponibilidad", titulo: "Disponibilidad y soporte" },
  { id: "propiedad", titulo: "Propiedad intelectual" },
  { id: "confidencialidad", titulo: "Confidencialidad" },
  { id: "privacidad", titulo: "Protección de datos personales" },
  { id: "responsabilidad", titulo: "Garantías y responsabilidad" },
  { id: "baja", titulo: "Suspensión y baja" },
  { id: "cambios", titulo: "Cambios en el servicio y en estos términos" },
  { id: "mercosur", titulo: "Clientes del Mercosur" },
  { id: "generales", titulo: "Cláusulas generales" },
  { id: "jurisdiccion", titulo: "Ley aplicable y jurisdicción" },
];

useSeoMeta({
  title: "Términos y Condiciones",
  description:
    "Condiciones de contratación del servicio FleetLog para empresas de " +
    "transporte de carga en Argentina y el Mercosur.",
  robots: "index, follow",
});
</script>

<template>
  <LegalDocumentoLegal
    titulo="Términos y Condiciones del Servicio"
    bajada="Las reglas del acuerdo entre tu empresa y FleetLog: qué contratás,
            qué se paga, de quién son los datos y qué pasa si algo sale mal.
            Está escrito para que se entienda sin abogado al lado."
    :actualizado="ACTUALIZADO"
    :secciones="SECCIONES"
  >
    <h2 id="prestador">1. Quiénes prestamos el servicio</h2>
    <p>
      FleetLog (en adelante, «FleetLog», «el Servicio» o «nosotros») es una
      plataforma de gestión de flotas operada por
      <strong>NorthAr Consulting</strong>,
      <span class="legal-completar">[completar: razón social]</span>, CUIT
      <span class="legal-completar">[completar: CUIT]</span>, con domicilio en
      <span class="legal-completar">[completar: domicilio legal]</span>,
      República Argentina.
    </p>
    <p>
      Podés contactarnos por correo electrónico a
      <a href="mailto:info@northar.com.ar">info@northar.com.ar</a>, tanto para
      cuestiones contractuales como para consultas comerciales, o por WhatsApp
      al
      <a
        href="https://api.whatsapp.com/send/?phone=543624569542&amp;text&amp;type=phone_number&amp;app_absent=0"
        target="_blank"
        rel="noopener"
      >
        +54 362 456-9542
      </a>
      .
    </p>

    <h2 id="aceptacion">2. Aceptación y capacidad para contratar</h2>
    <p>
      Al crear una cuenta, iniciar una prueba gratuita o utilizar el Servicio,
      la empresa que lo hace (en adelante, «el Cliente») acepta estos términos
      en su totalidad. Quien completa el alta declara estar facultado para
      obligar a la empresa que representa.
    </p>
    <p>
      El Servicio está dirigido exclusivamente a personas jurídicas y a personas
      humanas que contratan en el marco de su actividad comercial o profesional.
      <strong>No se trata de una relación de consumo</strong> en los términos de
      la Ley 24.240, sin perjuicio de las normas de orden público que resulten
      aplicables si en un caso concreto se configurara.
    </p>

    <h2 id="objeto">3. Qué es FleetLog y qué no es</h2>
    <p>
      FleetLog es un servicio de software en la nube (SaaS) que permite
      administrar flotas de transporte de carga: unidades, viajes, checklists,
      documentación y vencimientos, gastos de ruta, rendiciones, combustible,
      mantenimiento, legajos del personal e indicadores de gestión. Se accede
      por navegador y por la aplicación móvil del chofer.
    </p>
    <p>
      FleetLog otorga al Cliente una licencia de uso no exclusiva,
      intransferible y revocable, limitada al plazo contratado y al alcance del
      plan elegido. No se vende software ni se cede código fuente.
    </p>

    <div class="legal-nota">
      <p><strong>Lo que FleetLog no hace:</strong></p>
      <ul>
        <li>
          No presta servicios de transporte, logística, seguros ni
          intermediación de cargas.
        </li>
        <li>
          No emite documentación aduanera ni de transporte internacional (CRT,
          MIC/DTA), ni se conecta con los sistemas de las aduanas.
        </li>
        <li>
          No reemplaza las obligaciones del Cliente ante la CNRT, AFIP-ARCA, las
          autoridades de trabajo o cualquier otro organismo: los avisos de
          vencimiento son una ayuda de gestión, no una garantía de cumplimiento.
        </li>
        <li>
          No brinda asesoramiento legal, contable, impositivo ni de seguridad e
          higiene.
        </li>
        <li>
          No provee hardware de rastreo satelital ni certifica el
          posicionamiento de las unidades a efectos legales.
        </li>
      </ul>
      <p>
        Las decisiones operativas, laborales y comerciales que el Cliente tome a
        partir de la información del sistema son de su exclusiva
        responsabilidad.
      </p>
    </div>

    <h2 id="cuentas">4. Cuenta, usuarios y credenciales</h2>
    <p>
      El Cliente es responsable de la veracidad de los datos de alta, de definir
      quiénes acceden y con qué perfil, y de la confidencialidad de las
      credenciales. Toda actividad realizada desde una cuenta se considera hecha
      por el Cliente.
    </p>
    <p>
      Las credenciales son personales e intransferibles. El Cliente debe
      notificarnos de inmediato cualquier uso no autorizado y dar de baja los
      accesos del personal que deje de prestar servicios.
    </p>
    <p>
      Todos los planes incluyen usuarios y choferes ilimitados: la facturación
      no depende de la cantidad de personas con acceso.
    </p>

    <h2 id="prueba">5. Prueba gratuita de 30 días</h2>
    <p>
      Toda alta nueva comienza con <strong>30 días corridos</strong> de acceso
      completo al plan Operación, sin costo y sin necesidad de informar un medio
      de pago. El plazo se cuenta desde la verificación de la dirección de
      correo electrónico del alta.
    </p>
    <p>
      Avisamos por correo electrónico antes del vencimiento. Terminada la
      prueba, si el Cliente no contrata un plan, la cuenta queda bloqueada: no
      se puede operar, pero <strong>los datos no se eliminan</strong> y siguen
      disponibles para exportación conforme la sección
      <a href="#datos-cliente">9</a>.
    </p>
    <p>
      La prueba gratuita se ofrece una sola vez por empresa. Nos reservamos el
      derecho de rechazar altas sucesivas destinadas a encadenar períodos de
      prueba.
    </p>

    <h2 id="planes">6. Planes, unidades facturables y precios</h2>
    <p>
      El precio se compone de un <strong>abono mensual del plan</strong> más una
      <strong>tarifa por unidad</strong>, según el plan contratado y los mínimos
      publicados en el sitio.
    </p>
    <ul>
      <li>
        Se considera unidad facturable cada vehículo activo en el sistema. Los
        acoplados y semirremolques facturan al 50 % de la tarifa por unidad.
      </li>
      <li>
        Si la flota activa es menor al mínimo del plan, se factura el mínimo.
      </li>
      <li>
        Las altas y bajas de unidades dentro del período se prorratean en la
        facturación siguiente.
      </li>
      <li>
        Los cambios de plan se aplican de inmediato; la diferencia se prorratea
        en la factura siguiente.
      </li>
      <li>
        Los precios publicados están expresados en pesos argentinos y
        <strong>no incluyen IVA</strong> ni otros tributos, que se adicionan
        según la condición fiscal del Cliente.
      </li>
    </ul>
    <p>
      El plan Corporate y las implementaciones con alcance especial se rigen por
      la propuesta comercial firmada entre las partes, que prevalece sobre esta
      sección en caso de discrepancia.
    </p>

    <h2 id="facturacion">7. Facturación, pago y mora</h2>
    <p>
      El Servicio se factura por mes adelantado, salvo acuerdo de facturación
      anual. La factura electrónica se emite conforme la normativa fiscal
      argentina vigente y se envía a la dirección de correo informada por el
      Cliente.
    </p>
    <p>
      Podemos actualizar los precios de lista con un preaviso de
      <strong>30 días corridos</strong> por correo electrónico y publicación en
      el sitio. Si el Cliente no acepta la actualización, puede dar de baja el
      Servicio antes de su entrada en vigencia, sin penalidad y conservando el
      derecho a exportar sus datos.
    </p>
    <p>
      La falta de pago a los <strong>10 días corridos</strong> del vencimiento
      habilita la suspensión del acceso, previo aviso. La mora devenga los
      intereses previstos en la propuesta comercial o, en su defecto, la tasa
      activa del Banco de la Nación Argentina para operaciones de descuento a 30
      días. La suspensión por mora no interrumpe la facturación del período ni
      implica baja del Servicio.
    </p>

    <h2 id="uso">8. Uso permitido y prohibido</h2>
    <p>El Cliente se obliga a no:</p>
    <ul>
      <li>
        Ceder, revender, sublicenciar o prestar el acceso a terceros ajenos a su
        operación, ni compartir cuentas entre empresas distintas.
      </li>
      <li>
        Realizar ingeniería inversa, descompilar o intentar obtener el código
        fuente, salvo en la medida en que la ley lo autorice expresamente.
      </li>
      <li>
        Utilizar procesos automatizados de extracción masiva de datos, ni
        realizar pruebas de carga o de seguridad sin autorización previa y por
        escrito.
      </li>
      <li>
        Cargar contenido ilícito, ni datos personales de terceros sin base legal
        para hacerlo.
      </li>
      <li>
        Emplear el Servicio para vigilar a sus dependientes fuera del ámbito y
        la jornada laboral, o de un modo que vulnere su dignidad o intimidad.
      </li>
    </ul>

    <h2 id="datos-cliente">9. Datos del cliente, retención y exportación</h2>
    <p>
      <strong
        >Toda la información que el Cliente carga en el Servicio es de su
        propiedad</strong
      >: viajes, gastos, comprobantes, fotografías, legajos, mantenimientos e
      indicadores. FleetLog sólo la utiliza para prestar el Servicio, brindar
      soporte y cumplir obligaciones legales.
    </p>
    <p>
      Cada plan define una ventana de <strong>retención de histórico</strong>
      (el período hacia atrás que puede consultarse desde el sistema). Los datos
      anteriores a esa ventana permanecen almacenados y vuelven a estar
      disponibles al contratar un plan con mayor retención.
    </p>
    <p>
      El Cliente puede exportar su información en formatos estándar mientras la
      cuenta esté activa o bloqueada. Producida la baja definitiva, conservamos
      los datos por <strong>90 días corridos</strong> para permitir su
      recuperación y luego procedemos a su eliminación o anonimización, salvo lo
      que debamos conservar por obligación legal (documentación fiscal, por
      ejemplo).
    </p>
    <p>
      Podemos utilizar información estadística agregada y disociada —que no
      permite identificar al Cliente, a sus unidades ni a sus personas— para
      mejorar el Servicio.
    </p>

    <h2 id="choferes">10. Obligaciones del Cliente sobre choferes y empleados</h2>
    <p>
      Respecto de los datos personales de choferes, empleados y terceros que
      carga en el sistema, <strong>el Cliente es el responsable del
      tratamiento</strong> y FleetLog actúa como encargado, conforme la
      <a href="/politica-de-privacidad">Política de Privacidad</a>.
    </p>

    <div class="legal-nota">
      <p>En consecuencia, el Cliente se obliga a:</p>
      <ul>
        <li>
          Informar a su personal qué datos se registran, con qué finalidad y por
          cuánto tiempo, y contar con base legal suficiente para hacerlo.
        </li>
        <li>
          Informar expresamente que la aplicación del chofer registra la
          <strong>ubicación al momento de cargar</strong> gastos, cargas de
          combustible, lecturas de odómetro, incidentes e inspecciones, y
          obtener el consentimiento cuando corresponda.
        </li>
        <li>
          Limitar la carga de datos de salud a lo estrictamente necesario: en el
          caso del examen psicofísico, el resultado y su fecha de vencimiento, y
          no el detalle clínico.
        </li>
        <li>
          Atender los pedidos de acceso, rectificación o supresión de su
          personal, y registrar sus bases de datos ante el organismo de control
          cuando la normativa aplicable lo exija.
        </li>
      </ul>
    </div>

    <p>
      El Cliente mantendrá indemne a FleetLog frente a reclamos de terceros
      derivados del incumplimiento de estas obligaciones.
    </p>

    <h2 id="disponibilidad">11. Disponibilidad, mantenimiento y soporte</h2>
    <p>
      Trabajamos para que el Servicio esté disponible de forma continua, pero no
      se garantiza un funcionamiento ininterrumpido ni libre de errores. Podemos
      realizar tareas de mantenimiento programado, avisando con antelación
      razonable y procurando las franjas de menor actividad.
    </p>
    <p>
      El soporte se presta por los canales publicados, en días hábiles y en
      horario comercial de Argentina. Los compromisos de nivel de servicio (SLA)
      y de soporte extendido rigen únicamente si fueron pactados por escrito en
      la propuesta comercial.
    </p>
    <p>
      La aplicación del chofer permite operar sin conexión y sincroniza al
      recuperarla. No respondemos por fallas de conectividad, del dispositivo del
      usuario, de su sistema operativo o de las tiendas de aplicaciones.
    </p>

    <h2 id="propiedad">12. Propiedad intelectual</h2>
    <p>
      El software, su código, la marca «FleetLog», el diseño de las pantallas y
      la documentación son de titularidad de FleetLog o de sus licenciantes, y
      están protegidos por la Ley 11.723 de Propiedad Intelectual y por la Ley
      22.362 de Marcas. Estos términos no transfieren ningún derecho de
      propiedad intelectual al Cliente.
    </p>
    <p>
      Si el Cliente nos hace llegar sugerencias o ideas de mejora, podemos
      incorporarlas al producto sin que ello genere obligación de pago ni
      derecho alguno a su favor.
    </p>

    <h2 id="confidencialidad">13. Confidencialidad</h2>
    <p>
      Cada parte se obliga a mantener en reserva la información confidencial de
      la otra a la que acceda con motivo de esta relación, y a no divulgarla sin
      autorización. La obligación subsiste por <strong>tres años</strong>
      posteriores a la finalización del vínculo. No se considera confidencial la
      información pública, la que ya se conocía legítimamente o la que deba
      revelarse por orden de autoridad competente.
    </p>

    <h2 id="privacidad">14. Protección de datos personales</h2>
    <p>
      El tratamiento de datos personales se rige por la
      <a href="/politica-de-privacidad">Política de Privacidad</a>, que forma
      parte integrante de estos términos, y por la Ley 25.326 de Protección de
      Datos Personales de la República Argentina, su Decreto Reglamentario
      1558/2001 y las normas complementarias dictadas por la Agencia de Acceso a
      la Información Pública.
    </p>
    <p>
      Las firmas capturadas en la aplicación (conformidad de checklists,
      rendiciones e inspecciones) constituyen <strong>firma electrónica</strong>
      en los términos del artículo 5 de la Ley 25.506, salvo que el Cliente
      utilice certificados de firma digital emitidos por certificador licenciado.
    </p>

    <h2 id="responsabilidad">15. Garantías y limitación de responsabilidad</h2>
    <p>
      El Servicio se presta «tal como está» y conforme a la funcionalidad
      publicada del plan contratado. No garantizamos que resulte apto para un
      fin particular distinto del descripto, ni que la información cargada por
      el Cliente o su personal sea exacta.
    </p>
    <p>
      En ningún caso responderemos por daños indirectos, lucro cesante, pérdida
      de chance, pérdida de negocios, multas o sanciones administrativas
      impuestas al Cliente, ni por decisiones tomadas sobre la base de la
      información del sistema.
    </p>
    <p>
      Nuestra responsabilidad total acumulada, por cualquier concepto, queda
      limitada al <strong>importe efectivamente abonado por el Cliente en los
      12 meses anteriores</strong> al hecho que motiva el reclamo. Esta
      limitación no se aplica al dolo ni a los supuestos en que la ley no
      admita limitación.
    </p>

    <h2 id="baja">16. Suspensión y baja</h2>
    <p>
      El Cliente puede dar de baja el Servicio en cualquier momento, con efecto
      al final del período facturado en curso. No se reintegran importes por
      períodos ya facturados, salvo lo previsto en la sección
      <a href="#facturacion">7</a> para el rechazo de una actualización de
      precios.
    </p>
    <p>
      Podemos suspender el acceso, con aviso previo cuando sea posible, por
      falta de pago, por uso que ponga en riesgo la seguridad o la operación de
      la plataforma, o por incumplimiento grave de estos términos. Si la causa
      no se subsana en <strong>30 días corridos</strong>, podemos resolver el
      contrato, siempre respetando el derecho de exportación de datos de la
      sección <a href="#datos-cliente">9</a>.
    </p>

    <h2 id="cambios">17. Cambios en el servicio y en estos términos</h2>
    <p>
      El producto evoluciona: podemos agregar, modificar o discontinuar
      funcionalidades. Si una modificación redujera de manera sustancial
      prestaciones incluidas en el plan contratado, lo avisaremos con
      <strong>60 días corridos</strong> de anticipación y el Cliente podrá dar
      de baja el Servicio sin penalidad.
    </p>
    <p>
      Los cambios en estos términos se publican en esta página con su fecha de
      vigencia y se comunican por correo electrónico con al menos
      <strong>30 días corridos</strong> de anticipación. El uso del Servicio con
      posterioridad a la entrada en vigencia implica su aceptación.
    </p>

    <h2 id="mercosur">18. Clientes del Mercosur</h2>
    <p>
      El Servicio está disponible para empresas domiciliadas en la República
      Argentina y en los demás Estados Parte y Estados Asociados del Mercosur.
      Para esos clientes rigen además las siguientes previsiones:
    </p>
    <ul>
      <li>
        <strong>Normativa de transporte.</strong> El cumplimiento de la
        regulación de transporte del país de radicación de la flota es
        exclusiva responsabilidad del Cliente (a modo de ejemplo: CNRT en
        Argentina, ANTT en Brasil, DINATRAN en Paraguay y la Dirección Nacional
        de Transporte en Uruguay), así como de las obligaciones del Acuerdo
        sobre Transporte Internacional Terrestre para los viajes de carácter
        internacional.
      </li>
      <li>
        <strong>Funcionalidades de alcance nacional.</strong> Las prestaciones
        diseñadas sobre normativa argentina —planilla de inspección de los siete
        puntos de AFIP-ARCA y habilitaciones LiNTI/CNRT, entre otras— se
        ofrecen como herramientas de registro. Su validez ante autoridades de
        otros países debe ser verificada por el Cliente.
      </li>
      <li>
        <strong>Moneda e impuestos.</strong> Salvo acuerdo expreso de
        facturación en dólares estadounidenses, la facturación se realiza en
        pesos argentinos. Los tributos, retenciones o percepciones que graven la
        operación en el país del Cliente son a su exclusivo cargo y no reducen
        el importe neto a percibir por FleetLog.
      </li>
      <li>
        <strong>Idioma.</strong> La versión en español de estos términos es la
        única con valor contractual. Cualquier traducción se entrega a título
        informativo.
      </li>
    </ul>

    <h2 id="generales">19. Cláusulas generales</h2>
    <p>
      <strong>Cesión.</strong> El Cliente no puede ceder su posición contractual
      sin nuestra conformidad previa por escrito. FleetLog puede cederla en caso
      de reorganización societaria, fusión o transferencia de fondo de comercio,
      manteniendo las condiciones vigentes.
    </p>
    <p>
      <strong>Caso fortuito y fuerza mayor.</strong> Ninguna parte responde por
      incumplimientos derivados de hechos ajenos a su control razonable, tales
      como cortes generalizados de energía o de conectividad, fallas de
      proveedores de infraestructura, actos de autoridad, conflictos gremiales o
      catástrofes naturales.
    </p>
    <p>
      <strong>Nulidad parcial.</strong> Si alguna cláusula fuera declarada
      inválida, el resto conserva plena vigencia y la cláusula afectada se
      interpretará del modo más próximo a la intención original de las partes.
    </p>
    <p>
      <strong>Notificaciones.</strong> Las comunicaciones se cursan a las
      direcciones de correo electrónico informadas por cada parte y se tienen
      por recibidas al día hábil siguiente de su envío. Es responsabilidad del
      Cliente mantener actualizada la suya.
    </p>
    <p>
      <strong>Acuerdo íntegro.</strong> Estos términos, la Política de
      Privacidad y —de existir— la propuesta comercial firmada constituyen el
      acuerdo completo entre las partes y reemplazan todo entendimiento
      anterior sobre la materia.
    </p>

    <h2 id="jurisdiccion">20. Ley aplicable y jurisdicción</h2>
    <p>
      Estos términos se rigen por las leyes de la República Argentina, con
      exclusión de sus normas de conflicto.
    </p>
    <p>
      Para clientes domiciliados en Argentina, las partes se someten a los
      tribunales ordinarios de
      <span class="legal-completar">[completar: ciudad de la jurisdicción]</span
      >, renunciando a cualquier otro fuero.
    </p>
    <p>
      Para clientes domiciliados en otros Estados Parte del Mercosur, la
      elección de los tribunales argentinos se realiza al amparo del
      <strong>Protocolo de Buenos Aires sobre Jurisdicción Internacional en
      Materia Contractual</strong> (Decisión CMC 1/94). Las partes pueden
      acordar por escrito someter la controversia a arbitraje conforme el
      Acuerdo sobre Arbitraje Comercial Internacional del Mercosur (Decisión CMC
      3/98), con sede en
      <span class="legal-completar">[completar: sede arbitral]</span> e idioma
      español.
    </p>

    <p class="legal-fina">
      Ante cualquier duda sobre estas condiciones, escribinos a
      <a href="mailto:info@northar.com.ar">info@northar.com.ar</a> antes
      de contratar. Preferimos aclararlo por adelantado.
    </p>
  </LegalDocumentoLegal>
</template>
