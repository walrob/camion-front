<template>
  <v-container class="authentication pa-3">
    <v-row class="justify-center align-center">
      <v-col>
        <v-card
          class="pa-6 pa-md-8 mx-auto"
          elevation="10"
          rounded="2xl"
          color="white"
        >
          <v-card-item class="pa-0">
            <div class="mb-6 text-center">
              <h2 class="text-h4 text-primary mb-2 font-weight-bold">
                Política de Privacidad – Super Natu
              </h2>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="text-body-1 text-justify">
              <p>
                En <strong>Super Natu</strong> valoramos y respetamos la
                privacidad de nuestros clientes y usuarios. La presente Política
                de Privacidad explica cómo recopilamos, utilizamos, almacenamos
                y protegemos la información personal obtenida a través de
                nuestro sitio web y/o aplicación de comercio electrónico.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">
                1. Información que recopilamos
              </h4>
              <ul>
                <li>
                  <strong>Datos personales:</strong> nombre, apellido, DNI/CUIT
                  (si corresponde), correo electrónico, teléfono y dirección de
                  entrega.
                </li>
                <li>
                  <strong>Datos de cuenta:</strong> credenciales de acceso,
                  historial de compras y preferencias.
                </li>
                <li>
                  <strong>Datos de pago:</strong> información necesaria para
                  procesar pagos a través de proveedores externos. Super Natu no
                  almacena números completos de tarjetas ni datos financieros
                  sensibles.
                </li>
                <li>
                  <strong>Datos de uso:</strong> dirección IP, tipo de
                  navegador, dispositivo, sistema operativo, páginas visitadas y
                  actividad en la plataforma.
                </li>
                <li>
                  <strong>Cookies y tecnologías similares:</strong> utilizadas
                  para autenticación, funcionamiento del sitio, estadísticas y
                  mejora de la experiencia del usuario.
                </li>
              </ul>

              <h4 class="font-weight-bold mt-4 mb-1">
                2. Finalidad del tratamiento
              </h4>
              <p>Utilizamos la información recopilada para:</p>
              <ul>
                <li>Crear y administrar la cuenta del usuario.</li>
                <li>Procesar pedidos, pagos, envíos o retiros en tienda.</li>
                <li>Brindar atención al cliente y soporte.</li>
                <li>Enviar notificaciones sobre el estado de pedidos.</li>
                <li>
                  Ofrecer promociones, descuentos o novedades (si el usuario lo
                  autoriza).
                </li>
                <li>
                  Mejorar la seguridad, funcionamiento y experiencia del sitio.
                </li>
                <li>Cumplir obligaciones legales, contables y fiscales.</li>
              </ul>

              <h4 class="font-weight-bold mt-4 mb-1">
                3. Compartición de datos
              </h4>
              <p>
                La información podrá compartirse únicamente cuando resulte
                necesario para la prestación del servicio, por ejemplo:
              </p>
              <ul>
                <li>
                  Proveedores tecnológicos (hosting, almacenamiento en la nube,
                  soporte técnico).
                </li>
                <li>Pasarelas o procesadores de pago.</li>
                <li>
                  Servicios de logística o reparto para la entrega de pedidos.
                </li>
                <li>
                  Autoridades públicas cuando lo exija la normativa vigente.
                </li>
              </ul>
              <p>
                <strong
                  >Super Natu no vende ni comercializa datos personales.</strong
                >
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">
                4. Seguridad de la información
              </h4>
              <p>
                Implementamos medidas técnicas y organizativas para proteger los
                datos personales, incluyendo conexiones seguras (HTTPS),
                controles de acceso y buenas prácticas de seguridad. Sin
                embargo, ningún sistema es totalmente invulnerable.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">
                5. Conservación de datos
              </h4>
              <p>
                Los datos se conservarán mientras exista una relación comercial
                o contractual con el usuario y durante el tiempo necesario para
                cumplir con obligaciones legales o fiscales.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">
                6. Derechos del usuario
              </h4>
              <p>
                De acuerdo con la Ley N.º 25.326 de Protección de Datos
                Personales, el usuario puede acceder, rectificar, actualizar o
                solicitar la eliminación de sus datos personales en cualquier
                momento.
              </p>
              <p>
                Para ejercer estos derechos podrá contactarse por correo
                electrónico a:
                <strong>info@supernatu.com.ar</strong>
              </p>
              <p>
                La Agencia de Acceso a la Información Pública es el órgano de
                control encargado de velar por el cumplimiento de la normativa.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">7. Cookies</h4>
              <p>
                Utilizamos cookies propias y de terceros para mejorar la
                navegación, recordar preferencias y obtener estadísticas
                anónimas. El usuario puede configurar su navegador para
                rechazarlas o eliminarlas.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">8. Modificaciones</h4>
              <p>
                Super Natu podrá actualizar esta Política de Privacidad en
                cualquier momento. Las modificaciones entrarán en vigencia desde
                su publicación en el sitio.
              </p>

              <h4 class="font-weight-bold mt-4 mb-1">
                9. Responsable del tratamiento
              </h4>
              <p>
                El responsable del tratamiento de los datos personales es
                <strong>Super Natu</strong>, comercio electrónico con
                operaciones en la República Argentina.
              </p>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "blank",
});

useHead({
  title: "Política de Privacidad – Super Natu",
});
</script>
