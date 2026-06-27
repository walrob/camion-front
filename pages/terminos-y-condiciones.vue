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
                Términos y Condiciones – Super Natu
              </h2>
              <!-- <p class="text-caption text-medium-emphasis">
                Última actualización: {{ new Date().getFullYear() }}
              </p> -->
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="text-body-1 text-justify">
              <h4 class="mt-4 mb-1">1. Aceptación de los términos</h4>
              <p>
                Al acceder, navegar y utilizar el sitio web y/o la aplicación de
                Super Natu, el usuario acepta los presentes Términos y
                Condiciones. Si no está de acuerdo con alguno de ellos, deberá
                abstenerse de utilizar la plataforma.
              </p>

              <h4 class="mt-4 mb-1">2. Objeto del servicio</h4>
              <p>
                Super Natu ofrece una plataforma de comercio electrónico para la
                compra online de productos alimenticios, naturales, dietéticos y
                artículos relacionados, permitiendo entrega a domicilio o retiro
                en sucursal, según disponibilidad.
              </p>

              <h4 class="mt-4 mb-1">3. Registro de usuario</h4>
              <p>
                Para realizar compras podrá requerirse la creación de una cuenta
                con información veraz y actualizada. El usuario es responsable
                por la confidencialidad de su contraseña y por toda actividad
                realizada desde su cuenta.
              </p>

              <h4 class="mt-4 mb-1">4. Productos, imágenes y stock</h4>
              <p>
                Los productos exhibidos pueden incluir imágenes ilustrativas.
                Las características finales pueden variar levemente. Todos los
                pedidos están sujetos a disponibilidad de stock. En caso de
                faltantes, Super Natu podrá ofrecer reemplazos, reprogramar la
                entrega o realizar la devolución del importe correspondiente.
              </p>

              <h4 class="mt-4 mb-1">5. Precios y facturación</h4>
              <p>
                Los precios se expresan en pesos argentinos (ARS) e incluyen los
                impuestos aplicables, salvo indicación en contrario. Super Natu
                se reserva el derecho de modificar precios en cualquier momento,
                sin afectar pedidos ya confirmados. La factura será emitida
                conforme a la normativa fiscal vigente.
              </p>

              <h4 class="mt-4 mb-1">6. Medios de pago</h4>
              <p>
                Se aceptan los medios de pago habilitados en la plataforma,
                tales como tarjetas de débito/crédito, billeteras digitales,
                transferencias u otros proveedores externos. El procesamiento
                del pago puede estar sujeto a validaciones por parte del
                proveedor financiero.
              </p>

              <h4 class="mt-4 mb-1">7. Entrega y retiro</h4>
              <p>
                El usuario podrá seleccionar envío a domicilio o retiro en
                tienda. Los plazos y horarios dependen de la disponibilidad
                operativa. Es responsabilidad del usuario proporcionar datos
                correctos de entrega. En caso de ausencia o imposibilidad de
                entrega, podrá reprogramarse el envío con costo adicional,
                comunicándose con la empresa.
              </p>

              <h4 class="mt-4 mb-1">
                8. Cambios, devoluciones y cancelaciones
              </h4>
              <p>
                El usuario podrá solicitar cambios o devoluciones dentro de los
                plazos legales vigentes, siempre que el producto se encuentre en
                buen estado y sin uso. Los productos perecederos o de consumo
                inmediato pueden no admitir devolución.
                <!-- Las cancelaciones podrán realizarse antes del despacho del pedido. -->
              </p>

              <h4 class="mt-4 mb-1">9. Uso adecuado del sitio</h4>
              <p>
                El usuario se compromete a utilizar la plataforma de manera
                lícita, sin realizar acciones que puedan dañar, sobrecargar o
                afectar el funcionamiento del sistema o la experiencia de otros
                usuarios.
              </p>

              <h4 class="mt-4 mb-1">10. Limitación de responsabilidad</h4>
              <p>
                Super Natu no será responsable por interrupciones del servicio,
                errores técnicos, demoras logísticas o causas de fuerza mayor
                que escapen a su control. La responsabilidad máxima se limitará
                al valor del pedido realizado.
              </p>

              <h4 class="mt-4 mb-1">11. Protección de datos</h4>
              <p>
                Los datos personales serán tratados conforme a la legislación
                argentina vigente y utilizados únicamente para la gestión de la
                cuenta, procesamiento de pedidos y comunicaciones comerciales
                relacionadas con el servicio.
              </p>

              <h4 class="mt-4 mb-1">12. Modificaciones</h4>
              <p>
                Super Natu podrá actualizar o modificar estos Términos y
                Condiciones en cualquier momento. Las nuevas versiones serán
                publicadas en el sitio y entrarán en vigencia desde su
                publicación.
              </p>

              <h4 class="mt-4 mb-1">
                13. Legislación aplicable y jurisdicción
              </h4>
              <p>
                Estos Términos se rigen por las leyes de la República Argentina.
                Cualquier controversia será sometida a los tribunales ordinarios
                competentes del domicilio del comercio.
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
  title: "Términos y Condiciones – Super Natu",
});
</script>
