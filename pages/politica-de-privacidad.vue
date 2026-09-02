<script setup lang="ts">
/**
 * Política de privacidad.
 *
 * La particularidad de este producto es que trata datos personales en dos
 * papeles distintos y no puede confundirlos:
 *
 *  - **Responsable** de los datos de la cuenta del cliente (contacto comercial,
 *    facturación, uso de la plataforma).
 *  - **Encargado** de los datos que el cliente carga sobre sus choferes y
 *    empleados: legajos, habilitaciones, ubicación de las cargas, fotos.
 *
 * Todo el texto está redactado sobre lo que el sistema hace de verdad. La
 * ubicación, por ejemplo, se captura por evento (`useGeolocation` se invoca al
 * cargar un gasto, combustible, odómetro, incidente u OEA) y no hay
 * `watchPosition`: no hay rastreo continuo, y la política no debe insinuar
 * que lo hay ni reservarse el derecho a hacerlo.
 *
 * Los `[completar: …]` son datos que dependen de la infraestructura y de la
 * sociedad. Requiere revisión profesional antes de publicarse.
 */
definePageMeta({ layout: "public" });

const ACTUALIZADO = "17 de agosto de 2026";

const SECCIONES = [
  { id: "alcance", titulo: "Alcance y nuestros dos roles" },
  { id: "que-datos", titulo: "Qué datos tratamos" },
  { id: "personal", titulo: "Datos de choferes y empleados" },
  { id: "salud", titulo: "Datos de salud" },
  { id: "ubicacion", titulo: "Ubicación: cuándo y por qué" },
  { id: "imagenes", titulo: "Fotos, comprobantes y firmas" },
  { id: "finalidades", titulo: "Para qué los usamos" },
  { id: "cookies", titulo: "Cookies, sesión y analítica" },
  { id: "compartir", titulo: "Con quién los compartimos" },
  { id: "internacional", titulo: "Transferencias internacionales" },
  { id: "seguridad", titulo: "Seguridad" },
  { id: "conservacion", titulo: "Cuánto tiempo los conservamos" },
  { id: "derechos", titulo: "Tus derechos" },
  { id: "choferes", titulo: "Si sos chofer de una empresa cliente" },
  { id: "menores", titulo: "Menores de edad" },
  { id: "cambios", titulo: "Cambios en esta política" },
  { id: "contacto", titulo: "Contacto y organismo de control" },
];

useSeoMeta({
  title: "Política de Privacidad",
  description:
    "Cómo CamioNex trata los datos personales de sus clientes y de los choferes " +
    "y empleados que ellos registran, conforme la Ley 25.326 y la normativa del " +
    "Mercosur.",
  robots: "index, follow",
});

useCanonical("/politica-de-privacidad");

// Las migas le dan al buscador la jerarquía del sitio y se muestran debajo del
// título del resultado, en lugar de la URL cruda.
useDatosEstructurados(
  migasJsonLd([
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Política de Privacidad", ruta: "/politica-de-privacidad" },
  ]),
);
</script>

<template>
  <LegalDocumentoLegal
    titulo="Política de Privacidad"
    bajada="Qué datos trata CamioNex, con qué finalidad, por cuánto tiempo y qué
            podés hacer al respecto. Incluye lo que corresponde a los datos de
            los choferes, que son los más sensibles de todo el sistema."
    :actualizado="ACTUALIZADO"
    :secciones="SECCIONES"
  >
    <h2 id="alcance">1. Alcance y nuestros dos roles</h2>
    <p>
      Esta política explica cómo CamioNex, operado por
      <strong>NorthAr Consulting</strong>,
      <span class="legal-completar">[completar: razón social]</span>, CUIT
      <span class="legal-completar">[completar: CUIT]</span>, con domicilio en
      <span class="legal-completar">[completar: domicilio legal]</span>,
      República Argentina, trata los datos personales vinculados a la plataforma
      web y a la aplicación móvil del chofer.
    </p>
    <p>
      CamioNex trata datos personales en dos papeles distintos, y la diferencia
      importa mucho para saber a quién reclamar:
    </p>
    <ul>
      <li>
        <strong>Como responsable del tratamiento</strong>, respecto de los datos
        de la cuenta de la empresa cliente: contacto comercial, facturación y
        uso de la plataforma. Ahí decidimos nosotros la finalidad.
      </li>
      <li>
        <strong>Como encargado del tratamiento</strong>, respecto de todo lo que
        la empresa cliente carga sobre su operación y su personal: legajos,
        habilitaciones, viajes, gastos, fotografías y ubicaciones.
        <strong>El responsable es la empresa empleadora</strong>; nosotros sólo
        procesamos esos datos siguiendo sus instrucciones y para prestarle el
        servicio.
      </li>
    </ul>
    <p>
      Se aplica la Ley 25.326 de Protección de Datos Personales de la República
      Argentina, su Decreto Reglamentario 1558/2001 y las normas de la Agencia
      de Acceso a la Información Pública (AAIP).
    </p>

    <h2 id="que-datos">2. Qué datos tratamos</h2>

    <h3>Datos de la cuenta y del contacto comercial</h3>
    <ul>
      <li>
        Razón social, CUIT o identificación tributaria equivalente y domicilio.
      </li>
      <li>
        Nombre, apellido, correo electrónico, teléfono y cargo de las personas
        que administran la cuenta.
      </li>
      <li>Datos de facturación y de los pagos realizados.</li>
    </ul>

    <h3>Datos técnicos y de uso</h3>
    <ul>
      <li>
        Dirección IP, tipo de dispositivo, sistema operativo y versión del
        navegador o de la aplicación.
      </li>
      <li>
        Registros de acceso y de actividad dentro del sistema (qué usuario hizo
        qué y cuándo), que sostienen la pista de auditoría de la plataforma.
      </li>
      <li>Errores técnicos y diagnósticos de funcionamiento.</li>
    </ul>

    <h3>Datos de la operación, cargados por la empresa cliente</h3>
    <ul>
      <li>Unidades, viajes, checklists, incidentes y mantenimientos.</li>
      <li>
        Gastos de ruta, adelantos, cargas de combustible y rendiciones, con sus
        comprobantes.
      </li>
      <li>Documentación de la flota y sus vencimientos.</li>
      <li>Mensajes intercambiados dentro de la plataforma.</li>
    </ul>

    <h2 id="personal">3. Datos de choferes y empleados</h2>
    <p>
      La empresa cliente puede registrar, sobre las personas que trabajan en su
      operación: nombre y apellido, DNI o CUIL, fecha de nacimiento, teléfono,
      domicilio, puesto, fecha de ingreso, contacto de emergencia, notas
      internas, correo electrónico de acceso a la aplicación, y habilitaciones
      con su número, organismo emisor, fechas de emisión y vencimiento, y el
      archivo digitalizado correspondiente (carnet de conducir, LiNTI, CNRT,
      carga peligrosa, examen psicofísico). En los planes que lo incluyen, se
      registra además el historial laboral: licencias, suspensiones y
      reincorporaciones.
    </p>

    <div class="legal-nota">
      <p>
        <strong>Sobre estos datos, el responsable es la empresa empleadora.</strong>
        Es ella quien debe informar a su personal qué se registra y para qué,
        contar con base legal para hacerlo, y atender los pedidos de acceso,
        rectificación o supresión. CamioNex actúa por su cuenta y orden, no
        utiliza esos datos para fines propios y no los cede a terceros ajenos a
        la prestación del servicio.
      </p>
    </div>

    <h2 id="salud">4. Datos de salud</h2>
    <p>
      El resultado del examen psicofísico y las licencias médicas constituyen
      <strong>datos sensibles</strong> en los términos del artículo 2 de la Ley
      25.326, y su tratamiento está sujeto a las restricciones del artículo 7.
    </p>
    <p>
      El sistema está pensado para registrar únicamente lo necesario a efectos
      de la habilitación para conducir: la condición de apto y la fecha de
      vencimiento. Recomendamos expresamente a las empresas clientes
      <strong>no cargar diagnósticos, estudios ni detalle clínico</strong> en el
      legajo ni en los campos de notas. La empresa cliente es responsable del
      contenido que carga y del deber de confidencialidad que pesa sobre los
      datos de salud de sus dependientes.
    </p>

    <h2 id="ubicacion">5. Ubicación: cuándo y por qué</h2>
    <p>
      La aplicación del chofer solicita la ubicación del dispositivo
      <strong>en momentos puntuales</strong>, cuando se registra un hecho de la
      operación que necesita quedar geolocalizado:
    </p>
    <ul>
      <li>al cargar un gasto de ruta;</li>
      <li>al registrar una carga de combustible;</li>
      <li>al tomar una lectura de odómetro;</li>
      <li>al reportar un incidente;</li>
      <li>al completar una inspección OEA.</li>
    </ul>

    <div class="legal-nota">
      <p>
        <strong>No hay seguimiento continuo.</strong> La aplicación no registra
        la posición en segundo plano, no traza recorridos y no monitorea el
        dispositivo fuera de esas acciones concretas. El chofer puede denegar el
        permiso de ubicación: la carga se completa igual, sin coordenadas.
      </p>
      <p>
        La finalidad es dar respaldo al comprobante (dónde se hizo esa carga de
        combustible, dónde ocurrió ese incidente), no controlar a la persona. El
        uso de esta información en el marco de la relación laboral es
        responsabilidad de la empresa empleadora, que debe informarlo
        previamente a su personal.
      </p>
    </div>

    <h2 id="imagenes">6. Fotos, comprobantes y firmas</h2>
    <p>
      El sistema almacena fotografías de tickets y comprobantes, imágenes de
      checklists e inspecciones, y archivos adjuntos de documentación. Estas
      imágenes pueden contener incidentalmente datos personales; se conservan
      asociadas al registro que las originó y con el mismo régimen de acceso.
    </p>
    <p>
      Las firmas capturadas en pantalla constituyen firma electrónica en los
      términos del artículo 5 de la Ley 25.506 y se almacenan junto al documento
      que validan.
    </p>

    <h2 id="finalidades">7. Para qué los usamos y con qué base legal</h2>
    <ul>
      <li>
        <strong>Prestar el servicio contratado</strong> —crear la cuenta,
        habilitar accesos, procesar la información de la operación y generar
        reportes—, sobre la base de la relación contractual con la empresa
        cliente (artículo 5, inciso 2, apartado a, de la Ley 25.326).
      </li>
      <li>
        <strong>Facturar y cobrar</strong>, y cumplir obligaciones contables,
        fiscales y de conservación documental.
      </li>
      <li>
        <strong>Dar soporte técnico</strong>, lo que puede implicar acceso
        acotado y registrado de nuestro personal a los datos de la cuenta,
        exclusivamente para resolver el pedido.
      </li>
      <li>
        <strong>Enviar avisos operativos</strong>: vencimientos, alertas,
        estado del viaje y notificaciones del sistema.
      </li>
      <li>
        <strong>Mantener la seguridad</strong> de la plataforma, prevenir
        fraudes y sostener la pista de auditoría.
      </li>
      <li>
        <strong>Enviar comunicaciones comerciales</strong> sobre novedades del
        producto, únicamente a los contactos comerciales de la cuenta y con
        opción de baja en cada envío.
      </li>
    </ul>
    <p>
      <strong>No vendemos datos personales</strong>, no los cedemos con fines
      publicitarios de terceros y no elaboramos perfiles con fines distintos de
      los descriptos.
    </p>

    <h2 id="cookies">8. Cookies, sesión y analítica</h2>
    <p>
      Utilizamos almacenamiento local del navegador y del dispositivo para
      mantener la sesión iniciada, recordar preferencias de la interfaz y
      sostener el funcionamiento sin conexión de la aplicación del chofer
      (cola de sincronización). Estas tecnologías son
      <strong>necesarias para que el sistema funcione</strong>: si se
      deshabilitan, no es posible iniciar sesión.
    </p>
    <p>
      El sitio público puede utilizar Google Analytics para medir el tráfico de
      forma agregada. Esta herramienta se activa sólo si está habilitada en la
      configuración del entorno, y puede bloquearse desde el navegador o con las
      extensiones que provee el propio proveedor.
    </p>
    <p>
      Si la empresa cliente habilita las notificaciones push, se registra un
      identificador del dispositivo con el único fin de entregar esos avisos.
    </p>

    <h2 id="compartir">9. Con quién los compartimos</h2>
    <p>
      Compartimos información sólo con quienes resultan necesarios para prestar
      el servicio, bajo obligación contractual de confidencialidad y de
      tratamiento conforme a nuestras instrucciones:
    </p>
    <ul>
      <li>
        Proveedores de infraestructura y alojamiento en la nube:
        <span class="legal-completar">[completar: proveedor y país del centro
        de datos]</span>.
      </li>
      <li>
        Proveedor de envío de correo electrónico transaccional:
        <span class="legal-completar">[completar: proveedor]</span>.
      </li>
      <li>
        Procesador de pagos y cobranzas:
        <span class="legal-completar">[completar: proveedor]</span>. No
        almacenamos números completos de tarjetas.
      </li>
      <li>
        Servicio de analítica web, en los términos de la sección
        <a href="#cookies">8</a>.
      </li>
      <li>
        Autoridades públicas, cuando exista requerimiento fundado en normativa
        vigente. En ese caso lo notificaremos a la empresa cliente, salvo
        prohibición legal.
      </li>
    </ul>

    <h2 id="internacional">10. Transferencias internacionales</h2>
    <p>
      Si el alojamiento o alguno de los proveedores mencionados se encuentra
      fuera de la República Argentina, la transferencia se realiza conforme al
      artículo 12 de la Ley 25.326 y a la Disposición 60-E/2016 de la entonces
      Dirección Nacional de Protección de Datos Personales, mediante contratos
      con las cláusulas modelo allí previstas o hacia países considerados con
      nivel adecuado de protección.
    </p>
    <p>
      Para clientes y titulares de datos domiciliados en otros Estados del
      Mercosur, tenemos en cuenta además la normativa local aplicable, en
      particular la Ley 13.709 (Lei Geral de Proteção de Dados Pessoais) de la
      República Federativa del Brasil y la Ley 18.331 de la República Oriental
      del Uruguay, sin perjuicio de las normas que rijan en los demás Estados
      Parte y Asociados.
    </p>

    <h2 id="seguridad">11. Seguridad</h2>
    <p>Aplicamos medidas técnicas y organizativas, entre ellas:</p>
    <ul>
      <li>cifrado de las comunicaciones mediante HTTPS;</li>
      <li>
        control de acceso por perfil, de modo que cada usuario vea sólo lo que
        su rol habilita;
      </li>
      <li>
        aislamiento de la información entre empresas clientes: los datos de una
        empresa no son accesibles desde la cuenta de otra;
      </li>
      <li>registro de auditoría de las operaciones sensibles;</li>
      <li>resguardos periódicos de la información.</li>
    </ul>
    <p>
      Ningún sistema es invulnerable. Ante un incidente de seguridad que afecte
      datos personales, lo notificaremos a la empresa cliente sin demora
      injustificada, con la información disponible y las medidas adoptadas, para
      que pueda cumplir con sus propias obligaciones de notificación.
    </p>

    <h2 id="conservacion">12. Cuánto tiempo los conservamos</h2>
    <p>
      Conservamos los datos mientras la cuenta esté vigente. Cada plan define
      además una ventana de consulta de histórico; los datos anteriores
      permanecen almacenados y vuelven a ser consultables si se contrata un plan
      con mayor retención.
    </p>
    <p>
      Producida la baja definitiva, mantenemos la información durante
      <strong>90 días corridos</strong> para permitir su exportación, y luego la
      eliminamos o anonimizamos. Se exceptúa lo que debamos conservar por
      obligación legal —documentación fiscal y contable, según los plazos de
      prescripción aplicables— y los registros de auditoría necesarios para
      acreditar el cumplimiento.
    </p>

    <h2 id="derechos">13. Tus derechos</h2>
    <p>
      Como titular de los datos podés solicitar el <strong>acceso</strong> a tu
      información, su <strong>rectificación</strong>, <strong>actualización</strong>
      o <strong>supresión</strong>, y oponerte a determinados tratamientos,
      conforme los artículos 14 a 16 de la Ley 25.326.
    </p>
    <p>
      Los pedidos se atienden dentro de los <strong>10 días corridos</strong>
      para el acceso y de los <strong>5 días hábiles</strong> para la
      rectificación, actualización o supresión. Podés dirigirlos a
      <a href="mailto:info@northar.com.ar">info@northar.com.ar</a>,
      indicando tu nombre completo y acreditando identidad.
    </p>
    <p class="legal-fina">
      El titular de los datos personales tiene la facultad de ejercer el derecho
      de acceso a los mismos en forma gratuita a intervalos no inferiores a seis
      meses, salvo que acredite un interés legítimo al efecto, conforme lo
      establecido en el artículo 14, inciso 3, de la Ley 25.326.
    </p>
    <p class="legal-fina">
      La Agencia de Acceso a la Información Pública, en su carácter de órgano de
      control de la Ley 25.326, tiene la atribución de atender las denuncias y
      reclamos que interpongan quienes resulten afectados en sus derechos por
      incumplimiento de las normas vigentes en materia de protección de datos
      personales.
    </p>

    <h2 id="choferes">14. Si sos chofer o empleado de una empresa cliente</h2>
    <p>
      Tus datos fueron cargados por tu empleador, que es el responsable de ese
      tratamiento. Para acceder a ellos, corregirlos o pedir su eliminación,
      dirigite en primer término a tu empleador, que es quien puede resolverlo.
    </p>
    <p>
      Si aun así preferís escribirnos a
      <a href="mailto:info@northar.com.ar">info@northar.com.ar</a>,
      derivaremos tu pedido a la empresa responsable y te lo confirmaremos.
      Nosotros no podemos modificar ni eliminar por cuenta propia datos que
      pertenecen a la operación de un cliente, salvo instrucción suya u orden de
      autoridad competente.
    </p>

    <h2 id="menores">15. Menores de edad</h2>
    <p>
      El servicio está dirigido a empresas y a personas mayores de edad. No
      recopilamos deliberadamente datos de menores. Si detectamos que se
      cargaron datos de una persona menor de edad sin base legal, los
      eliminaremos.
    </p>

    <h2 id="cambios">16. Cambios en esta política</h2>
    <p>
      Podemos actualizar esta política para reflejar cambios en el producto o en
      la normativa. Publicaremos la nueva versión en esta página con su fecha de
      vigencia y, cuando el cambio sea sustancial, lo comunicaremos por correo
      electrónico a los contactos de la cuenta con al menos
      <strong>30 días corridos</strong> de anticipación.
    </p>

    <h2 id="contacto">17. Contacto y organismo de control</h2>
    <p>
      Para cualquier consulta sobre esta política o sobre el tratamiento de tus
      datos, escribinos a
      <a href="mailto:info@northar.com.ar">info@northar.com.ar</a>.
    </p>
    <p>
      El organismo de control en la República Argentina es la
      <strong>Agencia de Acceso a la Información Pública</strong>, con domicilio
      en Av. Pte. Julio A. Roca 710, piso 2, Ciudad Autónoma de Buenos Aires
      (<a href="https://www.argentina.gob.ar/aaip" rel="noopener" target="_blank"
        >argentina.gob.ar/aaip</a
      >).
    </p>
    <p class="legal-fina">
      Esta política se complementa con los
      <a href="/terminos-y-condiciones">Términos y Condiciones</a> del servicio.
    </p>
  </LegalDocumentoLegal>
</template>
