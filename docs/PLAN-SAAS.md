# CamioNex — Plan de conversión a SaaS multi-tenant

> Documento de arquitectura y ejecución. Convierte CamioNex de una instalación
> single-tenant en un SaaS multi-empresa con planes, facturación, onboarding
> autoservicio y landing pública en la raíz.
>
> Fuente comercial de verdad: [`MODELO-COMERCIAL.md`](./MODELO-COMERCIAL.md).
> Referencia de implementación: proyecto **Aturna** (`back-medicina` / `front-medicina`).
>
> Fecha: agosto 2026 · Estado: propuesta para aprobación.

---

## Índice

- [0. Resumen ejecutivo](#0-resumen-ejecutivo)
- [1. Estado de partida (relevado)](#1-estado-de-partida-relevado)
- [2. Decisiones de arquitectura](#2-decisiones-de-arquitectura)
- [3. Decisiones que requieren al dueño del producto](#3-decisiones-que-requieren-al-dueño-del-producto)
- [Fase 0 — Migraciones y red de seguridad](#fase-0--migraciones-y-red-de-seguridad)
- [Fase 1 — Modelo de datos multi-tenant](#fase-1--modelo-de-datos-multi-tenant)
- [Fase 2 — Aislamiento de tenant por defecto](#fase-2--aislamiento-de-tenant-por-defecto)
- [Fase 3 — Planes y gating cualitativo](#fase-3--planes-y-gating-cualitativo)
- [Fase 4 — Límites cuantitativos](#fase-4--límites-cuantitativos)
- [Fase 5 — Facturación: suscripciones y add-ons](#fase-5--facturación-suscripciones-y-add-ons)
- [Fase 6 — Onboarding, trial e invitaciones](#fase-6--onboarding-trial-e-invitaciones)
- [Fase 7 — Landing pública en la raíz](#fase-7--landing-pública-en-la-raíz)
- [Fase 8 — Superadmin](#fase-8--superadmin)
- [Fase 9 — MercadoPago y crons de cobranza](#fase-9--mercadopago-y-crons-de-cobranza)
- [Fase 10 — Corporate: multi-empresa, API y SSO](#fase-10--corporate-multi-empresa-api-y-sso)
- [11. Orden de ejecución, dependencias y esfuerzo](#11-orden-de-ejecución-dependencias-y-esfuerzo)
- [Anexo A — Las 13 constraints `unique` globales](#anexo-a--las-13-constraints-unique-globales)
- [Anexo B — Mapa de features por plan](#anexo-b--mapa-de-features-por-plan)

---

## Estado de ejecución

> **Deuda de verificación saldada (10/8/2026).** Todos los pendientes que las
> fases 2 a 5 habían ido dejando están cerrados. Las secciones «Pendiente de
> Fase N» que siguen más abajo quedan como registro histórico de qué se debía;
> el detalle de cómo se resolvió cada uno está en [§ Cierre de deuda](#cierre-de-deuda-10082026).
>
> **Segundo cierre (14/8/2026).** Se saldó lo que habían dejado las fases 6 a 9,
> salvo lo que depende de Mercado Pago real y del dominio definitivo. Detalle en
> [§ Cierre de deuda de las fases 6 a 9](#cierre-de-deuda-de-las-fases-6-a-9-14082026).
>
> **Las fases 0 a 9 están completas.** La **fase 10 queda postergada a
> propósito** hasta que haya demanda real: el porqué y las tres señales que
> indican cuándo arrancarla están en
> [§ Por qué la fase 10 espera](#por-qué-la-fase-10-espera). Al evaluarla apareció
> un bug que **no dependía de ella** —el rate limit no corría en ningún
> endpoint— y se corrigió por separado:
> [§ El rate limit no corría](#el-rate-limit-no-corría--corregido-el-14082026).

### Verificación actual — todo en verde

| Comprobación | Resultado |
|---|---|
| `tsc --noEmit` backend | ✅ **limpio, sin excepciones** |
| `npm run build` backend | ✅ |
| Tests unitarios backend | ✅ **87/87** en 9 suites |
| Tests de integración (e2e) | ✅ **109/109** en 6 suites |
| `nuxt typecheck` frontend | ✅ **limpio** |
| Tests unitarios frontend | ✅ **25/25** |
| `nuxt build` frontend | ✅ |

### Cierre de deuda de las fases 6 a 9 (14/08/2026)

| Deuda | Fase | Cómo se cerró |
|---|---|---|
| **Sin verificación de email en el alta** (R6.1) | 6 | Columna `user.emailVerifiedAt` + `POST /auth/verify-email` y `/auth/resend-verification`. El login rechaza la casilla sin confirmar y el front ofrece el reenvío. **7 tests e2e**, incluido el que fija que un token de sesión no sirve como token de confirmación. |
| **No se envía el mail de invitación** | 6 | `EmailService.sendInvitacion` desde `InvitesService`. El envío **no propaga errores** y el token se sigue devolviendo: si el SMTP falla, la invitación ya es válida y el link se puede compartir a mano. |
| **Las invitaciones no tenían pantalla** | 6 | `/admin/equipo`: usuarios con acceso, invitaciones pendientes con link copiable y alta con el rol recortado por el plan. Encuadrada como el camino de **quien no lleva legajo** (contador, despachante tercerizado, auditor); el personal propio sigue entrando por RRHH, que además arma el legajo. |
| Correo en los tests de integración | — | `EMAIL_ENABLED=false` corta el envío en un solo punto (`EmailService.despachar`). Cada alta de empresa y cada invitación abrían una conexión SMTP real, con el riesgo de escribirle a una dirección de verdad usada como dato de prueba. |
| Onboarding sin carga de logo | 6 | `PATCH /companies/me/logo` (multipart, la key de S3 la resuelve el backend) y una tarjeta opcional en `/initial`. La importación por Excel **ya está**: cada listado de datos propios tiene plantilla, validación previa y carga (ver "Excel en todas las tablas"). |
| **El superadmin no puede reprocesar un aviso de MP fallido** | 9 | `GET /superadmin/mp-events` y `POST /superadmin/mp-events/:id/retry`, con pantalla en `/superadmin/pagos`. El reproceso pasa por el mismo camino que el reenvío de MP: la doble acreditación la sigue impidiendo el índice único de `payments.mpPaymentId`. |
| Sin panel de pagos | 9 | `GET /superadmin/payments`: cobros de MP y conciliados a mano en un solo listado, con filtro por empresa, estado, medio y referencia. |
| **Sin paginación** en empresas y cobranzas | 8 | Servidor: `{ items, meta }` con la misma forma que el resto de la API (`metaDePaginacion`). En cobranzas los totales se calculan sobre toda la deuda, no sobre la página. |
| **La auditoría no tenía pantalla** | 8 | `/superadmin/auditoria`, con filtros por acción, actor, entidad y rango de fechas, y el `metadata` de cada acción en un detalle. `GET /audit-log` quedó paginado y se sumó `GET /audit-log/actions`. |
| `SEED_SUPERADMIN_*` sin definir | 8 | Definidas en dev y prod, más `SuperadminSeeder`: idempotente y en cada arranque, así que ya no hace falta revertir la migración para crear el superadmin. |

**Bugs que aparecieron al hacerlo:**

- `findOneByEmailWithPassword` usa una **lista `select` explícita**. Al agregar
  `emailVerifiedAt` sin sumarla a esa lista, la columna llegaba `undefined` y el
  login rechazaba a **todos los usuarios**, no sólo a los sin confirmar. Lo
  atajaron los e2e de las cuatro suites a la vez.
- `CreateUserDto` tenía `isEmailVerified: boolean`, un campo del template **sin
  columna detrás**: se pasaba en `true` desde tres lugares y no se guardaba en
  ninguno. Reemplazado por `emailVerifiedAt`.
- `.env.production` declaraba `BACK_URL` **dos veces**, y la segunda estaba
  vacía. Como `dotenv` deja la última, el `notification_url` de Mercado Pago
  habría salido vacío en producción. Eliminada la duplicada.
- `UsersSeeder` contaba **todos** los usuarios para decidir si sembrar el admin
  inicial. Con el superadmin ya creado, una base nueva se quedaba sin ningún
  administrador de empresa según qué seeder arrancara primero. Ahora cuenta sólo
  los de la empresa cliente.
- El alta pública redirigía a `/initial/empresa`, que **no existe**. Con la
  verificación de por medio ese salto ya no ocurre.
- `/auth/verify-email` tenía pantalla en el front pero **no estaba declarada como
  ruta pública** ni existía el endpoint: el middleware la habría sacado al login.

### Cierre de deuda (10/08/2026)

| Deuda | Fase | Cómo se cerró |
|---|---|---|
| Barrido automático de endpoints cruzando tokens | 2 | `test/tenant-isolation.e2e-spec.ts`: **introspecciona el router de Express** y recorre todo lo registrado. Un endpoint nuevo queda cubierto sin tocar el test. |
| Alerta de producción del tripwire | 2 | Log `TENANT_LEAK` con prefijo estable y buscable + contadores estáticos (`TenantSubscriber.contadores()`) para el endpoint de salud. |
| Medición del costo del `afterLoad` | 2 | Contador `filasVerificadas` incorporado; permite medirlo con datos reales en vez de suponerlo. |
| Tests automatizados del gating | 3 | `test/plan-gating.e2e-spec.ts`, **24 casos**. |
| Exportaciones Excel sin `EXPORT_EXCEL` | 3 | Gateadas en todos los endpoints `*/export`. |
| **R4.1** — reportes agregados sin declarar el recorte | 4 | `summary()` devuelve `coverage` con `from` efectivo, `retentionCutoff` y `truncatedByPlan`. La pantalla de indicadores muestra un aviso cuando el plan recortó los números. |
| **R4.3** — excedente tras un downgrade | 4 | `ajustarExcedentePorDowngrade()`: apaga por antigüedad las reglas y pausa los planes que exceden el tope, **sin borrar nada**, y deja constancia en el histórico comercial. |
| Tests automatizados de los límites | 4 | Incluidos en `plan-gating.e2e-spec.ts`. |
| Endpoints de alta/baja de add-ons | 5 | `GET/POST /billing/addons` y `DELETE /billing/addons/:code`, con prorrateo al alta y baja diferida a la renovación. |
| Front sin typecheck | — | `vue-tsc` + `typescript@5` instalados y script `typecheck` agregado. |

**Hallazgos al habilitar el typecheck del front** (que nunca se había podido correr):

- `Main.vue` **ocultaba** los ítems de menú con el campo `plan`. Con el diseño
  nuevo esos ítems se muestran con candado, así que el filtro sobraba y quedaba
  como código muerto engañoso. Eliminado.
- Faltaban los tipos `UserAddress` y `ResponseConfirm`, usados por componentes
  que sí están en producción. Agregados.
- Las props de gráfico estaban tipadas como `string`: se aceptaban valores que
  ApexCharts rechaza recién en tiempo de ejecución. Ahora usan `ApexChartType`.

**Archivos muertos eliminados** (todos versionados, recuperables con `git checkout`):

- `components/modal/Date.vue` y `components/modal/User.vue`: restos del template,
  sin uso en ninguna parte, referenciaban conceptos de otro producto
  (`NonWorkingDay`, `UserOperator`).
- `test/app.e2e-spec.ts`: scaffold de NestJS que esperaba `Hello World!` en `/`.
  Nunca pudo pasar en este proyecto.
- `test/auth-users.e2e-spec.example.ts`: ejemplo con roles (`Role.OPERATOR`,
  `Role.USER`) que no existen en CamioNex. Era la causa de que el typecheck del
  backend tuviera que correrse siempre filtrando errores.

**Bug preexistente corregido**: `employment-movements.service.spec.ts` fallaba
desde antes de esta migración por un `StorageService` no provisto. Sus 21 tests
volvieron a correr.



| Fase | Estado | Verificación |
|---|---|---|
| **Fase 0 — Migraciones** | ✅ **Completa** | `migration:run` + `migration:revert` + `migration:run` sobre base limpia; `npm run build` OK |
| **Fase 1 — Multi-tenant** | ✅ **Completa** | 31 tablas, 28 con `companyId NOT NULL`; app arranca sin errores; dos empresas pueden repetir patente |
| **Fase 2 — Aislamiento** | ✅ **Completa** | Verificado contra la API con dos empresas y datos espejados (misma patente): cada una ve sólo lo suyo, lectura y escritura cruzadas dan 404, y el `companyId` se estampa solo al crear |
| **Fase 3 — Gating por plan** | ✅ **Completa** | Verificado contra la API: una empresa en Control recibe 403 en rendiciones, indicadores, combustible, mantenimiento, OEA y RRHH, y 200 en los módulos base. El cambio de plan en la base se refleja a los 60s sin re-login |
| **Fase 4 — Límites cuantitativos** | ✅ **Completa** | Los cuatro límites verificados contra la API: reglas de alerta, roles, almacenamiento y retención de histórico |
| **Fase 5 — Facturación** | ✅ **Completa** | Los cuatro criterios de aceptación verificados contra la API: cliente B = $ 283.800, cliente D = $ 2.449.000, upgrade prorrateado y downgrade diferido |
| **Fase 6 — Onboarding y trial** | ✅ **Completa** | 15 tests de integración: alta pública, invitaciones y estados de cuenta |
| **Fase 7 — Landing pública** | ✅ **Completa** | Landing en `/`, panel en `/admin`, 24 tests protegiendo R7.1, meta OG verificadas en el HTML servido |
| **Fase 8 — Superadmin** | ✅ **Completa** | 17 tests e2e cubriendo R8.1 y R8.2. Encontró y corrigió un **bug de seguridad real** |
| **Fase 9 — MercadoPago y cobranza** | ✅ **Completa** | 22 tests e2e con los cuatro criterios de aceptación. La unicidad de período y la de pago están **en la base**, no sólo en el código |
| Fase 10 | ⏸️ **Postergada a propósito** | Ver [§ Por qué la fase 10 espera](#por-qué-la-fase-10-espera) |

### Fase 9 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Cobro | `mp-payments/` | Link de pago (`Preference`) y débito automático (`PreApproval`). **Una sola cuenta de MP**. |
| Avisos de MP | `webhooks/` | Público, idempotente por `(type, resourceId)`. |
| Mora | `billing/dunning.service.ts` | `ACTIVE → DEFAULTER → BLOCKED → ACTIVE`, con 10 días de gracia. |
| Avisos al cliente | `billing/billing-notifications.service.ts` + `email.service.ts` | Los cinco mails del ciclo, con destinatario resuelto y errores aislados. |
| Crons | `billing.cron.ts` (5 AM) y `mp-payments.cron.ts` (4:30 AM) | Cobranza diaria y sincronización de importes. |
| Front | `pages/estado-plan/index.vue` | Botón de pago por período y alta/baja del débito automático. |

**Horarios reales de los crons** (el orden importa más que la hora exacta del
plan; se respetó el orden y se acomodaron a los que ya existían de fases
anteriores):

| Hora | Qué corre | Dónde |
|---|---|---|
| 1:00 | Snapshot de unidades | `billing.cron.ts` (fase 5) |
| 3:00 | Reconciliación de almacenamiento | `storage-reconciliation.service.ts` (fase 4) |
| 4:00 | Cambios diferidos → emisión → marcado de vencidos | `billing.cron.ts` |
| 4:30 | Sincronización de importes con MP | `mp-payments.cron.ts` |
| 5:00 | Avisos, mora y bloqueo | `billing.cron.ts` |
| 5:00 | Vencimiento de trials | `company-status.cron.ts` (fase 6) |

#### La mitad más difícil de Aturna acá no existe

Aturna usa **MP Marketplace**: cada institución cobra a sus pacientes con su
propia cuenta, y eso obliga a OAuth (`mp-auth/`), a guardar un token por
institución, a refrescarlo cada 180 días y a resolver con qué credencial se
consulta cada pago. CamioNex es lo contrario —**CamioNex le cobra a la
empresa**, siempre con la misma cuenta—, así que **no hay `mp-auth/`, ni tokens
por empresa, ni cifrado de credenciales**. Lo que quedó es la mitad que sí
aplica: preferencias, suscripciones y confirmación de avisos.

#### La unicidad está en la base, que es donde sirve

Los dos riesgos caros de esta fase son "cobrar dos veces" (R9.1) y "acreditar
dos veces" (R9.2). Los dos se resuelven igual: un chequeo previo en el código
evita el caso normal, y **un índice único evita el simultáneo**, que es el que
de verdad ocurre —MP reenvía sus avisos en paralelo—.

- `payments.mpPaymentId` es único. Los pagos manuales van en NULL, y MySQL
  admite repetir NULL.
- `subscriptions` tiene una columna calculada, `periodKey`, que vale
  `periodStart` sólo si la fila es un período normal, vigente y no anulado, y
  NULL en cualquier otro caso. Sobre ella hay un único `(companyId, periodKey)`.
  Así **no se puede facturar dos veces el mismo mes**, pero **sí se pueden
  emitir varios prorrateos el mismo día** (un upgrade y un add-on son dos cargos
  legítimos con la misma fecha) y un período mal emitido se puede anular y
  volver a emitir. Hay tests de los tres casos.

#### D9 asumida, no resuelta

**Falta que el dueño del producto confirme los días de gracia.** Se implementó
el valor sugerido en el plan —10 días de vencimiento + **10 días** en
`DEFAULTER`— en una única constante, `DIAS_DE_GRACIA` en `dunning.service.ts`.
Cambiarlo es cambiar ese número.

#### Ningún bloqueo es silencioso (R9.3)

El cron de las 5 hace cinco cosas **en este orden**: avisa a quien se le termina
la prueba (7, 3 y 1 día antes), avisa a quien vence en tres días, marca la mora,
**avisa al superadmin de las cuentas que se bloquean mañana** y recién entonces
bloquea. El aviso interno es la mitigación de R9.3: un bloqueo sobre alguien que
sí pagó —una transferencia sin conciliar, un webhook que no llegó— se arregla en
un minuto si se ve venir, y cuesta un cliente si se entera el cliente primero.

Los cinco pasos son idempotentes. En particular, el reloj de la gracia arranca
en `Company.defaultedAt` y no se reescribe: si se reiniciara en cada corrida,
nadie llegaría nunca al bloqueo.

#### Lo que el webhook NO hace

El endpoint es público —MP no manda credenciales—, así que **no se cree nada de
lo que llega en el cuerpo**: el aviso sólo dice qué recurso mirar, y el estado y
el importe se leen contra la API de MP con nuestro token. Un tercero que mandara
avisos falsos sólo lograría que consultemos pagos que no existen. Hay un test
que lo fija.

Tampoco acredita de más: un pago que no cubre el período **queda registrado pero
no levanta el bloqueo**, para poder explicarle al cliente qué pasó con su intento
en lugar de decirle que no pagó.

#### El precio no es fijo, así que el débito tampoco

Una suscripción de MP creada en marzo debitaría el importe de marzo para
siempre, y como el precio de CamioNex depende de la flota del mes, la diferencia
quedaría impaga sin que nadie se entere. Por eso hay un cron a las 4:30 que le
informa a MP el importe vigente de cada empresa, después de la emisión de las 4.

#### El test de la fase 1 volvió a atrapar algo

`tenant-entities.spec.ts` —la red de seguridad del modelo multi-empresa— falló
al agregar `MpWebhookEvent` y el único de `payments.mpPaymentId`. Hizo
exactamente lo que tenía que hacer: **exigir una justificación escrita** para
cada excepción al aislamiento, en vez de dejarlas pasar. Las dos quedaron
declaradas con su motivo en ese archivo.

#### Pendiente de Fase 9

> Cerrados el 14/8/2026: el panel de pagos, el listado de avisos y el reproceso
> manual. Lo que sigue depende de credenciales reales de MP.

- **Nunca se probó contra Mercado Pago de verdad**: los tests usan un doble del
  SDK. Falta una corrida en sandbox con credenciales reales.
  > El `notification_url` de las suscripciones **ya no es una incógnita**:
  > Aturna lo manda igual, con el mismo SDK y en producción, así que la falta
  > en el tipo de TypeScript es un hueco del tipado y no del comportamiento.
- **`MP_ACCESS_TOKEN` no está definida**: sin ella el sistema funciona igual y
  el cobro es manual. El front oculta los botones de pago.
- **`BACK_URL` tiene que ser una URL pública**: en desarrollo, MP no puede
  alcanzar `localhost` y hace falta un túnel. Se acepta con el prefijo
  `/api/v1/` incluido (formato de Aturna) o sin él, con tests que lo fijan: si
  esa URL apunta a un 404, el cobro sale bien y **el pago no se acredita nunca,
  sin ningún error visible**.
- **Sin emisión fiscal automática**: se registra el pago y **se guarda el
  comprobante que sube la administración** (§ Comprobante del abono), pero la
  factura la emite una persona en AFIP. No hay integración con el web service de
  facturación electrónica, y mientras el volumen sea de decenas de clientes
  tampoco la necesita.
- ~~**El superadmin no puede reprocesar un aviso fallido desde el panel**~~
  → cerrado el 14/8/2026: `/superadmin/pagos`, solapa «Avisos de Mercado Pago».
- **Sin reintento propio**: si MP agota sus reenvíos con todos fallando, el pago
  queda sin acreditar hasta que alguien lo concilie.

### Fase 8 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Rol | `Role.SUPERADMIN` | Único rol de plataforma. |
| Escape hatch | `setSystemContext()` en `AuthGuard` | **Explícito**: el privilegio se pide por su nombre, no se hereda de "sin empresa". |
| Auditoría | `audit-log/` | Registro inmutable. Sólo inserta: un log editable no audita nada. |
| Panel | `superadmin/` | Tablero con MRR, empresas, cobranzas, ABM de planes. |
| Impersonación | `impersonation.service.ts` + `ImpersonationReadOnlyGuard` | Solo lectura, 30 min, auditada, con banner permanente. |

#### Dos bugs que encontraron los tests

**1. Bug de seguridad: cualquier admin de empresa entraba al panel de plataforma.**
`RolesGuard` tenía `if (user.role === Role.ADMIN) return true` como atajo — correcto
cuando ADMIN era el rol máximo, peligroso al aparecer SUPERADMIN por encima. Ese atajo
convertía a **todo administrador de cliente en operador de la plataforma**: podía ver y
modificar las demás empresas. Ahora el atajo no aplica cuando la ruta exige SUPERADMIN.

**2. La auditoría se perdía en silencio, justo en las acciones más sensibles.**
`TenantSubscriber` decidía si una entidad era "de empresa" mirando si tenía columna
`companyId`. `AuditLog` la tiene —para decir a qué empresa afectó una acción— pero debe
poder registrar acciones globales del superadmin, sin empresa. El subscriber las
rechazaba y `AuditLogService` se traga los errores a propósito, así que no fallaba
nada: simplemente no quedaba registro. Ahora el criterio es **la herencia de
`TenantEntity`**, que es el contrato que esa clase ya declaraba.

#### La empresa "plataforma", en vez de debilitar la invariante

El superadmin no pertenece a ninguna empresa, pero `user.companyId` es NOT NULL.
Hacerlo nullable habría abierto un agujero: una fila sin empresa no la filtra nadie.
En su lugar hay una empresa `isPlatform: true` que representa a CamioNex, **excluida de
los listados, del MRR, de la facturación y del cron de trials**. La invariante queda
intacta.

#### El MRR sale de la misma fórmula que factura

`tablero()` usa `calcularPrecioMensual`, no una consulta agregada aparte: dos fórmulas
para el mismo número terminan siempre en dos números distintos, y entonces ninguno sirve
para tomar decisiones.

#### Pendiente de Fase 8

> Cerrados el 14/8/2026: la paginación de empresas y cobranzas, la pantalla de
> auditoría y el seeder del superadmin.

- ~~**El front no fue probado contra el backend**~~ → cerrado: el panel se probó
  en un navegador contra la API.
- **El token de impersonación se copia a mano** desde la ficha: falta el botón que abra
  la sesión de soporte directamente.
- ~~**Sin paginación** en el listado de empresas ni en cobranzas~~
  → cerrado el 14/8/2026, contra el servidor y con los totales de cobranza
  calculados sobre toda la deuda, no sobre la página visible.
- ~~**`SEED_SUPERADMIN_EMAIL` y `SEED_SUPERADMIN_PASSWORD` no están definidas**~~
  → cerrado el 14/8/2026. Además de definirlas, ahora hay un `SuperadminSeeder`
  idempotente: definirlas después de haber migrado ya no obliga a revertir nada.
- ~~La auditoría **no tiene pantalla**~~ → cerrado el 14/8/2026:
  `/superadmin/auditoria`.

### Fase 7 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Rutas públicas | `composables/useRutasPublicas.ts` + `.spec.ts` | Extraído del middleware **para poder testearlo**: es la pieza donde un error deja todo el sistema abierto. |
| Landing | `pages/index.vue` | Textos del modelo comercial: los tres dolores (§4.3), el diferencial (§8.3) y los precios (§3.2). Con calculadora en vivo. |
| Layout público | `layouts/public.vue` | Sin sidebar, sin sockets, sin stores del backoffice (R7.4). |
| Precios | `GET /plans/public` | Público, sólo `isPublic`. Cambiar un precio en la base actualiza la landing sin deploy (D8). |
| Panel | `pages/admin/index.vue` | Movido desde `pages/index.vue`; el sidebar y el `home` del middleware apuntan a `/admin`. |

#### R7.1 resuelto y blindado

La raíz `/` se compara **por igualdad exacta**; el resto de las rutas públicas, por
prefijo con separador (`/invite/` y no `/invite`), para que `/invitados` no se cuele.
Hay **24 tests** que lo verifican, incluido un barrido de rutas privadas y los casos de
prefijo parecido. Si alguien vuelve a poner `/` en la lista de prefijos, caen.

#### R7.2: se corrigió el manifest, y hacía falta algo más

`site.webmanifest` no tenía `start_url`, así que la PWA instalada arrancaba en `/` —que
ahora es la landing—. Se corrigió (`start_url: "/chofer"`), y además se agregaron el
`name`, el `short_name` y el `theme_color`, que estaban vacíos o no coincidían con el
tema.

Pero **el manifest queda cacheado en los dispositivos que ya instalaron la app**, así
que ese arreglo no llega solo a quien ya la tiene. Por eso hay también un plugin de
cliente (`plugins/app-arranque.client.ts`) que detecta modo standalone o Capacitor y
desvía `/` a `/chofer`. Es lo único que funciona para un manifest ya cacheado.

> **Verificado antes de tocar el arranque**, como pedía el plan: **no hay proyecto
> nativo en el repositorio** (ni `capacitor.config.*`, ni `android/`, ni `ios/`). El uso
> es PWA y `@capacitor/preferences` como almacenamiento. El plugin cubre igual el caso
> nativo para cuando se compile.

#### Hallazgo: el prerender NO resuelve el SEO con `ssr: false`

El plan proponía `nitro.prerender.routes` para tener HTML estático de la landing. Se
configuró y **pre-renderiza las 3 rutas**, pero al inspeccionar el resultado el
`index.html` pesa 2,6 KB y **no contiene ni el contenido ni las meta tags de la
página**: con `ssr: false` el pre-renderizado produce el shell de la SPA sin ejecutar el
`<script setup>`, así que `useSeoMeta` nunca corre.

Como WhatsApp y LinkedIn no ejecutan JS, las previsualizaciones habrían seguido rotas
—que es justamente el criterio de aceptación—. **La solución fue poner las meta OG y
Twitter en `app.head` de `nuxt.config.ts`**, que sí llegan al HTML servido. Verificado
sobre el build:

```
<meta property="og:title" content="CamioNex — Gestión de flotas para transporte de carga">
<meta property="og:description" content="Rendiciones que se arman solas, …">
<meta property="og:image" content="/og-camionex.png">
<meta name="twitter:card" content="summary_large_image">
```

La contra es que **todas las rutas comparten la misma tarjeta**. Es aceptable —nadie
comparte `/admin/viajes`— pero tener tarjetas por página exigiría renderizado híbrido
(`ssr: true` global + `routeRules` con `ssr: false` para las rutas de la app), que es un
cambio de arquitectura con riesgo real sobre la autenticación en localStorage.

#### El barrido de aislamiento volvió a atrapar algo

Al publicar `GET /plans/public`, el test «sin token, ninguna ruta privada devuelve
datos» falló. Era **correcto**: la ruta es pública a propósito. Se agregó una lista
`PUBLICAS_DECLARADAS` con el motivo escrito, más un test nuevo que verifica que esas
rutas públicas **no filtren identificadores de ninguna empresa**. Ahora cada endpoint
abierto a internet es una decisión declarada, no un descuido.

#### Pendiente de Fase 7

- ~~**Falta la imagen `public/og-camionex.png`**~~ → cerrada: el archivo existe
  (1730 × 909). Queda un detalle menor: pesa **1,2 MB** y la relación no es 1200 × 630,
  así que conviene recomprimirla para que WhatsApp no descarte la previsualización.
- **Sin Lighthouse**: no se midió el SEO ≥ 90 del criterio de aceptación.
- **Sin prueba en un dispositivo real** con la PWA ya instalada, que es el caso difícil
  de R7.2 (manifest cacheado).
- **No hay landings por segmento** (`/para-transportistas`) ni página `/planes`
  independiente: los planes viven como sección de la landing.
- ~~El dominio de `robots.txt` y `sitemap.xml` hay que confirmarlo~~ → confirmado:
  `www.camionex.com.ar` es el definitivo.

### Fase 6 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Alta pública | `companies/companies.service.ts` | Transaccional, en contexto de sistema (todavía no hay empresa). Throttle de 5 intentos cada 10 min por IP (R6.1). |
| Invitaciones | `invites/` | Token de un solo uso, 7 días de validez. El rol se valida contra el plan al invitar **y** al aceptar. |
| Estado de cuenta | `auth/guard/account-status.guard.ts` | Dentro de `Auth()`, se lee de la base y no del token. |
| Vencimiento de trial | `companies/company-status.cron.ts` | 3 días de gracia antes de suspender. |
| Front | `pages/auth/registro-empresa.vue`, `pages/invite/[token].vue`, `pages/initial/`, `pages/estado-plan/` | — |

#### Decisiones de implementación

**El trial es del plan Operación, no de Control** (§6.1). Quien probó rendiciones y el
tablero de combustible durante tres semanas no compara Control contra nada: lo compara
contra lo que ya tenía.

**Después del alta se entra directo**, sin volver a pedir la contraseña recién creada.
Lo mismo al aceptar una invitación.

**`BLOCKED` es sólo lectura, no un corte total** (D6), y la facturación queda en lista
blanca: dejar a alguien bloqueado sin manera de ver qué debe ni cómo pagar es la forma
más segura de perderlo en vez de cobrarle.

**El seed por empresa resultó innecesario.** El plan preveía sembrar reglas de alerta,
ítems de checklist y la plantilla OEA. Al revisarlo, los tres ya son constantes del
código con valor por defecto (`DEFAULT_THRESHOLDS`, `DEFAULT_CHECKLIST_ITEMS`,
`DEFAULT_OEA_ITEMS`): una empresa nueva opera sin ninguna fila de configuración propia.
No se construyó el `CompanySeedService` porque no habría hecho nada.

**Los mensajes de rechazo de una invitación distinguen el motivo** —inexistente,
vencida, ya usada—. Un invitado que ve «token inválido» no sabe si se equivocó de link
o si tiene que pedir otro.

#### Dos módulos más pasaron a `@Global()`

`CompaniesModule`, por la misma razón que `PlansModule` en la fase 3: `AccountStatusGuard`
se usa desde `Auth()`, que está en los controladores de todos los dominios, y Nest lo
instancia en el contexto de cada uno. Sin eso habría que importarlo en los 20 módulos, y
olvidarse en uno solo dejaría ese controlador sin control de estado de cuenta.

#### El test de aislamiento volvió a atrapar algo

Al agregar `Invite`, `tenant-entities.spec.ts` marcó `Invite.token` como único global.
Es **correcto** —el token es la credencial y se resuelve antes de saber a qué empresa
pertenece quien lo usa— y se admitió con su motivo escrito. Es la tercera vez que ese
test paga su costo.

#### Pendiente de Fase 6

> Cerrados el 14/8/2026: el mail de invitación, la verificación de email y la
> carga de logo en el onboarding.

- ~~**No se envía el mail de invitación**~~ → cerrado el 14/8/2026, junto con la
  pantalla que faltaba: `/admin/equipo`. El token se sigue devolviendo y se
  muestra como link copiable, que es la salida cuando el correo cae en spam o la
  casilla está mal escrita.
- ~~**Sin verificación de email en el alta**~~ → cerrado el 14/8/2026. Quien no
  confirma no entra: el login lo dice y ofrece el reenvío.
- **El onboarding guiado es de tres pasos con enlaces**, no formularios embebidos.
  La carga de logo quedó embebida. La importación de flota desde Excel ya existe,
  pero **vive en cada listado**, no en el onboarding: el paso 1 lleva a Flota, y
  ahí el botón Excel ofrece la plantilla y la carga.

### Fase 5 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Fórmula de precio | `billing/pricing.util.ts` + `.spec.ts` | Pura y sin dependencias. **21 tests** cubren la ausencia de mínimos, acoplados, modo inactivo, prepago y prorrateo. |
| Período facturable | `billing/entities/subscription.entity.ts` | Importes **congelados** al emitir (R5.4) + `billedUnits` con la foto de lo facturado (R5.2). |
| Emisión y cambios | `billing/billing.service.ts` | Idempotente por período: dos corridas del cron no facturan dos veces. |
| Trabajos programados | `billing/billing.cron.ts` | Snapshot 1 AM, emisión 4 AM. |
| Catálogo | Migración `Billing` | 15 add-ons con los precios del modelo comercial. |

#### Verificación contra los criterios de aceptación

```
Cliente B (12 camiones, Operación)              → $   283.800  ✓
Cliente D (80 camiones, Gestión + 4 add-ons)    → $ 2.449.000  ✓
Upgrade a mitad de período  → 1 sola Subscription con isProrated=1, 21 días
Downgrade solicitado        → NO se aplica; queda agendado al 2026-09-01, sin factura
```

#### Decisiones de implementación

**El máximo del período, no el último día.** `VehicleBillingSnapshot` guarda una foto
diaria por empresa y la emisión toma `MAX()` sobre el período. Si se mirara el cierre,
bastaría dar de baja las unidades el día 30 para no pagarlas. Se eligió foto diaria y
no log de eventos porque es auditable de frente al cliente sin reconstruir estado.

**R5.1 resuelto por diseño.** `Subscription.isProrated` marca los cargos por cambios a
mitad de período, que comparten el `periodEnd` del período vigente. El emisor busca
`isProrated: false` antes de emitir, así que un prorrateo nunca se confunde con un
período a renovar. Es el bug más caro de este dominio y ya lo había documentado Aturna.

**El cron aplica los cambios diferidos ANTES de emitir.** Al revés, un downgrade que
entra en vigencia hoy se facturaría un mes más al precio viejo.

**La parte variable de los add-ons se cobra sobre camiones facturados, no sobre
unidades equivalentes**: un GPS se instala en un camión, no en medio acoplado.

**Las features son `plan ∪ add-ons`.** `PlanContextService` une ambos, lo que permite
que API + Webhooks sea add-on en Gestión e incluido en Corporate sin que el gating
sepa de esa distinción. Verificado: una empresa en Gestión con el add-on `api`
contratado obtiene la feature, que el plan no trae de fábrica.

**El modo inactivo bloquea la asignación de viajes.** Si una unidad al 30 % pudiera
operar, el modo inactivo sería un descuento encubierto.

#### El test de aislamiento volvió a hacer su trabajo

Al agregar las entidades de facturación, `tenant-entities.spec.ts` falló señalando
`Addon` como entidad de negocio sin `companyId`. Es correcto —es catálogo global, como
`Plan`— y se declaró como tal con su motivo escrito. Sin ese test, una entidad nueva
podría haber quedado fuera del aislamiento sin que nadie lo notara.

#### Pendiente de Fase 5

- ~~**Sin factura en PDF ni comprobantes en S3**~~ → cerrado: el comprobante se
  **sube**, no se genera (ver [§ Comprobante del abono](#comprobante-del-abono)).
  Sigue sin emitirse la factura AFIP: el sistema registra el cobro y guarda el
  PDF que emitió la administración.
- **Sin endpoints de superadmin** para marcar pagado, emitir a mano o listar la
  cobranza de todas las empresas: corresponde a la Fase 8.
- **El alta/baja de add-ons no tiene endpoint**: hoy se contrata por base de datos.
- **R4.3 sigue sin resolver**: un downgrade que deja a la empresa por encima de un
  límite (8 reglas activas en un plan de 3) no desactiva el excedente por antigüedad.
- **La emisión no verificó un ciclo real de cron**: se probó `emitirPeriodo` y los
  cambios de plan por API, pero no se dejó correr `emisionDiaria` en su horario.

### Fase 4 — cómo quedó implementada

| Límite | Dónde se aplica | Comportamiento verificado |
|---|---|---|
| Reglas de alerta | `alerts.service.setThreshold()` | La 4.ª regla **activa** en Control da 400. Editar una ya activa o crear una apagada **no** consume cupo. |
| Roles habilitados | `auth.service.createUser()` | Crear un `auditor` en Control da 400; un `driver`, 201. Los usuarios siguen siendo **ilimitados**: el plan limita *qué* rol, no *cuántos*. |
| Almacenamiento | `attachments.service.upload()` | Al tope da **413** con el mensaje del add-on. Con espacio, sube y el contador queda exacto. |
| Retención | `TenantRepository` | Control (6 meses) oculta un viaje de 8 meses; al pasar a Gestión **reaparece**. |
| Planes de mantenimiento | `maintenance.service.createPlan()` | Implementado (Control: 0, Operación: 10). |

#### Decisiones de implementación

**El corte de retención viaja en el contexto de request, no se consulta al filtrar.**
`createQueryBuilder` es sincrónico y no puede esperar una consulta del plan, así que
`AuthGuard` resuelve el corte una vez por request —desde la caché de 60 s— y lo deja en
el `AsyncLocalStorage`. El repositorio lo lee sin costo.

**La retención recorta sólo la LECTURA.** No toca `update`, `delete` ni `softDelete`: un
registro fuera de la ventana deja de verse, pero nada se rompe si algo lo referencia. El
dato **no se borra** (decisión D4), y por eso un upgrade lo devuelve al instante — que es
exactamente el argumento de venta del §10.2.

**Sólo son históricas 8 tablas** (`trips`, `trip_log_entries`, `settlements`,
`fuel_records`, `incidents`, `maintenance_orders`, `oea_inspections`, `checklists`). Los
maestros —flota, choferes, legajos, documentos— quedan afuera a propósito: recortar la
flota por antigüedad rompería el sistema, no limitaría un histórico.

**El almacenamiento se valida ANTES de subir a S3.** Si se chequeara después, el archivo
ya estaría ocupando lugar —y costando— aunque la operación terminara rechazada. El
tamaño se mide después de comprimir, que es lo que realmente se guarda.

**El contador de storage es incremental con reconciliación nocturna.** Contar todos los
adjuntos en cada subida no escala; pero todo contador incremental se desvía, así que
`StorageReconciliationService` corre a las 3 AM y lo corrige contra la suma real.
Verificado: una deriva de 999.999.999 se corrigió a 2.048.

#### Pendiente de Fase 4

- **R4.1 sin resolver**: los reportes agregados (indicadores, panel) no declaran si
  respetan la retención ni muestran el rango efectivo en el encabezado. Un cliente en
  Control puede ver un «total de gastos» que en realidad es el de los últimos 6 meses,
  sin que nada se lo aclare.
- **R4.3 sin resolver**: al bajar de plan, el excedente (por ejemplo 8 reglas activas
  en un plan de 3) no se desactiva por antigüedad. Hoy simplemente no se pueden crear
  más. Corresponde a la Fase 5, junto con el downgrade.
- El aviso de retención (`RetentionNotice.vue`) está en los cinco listados históricos,
  pero **el botón lleva a `/upgrade/indicators`**, que no es la pantalla ideal: falta
  una de «ampliar retención».
- Sin tests automatizados de los límites: verificado a mano contra la API.

### Fase 3 — cómo quedó implementada

| Pieza | Archivo | Nota |
|---|---|---|
| Vocabulario | `common/enums/feature.enum.ts` | 26 features. El código **nunca** pregunta por `plan.code`. |
| Catálogo | `database/migrations/…-SeedPlans.ts` | Los 4 planes con los precios de `MODELO-COMERCIAL.md` §3.2. Viven en la base para que el superadmin los edite sin deploy (D8). |
| Resolución | `plans/plan-context.service.ts` | Consulta a la base con caché de 60s. El plan **no** va en el JWT: el token dura un día y dejaría la situación comercial congelada. |
| Guard | `auth/guard/feature.guard.ts` | Devuelve 403 con `feature` y `currentPlan` en el cuerpo, para que el front ofrezca el upgrade correcto. |
| Sesión | `GET /auth/session` | Empresa, plan, features y límites vigentes. |

**Decisión de implementación**: en vez de anotar método por método, `FeatureGuard`
entró **dentro de `Auth()`** y la feature se declara una vez por controlador con
`@RequiresFeature()`. El motivo es el orden de guards de Nest: los de clase corren
*antes* que los de método, así que un `@UseGuards(FeatureGuard)` a nivel de
controlador se habría ejecutado antes que `AuthGuard` y no habría tenido
`request.user`. Al ir dentro de `Auth()` queda después de la autenticación, y no hay
riesgo de que un método nuevo se olvide del gating.

**En el guard de feature el ADMIN no tiene privilegio**, a diferencia del de roles: el
plan es un límite comercial de la empresa, no un permiso del usuario.

#### R3.1 confirmado y corregido

El panel filtraba datos fuera del plan: `getOverview` devolvía `todayExpenses` y
`upcomingMaintenance` —bitácora y mantenimiento, ambos de Operación— a cualquier
empresa, porque esos datos no llegan por el endpoint del módulo sino agregados. Ahora
`DashboardService` recorta según features y **ni siquiera ejecuta la consulta**;
devuelve `null` en lugar de `0`, para que el front muestre candado y no un importe en
cero, que sería engañoso.

#### Front

`useFeatures()` + `authStore.fetchSession()` con ventana de 60s alineada con la caché
del backend. El sidebar usa el campo que ya existía declarado sin uso: `plan?: string`
pasó a `feature?: Feature`. Los ítems bloqueados **no se ocultan**: se ven al 45% de
opacidad, con candado, y linkean a `/upgrade/<feature>`, que explica qué incluye y con
qué plan viene (MODELO-COMERCIAL §6.2). El texto de venta de cada módulo vive en
`types/plan.ts` (`FEATURE_INFO`).

#### Pendiente de Fase 3

- El botón «Quiero activarlo» de la pantalla de upgrade lleva a contacto: el cambio de
  plan autogestionado es de la Fase 5 (facturación).
- Todos los endpoints `*/export` exigen `EXPORT_EXCEL` con `@RequiresFeature`,
  además del gate del módulo. Los `*/import` **no** están gateados por plan: se
  limitan por rol (admin y el rol dueño del módulo), porque cargar los propios
  datos es parte del arranque y no una función premium.
- Falta un test automatizado del gating (hoy verificado a mano contra la API).

### Fase 2 — cómo quedó implementada

Las tres capas del diseño, más una cuarta que no estaba prevista:

| Capa | Archivo | Qué resuelve |
|---|---|---|
| Contexto | `common/tenant/tenant-context.ts` + `.middleware.ts` | `AsyncLocalStorage` por request. El middleware abre un store **vacío** para todas las rutas y `AuthGuard` lo completa al validar el token: en el middleware todavía no existe `request.user`. Evita tener que recurrir a `enterWith()`. |
| Repositorio | `common/tenant/tenant.repository.ts` + `tenant-typeorm.module.ts` | Filtra por empresa en `find*`, `count*`, `createQueryBuilder`, `update`, `delete`, `softDelete` y `restore`. |
| Tripwire | `common/tenant/tenant.subscriber.ts` | Estampa al insertar, impide mover una fila entre empresas y **lanza** si una lectura devolvió una fila ajena. |
| Tiempo real | `common/tenant/tenant.gateway.ts` | Riesgo R2.4, ver abajo. |

**Cero cambios en los 24 servicios de dominio.** El filtrado entró cambiando una línea
por módulo: `TypeOrmModule.forFeature` → `TenantTypeOrmModule.forFeature` en 19
módulos. Los servicios siguen escribiendo `@InjectRepository(Trip)` y reciben el
repositorio scopeado porque se provee el mismo token de Nest.

#### Hallazgos que cambiaron la implementación

1. **`.where()` de TypeORM reemplaza las condiciones previas, no las suma.** Agregar el
   filtro al construir el query builder no servía: hay **24 llamadas a `.where()`** en
   los servicios que lo habrían borrado en silencio, dejando la consulta viendo todas
   las empresas. La solución fue envolver el query builder en un `Proxy` que aplica el
   filtro **justo antes de ejecutar** (`getMany`, `getCount`, `getSql`, `clone`…), de
   modo que no se puede pisar y `.where()` sigue comportándose como siempre para quien
   lo escribe. Hay un test específico para este escenario.
2. **`TypeOrmModule.forFeature` no sólo crea el proveedor: también registra la entidad
   en el DataSource.** Reemplazarlo sin más rompió la app con
   `No metadata for "User" was found`. `TenantTypeOrmModule` ahora lo importa y encima
   sobrescribe el proveedor.
3. **R2.4 confirmado y era peor de lo previsto.** Los tres gateways hacían
   `server.emit()` global —toda empresa habría recibido en vivo las alertas, incidentes
   y mensajes de las demás— y además **la conexión de socket no pedía credenciales**:
   bastaba conocer la URL para escuchar todo, algo que ya era un agujero antes del
   multi-empresa. Ahora el handshake exige JWT, cada cliente entra a la sala
   `company:<id>` y la sala de destino **se deduce del `companyId` del payload**, no de
   un parámetro que el llamador pueda olvidar. Si el payload no trae empresa, no se
   emite. Los tres composables del front (`useAlertSocket`, `useIncidentSocket`,
   `useMessageSocket`) mandan el token en el handshake.
4. **Auditoría de consultas crudas (§2.6): limpia.** No hay `query()` crudo fuera de
   `SequencesService` (que usa `companyId` explícito) ni `EntityManager`/`transaction()`
   inyectados en servicios de dominio. Los 24 `createQueryBuilder` salen todos de
   repositorios inyectados, así que quedan cubiertos.

#### Vías de escape, siempre explícitas

`runAsCompany(id, fn)` para crons y webhooks que operan sobre una empresa;
`runAsSystem(fn)` para superadmin y reportes globales. Sin contexto no se filtra, que
es lo que permite que el login busque al usuario por email antes de saber su empresa.

#### Pendiente de Fase 2

- El **barrido automático de todos los endpoints** cruzando tokens (criterio de
  aceptación original) no está: se verificó a mano sobre `/trucks` — listado, detalle,
  modificación y alta. Conviene automatizarlo antes de la Fase 6.
- **Alerta de producción sobre el tripwire** (`FUGA ENTRE EMPRESAS` en el log de
  `TenantSubscriber`): falta configurarla.
- **Medición del costo del `afterLoad`** sobre los listados pesados (viajes, bitácora).
- El front **no se pudo typechequear**: el proyecto no tiene `vue-tsc` instalado.

**Contexto operativo**: el dueño confirmó (9/8/2026) que **todos los datos actuales de
la base son de prueba y son descartables**. Eso elimina el riesgo R1.1 (drift de la
baseline) y R1.2 (ventana de bloqueo): el camino a producción es **borrar la base y
correr las migraciones desde cero**, no migrar datos. La lógica de backfill de
`companyId` que quedó escrita en `1786240000000-MultiTenant.ts` es inofensiva y sirve
si en el futuro hay que aplicarla sobre una base con datos.

**Correcciones aplicadas durante la verificación** (bugs que el desarrollo inicial no
detectó por no haber arrancado la aplicación):

1. `Company` y `Plan` no estaban registradas en ningún módulo de Nest. Con
   `autoLoadEntities`, Nest solo carga lo que se declara con `forFeature`, así que la
   app **no arrancaba**: `Entity metadata for User#company was not found`. El CLI de
   TypeORM no lo detectaba porque resuelve por glob. Se crearon
   `src/companies/companies.module.ts` y `src/plans/plans.module.ts`.
2. `UsersSeeder` creaba el administrador inicial sin `companyId` y explotaba con
   `ER_NO_DEFAULT_FOR_FIELD`. Ahora resuelve la empresa desde la base.
3. `tenant-entities.spec.ts` tenía tres defectos que lo volvían un falso verde:
   llamaba a `buildMetadatas()` sin `await` (es asíncrono: las entidades se cargan por
   glob, así que `entityMetadatas` quedaba vacío y los cuatro tests pasaban sin
   verificar nada); usaba `ColumnMetadata.isUnique`, que **no existe** en TypeORM
   0.3.30 (los `unique` de columna se materializan en `uniques`/`indices`); y dependía
   de un `.env.test` inexistente. Corregido y con una aserción de guarda que falla si
   el glob no resuelve.
4. Al quedar el test operativo, detectó un único global no declarado:
   `Employee.userId`, implícito del `@OneToOne` con `User`. Es **correcto** por D1 y se
   admitió con su justificación escrita.
5. `trips.service.spec.ts` no proveía el nuevo `SequencesService`.

**Falla preexistente, ajena a este trabajo**: `src/hr/employment-movements.service.spec.ts`
(21 tests) falla también en `HEAD` por un `StorageService` no provisto. No se tocó.

---

## 0. Resumen ejecutivo

El trabajo se organiza en **once fases**, agrupadas en cuatro bloques:

| Bloque | Fases | Qué habilita |
|---|---|---|
| **Fundación técnica** | 0, 1, 2 | Que dos empresas puedan convivir en la misma base sin verse |
| **Producto comercial** | 3, 4, 5 | Que los planes existan de verdad y se puedan facturar |
| **Go-to-market** | 6, 7, 8 | Que un cliente pueda darse de alta solo y que se lo pueda administrar |
| **Escala** | 9, 10 | Cobro automático y el plan Corporate |

Las fases 0–2 son **bloqueantes y no negociables**: sin ellas no hay SaaS, hay un
sistema con planes pintados. La fase 7 (landing) es **independiente** y puede
ejecutarse en paralelo desde el día 0.

**El riesgo dominante del proyecto es la fuga de datos entre empresas.** Todo el
diseño de la fase 2 existe para que ese riesgo no dependa de que 24 servicios se
acuerden de filtrar por `companyId`.

---

## 1. Estado de partida (relevado)

### 1.1 Backend — `d:\Desarrollo\Archivos\Camiones\back-camion`

NestJS + TypeORM + MySQL. **No existe ninguna noción de empresa o tenant.**

| Hecho | Archivo | Implicancia |
|---|---|---|
| `synchronize: true` en producción | `src/app.module.ts` | **Bloqueante.** No hay migraciones. No se puede hacer una migración de datos multi-tenant así. |
| `ActiveUserInterface` = `{ id, role, isDemo? }` | `src/common/interfaces/active-user.interface.ts` | El JWT no transporta tenant. Hay que agregarlo. |
| 27 entidades sin `companyId` | `src/**/entities/*.entity.ts` | Todas necesitan la columna, el índice y la FK. |
| 13 columnas `unique: true` globales | ver [Anexo A](#anexo-a--las-13-constraints-unique-globales) | 7 rompen el multi-tenant de forma dura (dos empresas no podrían tener la misma patente). |
| 24 servicios inyectan repositorios directo | `@InjectRepository` en `src/**/*.service.ts` | 24 puntos donde se puede olvidar el filtro de tenant. |
| `paginateAndSearch(repository, dto)` con `baseWhere` | `src/common/utils/paginate-and-search.util.ts` | Punto de estrangulamiento útil: casi todos los listados pasan por acá. |
| Códigos generados con `count()` | `TripsService.generateCode()` (`src/trips/trips.service.ts:554`), `IncidentsService.generateCode()` (`src/incidents/incidents.service.ts:246`) | Ya es frágil hoy (los soft-deletes desalinean el contador). Con multi-tenant se rompe seguro. |
| Guards existentes: `AuthGuard`, `RolesGuard`, `DemoReadOnlyGuard` | `src/auth/guard/` | Buena base: el decorador compuesto `@Auth()` ya encadena guards en orden garantizado. |
| Ya existen `common/storage` (S3), `common/pdf`, `crypto.util.ts` | `src/common/` | Reutilizables para facturas en S3 y cifrado de tokens de MP. |

### 1.2 Frontend — `d:\Desarrollo\Archivos\Camiones\front-camion`

Nuxt 3.16 (`ssr: false`) + Vuetify 3 + Pinia + Capacitor.

| Hecho | Archivo | Implicancia |
|---|---|---|
| `pages/index.vue` es el dashboard interno | `pages/index.vue` | Hay que liberar la raíz para la landing. |
| `menu.plan?: string` declarado sin usar | `components/layout/full/vertical-sidebar/sidebarItem.ts:34` | Gancho previsto para el gating. Hoy vacío. |
| Middleware global por roles | `middleware/auth.global.ts` | Falta la capa de plan y la lista blanca de rutas públicas. |
| `site.webmanifest` sin `start_url` | `public/site.webmanifest` | La PWA arranca en `/`. Si `/` pasa a ser landing, la app del chofer abre la landing. **Riesgo concreto.** |
| Capacitor como dependencia, sin `capacitor.config.ts` en el repo | `package.json` | Verificar dónde vive el proyecto nativo antes de tocar el arranque. |
| Layouts: `admin`, `driver`, `blank` | `layouts/` | Falta un layout `public` para la landing. |

### 1.3 Aturna — qué se copia y qué no

**Se copia el patrón, no el código.**

| De Aturna | Se adopta | Ajuste para CamioNex |
|---|---|---|
| `company` (tenant id) en el JWT | Sí, es el mecanismo central | Se llama `companyId` |
| `Institution` con `scheduledPlanId` / `scheduledNumberOfProfessionals` / `scheduledEffectiveAt` | Sí, íntegro | La unidad facturable es el vehículo, no el profesional |
| `InstitutionSubscription` con `isProrated` | Sí, íntegro, incluido el comentario sobre el cron | Se agregan líneas de detalle (abono / vehículos / add-ons) |
| `Plan.features` como `simple-json` + *"no hardcodear ids de planes"* | Sí | Se agrega `limits` para los límites cuantitativos |
| `PaidPlanGuard` (consulta la base, no el token) | Sí, pero **con caché** | En Aturna se usa en rutas esporádicas; en CamioNex el guard corre en endpoints calientes |
| `AccountStatusGuard` con lista blanca de rutas para cuentas bloqueadas | Sí | Adaptar rutas |
| Filtrado manual `institutionId: user.company` en cada service | **No.** Es el punto débil del patrón | Se reemplaza por scoping por defecto + tripwire (fase 2) |
| `service-plans` / `service-extras` | No aplica | En Aturna son el catálogo médico, no add-ons de facturación. Los add-ons de CamioNex se diseñan de cero. |

---

## 2. Decisiones de arquitectura

### 2.1 Estrategia de aislamiento de tenant

Tres opciones evaluadas:

| Opción | Aislamiento | Costo de migración | Costo operativo | Veredicto |
|---|---|---|---|---|
| **A. Schema/base por tenant** | Máximo (físico) | Muy alto | 27 tablas × N empresas; cada deploy corre N veces las migraciones; los reportes cross-tenant del superadmin requieren fan-out | ❌ Descartado |
| **B. `companyId` + filtro manual en cada service** (patrón Aturna) | Depende de la disciplina del desarrollador | Bajo | Bajo | ⚠️ Insuficiente solo |
| **C. `companyId` + contexto de request + repositorio scopeado + subscriber tripwire** | Alto | Medio | Bajo | ✅ **Elegido** |

**Justificación del descarte de A**: con 300 empresas objetivo a 36 meses y
`autoLoadEntities` + migraciones por schema, cada despliegue pasa de una
operación a 300. Además el superadmin (fase 8) y los indicadores agregados
necesitan leer transversalmente. El costo no se paga con el beneficio: el
aislamiento lógico bien construido es suficiente para este perfil de riesgo
(datos operativos de flota, no datos de salud ni financieros regulados).

**Por qué B solo no alcanza**: hay 24 servicios y ~200 métodos de repositorio.
Basta un `findOne({ where: { id } })` sin `companyId` para que la empresa A lea
un viaje de la empresa B pasando el UUID. El propio código de Aturna muestra el
síntoma: `institutionId: user.company` aparece repetido decenas de veces por
archivo, y cada aparición es una que se pudo haber olvidado. **El requisito es
que el scoping sea el default y que olvidarlo falle ruidosamente.**

**La opción C, en tres capas** (detalle en la [fase 2](#fase-2--aislamiento-de-tenant-por-defecto)):

```
1. Transporte   →  companyId viaja en el JWT y se carga en el contexto de request (AsyncLocalStorage)
2. Aplicación   →  los servicios reciben un repositorio que ya filtra y ya estampa companyId
3. Red de seguridad →  un EntitySubscriber verifica en afterLoad/beforeInsert y LANZA si el
                       companyId de la fila no coincide con el del contexto
```

La capa 3 es la que convierte un olvido en un error visible en desarrollo y en
un `500` con alerta en producción, en lugar de una fuga silenciosa.

### 2.2 Nomenclatura

| Concepto | Nombre elegido | Motivo |
|---|---|---|
| Tenant | `Company` / `companyId` | "Empresa de transporte". Consistente con `user.company` de Aturna y neutro en el dominio. |
| Módulo backend | `src/companies/` | Sigue la convención de dominios existente. |
| Plan | `Plan` | Igual que Aturna. |
| Período facturable | `Subscription` (`src/billing/`) | En Aturna es `InstitutionSubscription`; acá el módulo ya da el contexto. |

### 2.3 Regla de oro

> **El gating de front es experiencia de usuario. El gating real vive en el
> backend.** Un cliente Control no debe poder consultar el endpoint de
> liquidaciones aunque manipule el store del navegador.
> (`MODELO-COMERCIAL.md` §12)

---

## 3. Decisiones que requieren al dueño del producto

Estas **no se asumen**. Cada una está marcada en la fase donde aparece.

> **Estado al 8/8/2026**: el dueño del producto resolvió **D1, D3 y D4**. El resto
> sigue pendiente.

| # | Decisión | Opciones | Resolución / Recomendación | Fase |
|---|---|---|---|---|
| **D1** ✅ | ¿`user.email` sigue siendo único global o pasa a `(companyId, email)`? | (a) Global: un email = una persona = una empresa. Login simple. (b) Compuesto: la misma persona puede tener cuenta en dos empresas con el mismo email, pero el login necesita elegir empresa. | **RESUELTA: (a) único global.** Coincide con la recomendación. Un `User` pertenece a **una** empresa por vez (`companyId`) y tiene control de estado activo/inactivo. Ver [§3.1](#31-d1-resuelta--email-único-global-y-el-caso-borde-del-cambio-de-empresa). | 1 |
| **D2** | ¿Qué plan se le asigna a la empresa #1 (la instalación actual)? | Gestión / Corporate / un plan interno `LEGACY` sin límites | **Plan interno `LEGACY`** con todas las features y límites en ilimitado, para que la migración no le quite nada a nadie. Se lo reasigna comercialmente después. | 1 |
| **D3** ✅ | ¿El mínimo de vehículos del plan se aplica sobre camiones o sobre unidades equivalentes (acoplado = 0,5)? | (a) Solo camiones (b) Unidades equivalentes | **RESUELTA: (a) el mínimo se cuenta SOLO sobre camiones.** ⚠️ Contradice la recomendación original (que era (b)). **Sin efecto: los mínimos se eliminaron (migración `DropMinVehicles`).** Ver [§3.2](#32-d3-resuelta--el-mínimo-cuenta-camiones-el-precio-cuenta-acoplados). | 5 |
| **D4** ✅ | Retención de histórico: ¿se **borra** o se **oculta** el dato viejo? | (a) Borrado físico/soft al vencer la retención (b) Se conserva y se filtra en lectura | **RESUELTA: (b) se conserva y se filtra en lectura.** Coincide con la recomendación. Borrar destruye el argumento de upgrade ("volvé a ver tu histórico") y es irreversible ante un error. | 4 |
| **D5** | ¿El trial de 21 días de plan Operación requiere tarjeta? | Sí / No | **No** (§6.1 del modelo comercial: el trial ancla arriba y debe tener fricción cero). Requiere una política de expiración clara. | 6 |
| **D6** | ¿Qué pasa cuando vence el trial y no hay pago? | (a) Bloqueo total (b) Solo lectura (c) Degradación automática a Control | **(b) Solo lectura** con lista blanca, como el `AccountStatusGuard` de Aturna. Es reversible y no destruye la relación comercial. | 6, 9 |
| **D7** | ¿La landing vive en el mismo deploy de Nuxt o en un sitio aparte? | (a) Mismo proyecto, `pages/index.vue` (b) Sitio estático separado | **(a) Mismo proyecto** (es lo que hace Aturna y evita duplicar tema, componentes y despliegue). Requiere resolver SEO con `ssr: false` — ver fase 7, riesgo R7.1. | 7 |
| **D8** | ¿Los precios de lista se publican en la landing? | Sí / No | **Sí** (§8.2 del modelo comercial: publicar precios es la mayor ventaja competitiva en un mercado donde todos cotizan "a consultar"). Implica que los precios vivan en la base y no hardcodeados en el `.vue`. | 5, 7 |
| **D9** | ¿Cuántos días de gracia hay entre el vencimiento y el bloqueo? | Aturna: 5 días para prorrateos, 10 para períodos | Definir. Sugerido: **10 días** de vencimiento + **10 días** de gracia en `DEFAULTER` antes de `BLOCKED`. | 9 |
| **D10** | ¿El superadmin es un rol del enum `Role` o un flag separado en `User`? | (a) `Role.SUPERADMIN` (b) `user.isSuperadmin` | **(a) `Role.SUPERADMIN`**, como Aturna. Se integra con el `RolesGuard` existente sin tocarlo. Requiere que el superadmin no tenga `companyId` (o tenga uno "sistema"). | 8 |

### 3.1 D1 resuelta — email único global y el caso borde del cambio de empresa

**Decisión**: `user.email` mantiene `unique: true` global. Razonamiento del dueño
del producto:

> *"Sería muy raro que una persona esté en dos empresas, pero pudo haber sido
> despedido de una y trabajar en otra. Así que global estaría bien, y que
> controle cuál está activo nomás."*

**Lo que se implementa:**

1. `User.companyId` — un usuario pertenece a **una** empresa por vez.
2. `User.isActive` (boolean, default `true`) — control de estado activo/inactivo,
   independiente de `blocked` (que es una sanción) y de `deletedAt` (que es una baja).

**Caso borde, asumido conscientemente:** con email único global + soft delete,
si Juan trabaja en la empresa A, se va, y la empresa B lo quiere dar de alta con
**el mismo email**, la empresa B **no puede crear un usuario nuevo**: el email ya
está tomado, incluso por una fila con `deletedAt` distinto de `NULL`
(el índice `UNIQUE` de MySQL no distingue filas borradas lógicamente).

La operación correcta es **reasignar el registro existente**, no dar de alta:

```
UPDATE  user  SET companyId = <empresa B>, role = ..., isActive = true,
                  deletedAt = NULL
WHERE   email = 'juan@...'
```

Consecuencias, todas deliberadas:

| Consecuencia | Valoración |
|---|---|
| El `user.id` se conserva, así que el histórico de la empresa A (`createdBy`, `updatedBy`, viajes, rendiciones) **sigue apuntando a un usuario válido** | ✅ Deseable: la auditoría de la empresa A no queda con referencias rotas |
| La empresa A pierde el usuario de su padrón en el momento de la reasignación | ⚠️ Aceptado. Su histórico se conserva; lo que se pierde es el acceso. |
| La reasignación es una operación de **superadmin**, no de un admin de empresa | ✅ Un admin de la empresa B no debe poder "reclamar" el email de otra empresa por su cuenta: sería un vector de enumeración de usuarios |
| El alta normal debe devolver un error claro, no un `500` de constraint | Al detectar email existente en otra empresa: *"Ese email ya pertenece a un usuario de otra empresa. Contactá a soporte para reasignarlo."* |

Cuando llegue **Corporate** (fase 10), la tabla pivote `user_company` reemplaza
este mecanismo sin migración destructiva: el `companyId` actual pasa a ser la
"empresa activa" del usuario.

### 3.2 D3 resuelta — el mínimo cuenta camiones, el precio cuenta acoplados

> ⚠️ **Sin efecto desde la migración `DropMinVehicles`.** Los planes ya no tienen
> mínimo de vehículos: se factura lo que hay, y `pricing.util.ts` no tiene piso.
> Lo de abajo queda como registro de por qué se decidió lo que se decidió en su
> momento; el modelo vigente está en `MODELO-COMERCIAL.md` §3.3.

**Decisión**: el mínimo de vehículos del plan (3 / 5 / 8 / 25) se aplica
**solo sobre camiones activos**. ⚠️ Contradice la recomendación original de este
documento, que proponía unidades equivalentes.

**Son dos cálculos distintos y no hay que mezclarlos:**

```
 1) MÍNIMO DEL PLAN  →  solo camiones activos
    camionesFacturables = max(maxCamionesActivosDelPeríodo, plan.minVehicles)

 2) PRECIO            →  todas las unidades, con sus factores
    importeVehículos = tarifaPorVehículo × (
          camionesFacturables                      // ya con el mínimo aplicado
        + camionesInactivos    × 0,30              // modo inactivo (§2.3)
        + acopladosActivos     × 0,50              // acoplado = 50% (§2.4)
        + acopladosInactivos   × 0,50 × 0,30       // acoplado inactivo
    )
```

Lo que **no** cambia: el acoplado sigue facturando al 50% de la tarifa por
vehículo, tal como está en `MODELO-COMERCIAL.md` §2.4. Lo único que cambia es que
un acoplado **no ayuda a alcanzar el mínimo del plan**.

**Efecto práctico**: una empresa con 3 camiones y 6 acoplados en plan Operación
(mínimo 5) factura por 5 camiones + 6 acoplados al 50%, no por "6 unidades
equivalentes". Es más caro para el cliente y más simple de explicar: *"el mínimo
es de camiones"*.

Esto simplifica la fórmula de `src/billing/pricing.util.ts` (fase 5): el mínimo
se aplica sobre un único término antes de sumar el resto.

---

## Fase 0 — Migraciones y red de seguridad

> **Bloqueante absoluto.** Nada de lo que sigue se puede hacer con `synchronize: true`.

### Objetivo

Poder modificar el esquema de forma controlada, reversible y auditable, y tener
una batería mínima de pruebas que detecte roturas antes de tocar 27 entidades.

### Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `back-camion/src/app.module.ts` | `synchronize: false`, `migrations: [...]`, `migrationsRun: true` |
| `back-camion/src/database/data-source.ts` | **Crear.** `DataSource` para el CLI de TypeORM (lee el mismo `.env.${NODE_ENV}`) |
| `back-camion/src/database/migrations/` | **Crear** el directorio |
| `back-camion/package.json` | Agregar scripts `migration:generate`, `migration:run`, `migration:revert`, `migration:show` |
| `back-camion/test/` | Setup de tests de integración contra una base efímera (Docker, ver `docker-compose.yml`) |

```ts
// src/app.module.ts — configuración de TypeORM
useFactory: (configService: ConfigService) => ({
  type: 'mysql',
  // ...
  autoLoadEntities: true,
  // El esquema se cambia SOLO por migración: es la única forma de agregar
  // companyId a 27 tablas y migrar los datos existentes sin perder nada.
  synchronize: false,
  migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
  migrationsRun: true,
}),
```

### Migración baseline

La base de producción ya tiene el esquema que `synchronize` fue construyendo. La
primera migración generada por el CLI va a intentar recrear cosas.

**Procedimiento:**

1. Generar la migración inicial contra una **base vacía**: `npm run migration:generate -- Baseline`.
2. Verificar que aplicada sobre una base vacía produce un esquema idéntico al que
   produce `synchronize: true` (comparar con `SHOW CREATE TABLE` tabla por tabla).
3. En producción: **no ejecutarla**, insertarla a mano en la tabla `migrations`
   para marcarla como ya aplicada.

### Criterio de aceptación

- `npm run migration:run` sobre una base vacía levanta el esquema completo y la app arranca.
- En producción `npm run migration:show` lista la baseline como ejecutada y no propone cambios.
- Existe un backup verificado (restaurado en una base de prueba) previo a la fase 1.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R0.1 | La migración baseline difiere del esquema real de producción (drift acumulado por `synchronize`) | Diff tabla por tabla antes de marcarla como aplicada. Si hay drift, generar una migración de corrección explícita. |
| R0.2 | `migrationsRun: true` en el arranque puede bloquear un deploy si una migración falla a mitad | Migraciones idempotentes y con `down` real. Considerar correrlas en un paso separado del pipeline. |

### Cómo se prueba

Base efímera en Docker → `migration:run` → `npm run start` → smoke test de login
y de un listado de cada módulo.

**Esfuerzo relativo: S** (1 desarrollador, ~3-4 días).

---

## Fase 1 — Modelo de datos multi-tenant

### Objetivo

Que exista la entidad `Company`, que las 27 entidades le pertenezcan a una, y
que los datos actuales queden asignados a la empresa #1 sin pérdida.

### 1.1 Entidad `Company`

`back-camion/src/companies/entities/company.entity.ts` — **crear**.

```ts
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ... auditoría estándar del proyecto (createdAt/By, updatedAt/By, deletedAt/By)

  @Column()
  name: string;                       // Razón social

  @Column({ unique: true })
  slug: string;                       // Identificador legible: usado en URLs y marca blanca

  @Column({ nullable: true })
  cuit: string;

  // --- Comercial ---
  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.TRIAL })
  status: CompanyStatus;              // TRIAL | ACTIVE | DEFAULTER | BLOCKED | CANCELLED

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column({ nullable: true })
  planId: string;

  /**
   * Cambio de plan diferido al próximo período. Las bajas y downgrades no se
   * aplican en el acto para que nadie suba y baje dentro del mismo período y
   * distorsione la recaudación (mismo criterio que Aturna).
   */
  @Column({ type: 'varchar', nullable: true, default: null })
  scheduledPlanId: string | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  scheduledEffectiveAt: Date | null;

  // --- Facturación ---
  @Column({ nullable: true }) invoiceEmail: string;
  @Column({ nullable: true }) invoiceCuit: string;
  @Column({ nullable: true }) invoiceName: string;

  @Column({ type: 'int', default: 1 })
  billingDay: number;                 // Día del mes en que se emite el período

  // --- Marca blanca (add-on) ---
  @Column({ nullable: true }) logoUrl: string;
  @Column({ nullable: true }) primaryColor: string;
}
```

> **Nota**: a diferencia de Aturna, la cantidad facturable **no** se guarda como
> un número contratado en la empresa (`numberOfProfessionals`). En CamioNex los
> vehículos activos son un hecho observable de la base — se cuentan, no se
> declaran. Ver [fase 5](#fase-5--facturación-suscripciones-y-add-ons).

### 1.2 `companyId` en las 27 entidades

Clase base abstracta en `back-camion/src/common/entities/tenant.entity.ts` — **crear**:

```ts
/**
 * Base de toda entidad que pertenece a una empresa (tenant). Hereda la
 * auditoría estándar y agrega companyId con su índice.
 *
 * IMPORTANTE: heredar de acá es lo que hace que el TenantSubscriber estampe y
 * verifique automáticamente. Una entidad de negocio que no herede queda fuera
 * del aislamiento: es el único error que puede provocar una fuga.
 */
export abstract class TenantEntity {
  @Index()
  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'companyId' })
  company: Company;
}
```

Las 27 entidades pasan a `export class Truck extends TenantEntity { ... }`.

**Excepciones a evaluar** (no toda entidad es de tenant):

| Entidad | ¿Lleva `companyId`? | Motivo |
|---|---|---|
| `user` | Sí | Ver D1 |
| `device-token` | Sí | El token FCM es del dispositivo, pero la notificación es de una empresa |
| `attachment` | Sí | Es lo que permite contabilizar el storage por empresa (fase 4) |
| `checklist-item`, `incident-event`, `oea-inspection-item` | Sí, aunque sean hijas | Redundante pero deliberado: permite que el tripwire funcione sin joins y que los borrados por empresa sean triviales |
| `Plan`, `Addon` | **No** | Son catálogo global |

### 1.3 Las 13 constraints `unique` globales

Detalle completo y veredicto por columna en el [Anexo A](#anexo-a--las-13-constraints-unique-globales).
Resumen:

- **7 rompen el multi-tenant de forma dura** y pasan a índice compuesto con `companyId`:
  `truck.plate`, `trailer.plate`, `fleet.code`, `employee.documentId`,
  `incident.code`, `trip.code`, `alert-rule-config.key`.
- **3 son `clientId` de deduplicación offline** (`fuel-record`, `oea-inspection`,
  `trip-log-entry`): son UUID generados por el cliente, así que técnicamente no
  colisionan — pero se scopean igual, porque un cliente malicioso podría enviar
  el `clientId` de otro tenant y provocar un no-op de deduplicación.
- **2 no rompen nada** (`driver.employeeId`, `device-token.token`): se revisan y
  se documenta por qué quedan como están.
- **1 es decisión de producto**: `user.email` → **D1**.

```sql
-- Ejemplo (MySQL). El nombre del índice viejo es autogenerado:
-- averiguarlo con SHOW INDEX FROM trucks antes de escribir la migración.
ALTER TABLE trucks DROP INDEX IDX_xxxxxxxx;
ALTER TABLE trucks ADD UNIQUE INDEX UQ_trucks_company_plate (companyId, plate);
```

> **Detalle importante — soft delete y unicidad.** El proyecto usa
> `@DeleteDateColumn`. Con `UNIQUE (companyId, plate)`, una patente dada de baja
> lógica sigue ocupando el lugar y no se puede volver a dar de alta.
> **Esto ya pasa hoy** con el unique global, así que la fase 1 **no cambia la
> semántica**: solo la scopea. En MySQL no hay índices parciales, así que la
> solución (si se quiere permitir el rehúso) es una columna generada
> `deletedFlag = IFNULL(deletedAt, '1970-01-01')` e indexar
> `(companyId, plate, deletedFlag)`. **Se propone tratarlo como un tema aparte,
> fuera del alcance de esta fase**, para no mezclar dos cambios de comportamiento.

### 1.4 Generación de códigos por empresa

`TripsService.generateCode()` y `IncidentsService.generateCode()` usan
`repository.count()`. Con multi-tenant devuelven el conteo global; además ya hoy
son racy y se desalinean con los soft-deletes.

**Reemplazo**: tabla de secuencias por empresa.

```ts
// src/common/entities/company-sequence.entity.ts
@Entity('company_sequences')
@Unique(['companyId', 'key'])
export class CompanySequence {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) companyId: string;
  @Column() key: string;              // 'trip' | 'incident'
  @Column({ type: 'int', default: 0 }) lastValue: number;
}
```

El incremento se hace **dentro de la transacción de creación** con
`SELECT ... FOR UPDATE`, lo que elimina la condición de carrera actual.

### 1.5 Migración de los datos existentes

El punto más delicado de todo el plan. Migración única, en un solo archivo,
con `down` funcional.

`back-camion/src/database/migrations/XXXXXXXX-MultiTenant.ts`:

```
 1. CREATE TABLE companies, plans, ...
 2. INSERT del plan interno LEGACY (D2)
 3. INSERT de la empresa #1 con los datos reales de la instalación actual
    → guardar su UUID en una variable de la migración
 4. Por cada una de las 27 tablas:
    a. ALTER TABLE ... ADD COLUMN companyId CHAR(36) NULL
    b. UPDATE ... SET companyId = '<uuid-empresa-1>'
    c. ALTER TABLE ... MODIFY companyId CHAR(36) NOT NULL
    d. ADD INDEX (companyId)
    e. ADD CONSTRAINT FK ... REFERENCES companies(id)
 5. Reemplazo de los 13 unique (drop + create compuesto)
 6. CREATE TABLE company_sequences + seed con el MAX(código) actual de trips e incidents
```

**El orden b→c es obligatorio**: agregar la columna directamente como `NOT NULL`
falla si hay filas, y ponerla `NOT NULL` antes del `UPDATE` también.

### Criterio de aceptación

- La migración corre sobre una **copia restaurada de producción** sin errores y en un tiempo aceptable.
- `SELECT COUNT(*) FROM <tabla> WHERE companyId IS NULL` = 0 para las 27 tablas.
- Los conteos por tabla antes y después de la migración son idénticos.
- La app arranca, se puede loguear y todos los listados devuelven lo mismo que antes.
- Se puede crear una segunda empresa con un camión de la misma patente que la empresa #1.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1.1 | La migración falla a mitad y deja el esquema inconsistente | Ventana de mantenimiento + backup restaurable + ensayo previo sobre copia de producción. `down` implementado y probado. |
| R1.2 | Tiempo de bloqueo de tabla en MySQL al agregar columna + FK sobre tablas grandes | Medir sobre la copia. Si excede la ventana, usar `pt-online-schema-change` o `ALGORITHM=INPLACE`. |
| R1.3 | Alguna entidad queda sin `companyId` por descuido | Test automatizado que recorre `dataSource.entityMetadatas` y falla si una entidad de negocio no tiene la columna (lista de excepciones explícita). |
| R1.4 | Códigos duplicados al sembrar `company_sequences` | Sembrar con `MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED))`, no con `COUNT(*)`. |

### Cómo se prueba

1. Restaurar producción en una base de staging.
2. Correr la migración; medir tiempo.
3. Correr el test de "toda entidad de negocio tiene companyId".
4. Crear manualmente una empresa #2 y verificar que puede repetir patentes, códigos de flota y documentos.

**Esfuerzo relativo: L** (~2 semanas).

---

## Fase 2 — Aislamiento de tenant por defecto

### Objetivo

Que un servicio que **se olvide** de filtrar por empresa produzca un error, no
una fuga. Éste es el corazón de seguridad del proyecto.

### 2.1 Transporte: `companyId` en el JWT

`back-camion/src/common/interfaces/active-user.interface.ts` — **modificar**:

```ts
export interface ActiveUserInterface {
  id: string;
  /** Empresa (tenant) a la que pertenece el usuario. Es el eje del aislamiento. */
  companyId: string;
  role: string;
  /** Estado comercial de la empresa: lo usa AccountStatusGuard. */
  status: CompanyStatus;
  isDemo?: boolean;
}
```

`back-camion/src/auth/auth.service.ts` — el payload del token pasa a incluir
`companyId` y `status`.

> **Qué NO va en el JWT**: el plan y sus features. El token dura un día y
> dejaría cacheada la situación comercial — exactamente el problema que Aturna
> documenta en `paid-plan.guard.ts`. El plan se resuelve desde la base con caché
> corta (fase 3).

### 2.2 Contexto de request

`back-camion/src/common/tenant/tenant-context.ts` — **crear**. `AsyncLocalStorage`
(o `nestjs-cls`) poblado por un middleware global desde `request.user.companyId`.

```ts
// Contexto por request. Permite que repositorios y subscribers conozcan la
// empresa sin tener que pasarla por parámetro en cada llamada.
export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export const getCurrentCompanyId = (): string | undefined =>
  tenantStorage.getStore()?.companyId;
```

### 2.3 Repositorio scopeado

`back-camion/src/common/tenant/tenant-repository.provider.ts` — **crear**.
Reemplaza a `@InjectRepository` en los servicios de dominio:

```ts
// En lugar de:  @InjectRepository(Trip) private repo: Repository<Trip>
// se inyecta:   @InjectTenantRepository(Trip) private repo: Repository<Trip>
//
// El repositorio devuelto extiende el estándar y aplica companyId por defecto
// en find/findOne/count/createQueryBuilder. Si un caso legítimo necesita saltar
// el filtro (superadmin, crons), debe pedirlo de forma explícita.
```

`paginateAndSearch` también se ajusta: si el repositorio es de tenant, inyecta
`companyId` en `baseWhere` aunque el llamador no lo haya puesto.

### 2.4 Red de seguridad: `TenantSubscriber`

`back-camion/src/common/tenant/tenant.subscriber.ts` — **crear**. Es la pieza
que hace que el aislamiento no dependa de la disciplina:

```ts
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  /** Estampa la empresa al insertar: ninguna fila puede nacer huérfana. */
  beforeInsert(event: InsertEvent<any>) {
    if (!isTenantEntity(event.metadata)) return;
    const companyId = getCurrentCompanyId();
    if (!companyId) throw new InternalServerErrorException('Sin contexto de empresa.');
    if (event.entity.companyId && event.entity.companyId !== companyId) {
      throw new ForbiddenException('Intento de escribir en otra empresa.');
    }
    event.entity.companyId = companyId;
  }

  /**
   * Tripwire: si una consulta devolvió una fila de otra empresa, alguien se
   * olvidó de filtrar. Se lanza en vez de devolver el dato — preferimos un 500
   * ruidoso a una fuga silenciosa.
   */
  afterLoad(entity: any, event?: LoadEvent<any>) {
    const companyId = getCurrentCompanyId();
    if (!companyId || !entity?.companyId) return;
    if (entity.companyId !== companyId) {
      throw new ForbiddenException('Acceso a datos de otra empresa.');
    }
  }
}
```

> El `afterLoad` tiene costo por fila. Medirlo sobre los listados más pesados
> (viajes, bitácora). Si el impacto es relevante, la alternativa es dejarlo
> activo siempre en desarrollo/staging y muestrear en producción — pero
> **la recomendación es dejarlo siempre activo**: es la única defensa que no
> depende de nadie.

### 2.5 Contextos sin request

Crons, sockets y webhooks no tienen `request.user`. Deben abrir el contexto de
forma explícita:

```ts
await tenantStorage.run({ companyId: company.id, system: true }, async () => {
  await this.alertsService.evaluarVencimientos();
});
```

Archivos afectados: `src/alerts/`, `src/notifications/`, `src/messages/`
(gateways de socket.io), y todo `@Cron` existente.

### 2.6 Auditoría de las consultas crudas

Hay que revisar uno por uno los `createQueryBuilder` y cualquier `query()` crudo,
especialmente en `src/indicators/indicators.service.ts` y
`src/dashboard/dashboard.service.ts`, que son los que más agregan.

### Criterio de aceptación

- Existe un test de integración que, con dos empresas sembradas, recorre **todos**
  los endpoints `GET` de listado y de detalle con el token de la empresa A pidiendo
  ids de la empresa B, y espera `403`/`404` en el 100% de los casos.
- Existe un test que verifica que crear cualquier recurso sin contexto de empresa falla.
- El tripwire está activo y hay una alerta configurada para su aparición en producción.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R2.1 | **Fuga entre tenants** (el riesgo #1 del proyecto) | Las tres capas + el test de barrido automático. El test se corre en CI en cada PR. |
| R2.2 | El tripwire rompe funcionalidad legítima (superadmin, joins de catálogo) | Escape hatch explícito (`runAsSystem()`), nunca implícito, y auditado. |
| R2.3 | Degradación de performance por `afterLoad` | Medir con los listados reales antes de decidir. |
| R2.4 | Sockets sin contexto emiten a la sala equivocada | Revisar el naming de las salas: pasar de `alerts` a `alerts:${companyId}`. **Punto de fuga fácil de olvidar.** |

### Cómo se prueba

Seed de dos empresas con datos espejados (misma patente, mismo código de viaje) →
barrido automático de endpoints cruzando tokens → cero filas ajenas devueltas.

**Esfuerzo relativo: L** (~2-3 semanas, incluido el barrido de los 24 servicios).

---

## Fase 3 — Planes y gating cualitativo

### Objetivo

Que los cuatro planes existan en la base, que cada módulo declare qué feature
necesita, y que el backend rechace lo que el plan no incluye.

### 3.1 Catálogo

`back-camion/src/plans/entities/plan.entity.ts` — **crear**:

```ts
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true })
  code: string;                      // 'control' | 'operacion' | 'gestion' | 'corporate' | 'legacy'

  @Column() name: string;

  // --- Precio (MODELO-COMERCIAL §3.2) ---
  @Column('decimal', { precision: 12, scale: 2 }) baseFee: number;          // Abono base mensual
  @Column('decimal', { precision: 12, scale: 2 }) pricePerVehicle: number;  // Tarifa PLANA por vehículo
  @Column('int') minVehicles: number;                                        // 3 / 5 / 8 / 25
  @Column('decimal', { precision: 12, scale: 2 }) setupFee: number;          // Implementación (pago único)

  /**
   * Features habilitadas. Única fuente de verdad: NO hardcodear códigos de plan
   * en el código de negocio; siempre preguntar por la feature.
   */
  @Column('simple-json')
  features: string[];                // ['settlements', 'fuel', 'oea', ...]

  /** Límites cuantitativos del plan (fase 4). */
  @Column('simple-json')
  limits: PlanLimits;                // { retentionMonths, storageGb, alertRules, maintenancePlans, roles }

  @Column({ default: true })  isPublic: boolean;   // Se muestra en la landing (D8)
  @Column({ default: false }) isNegotiated: boolean; // Corporate: precio a convenir
  @Column('int', { default: 0 }) sortOrder: number;
}
```

```ts
// src/common/enums/feature.enum.ts — el vocabulario del gating
export enum Feature {
  SETTLEMENTS = 'settlements',            // Rendiciones — NUNCA en Control
  TRIP_LOG = 'trip_log',                  // Bitácora y adelantos
  FUEL = 'fuel',                          // Combustible
  FUEL_RANKING = 'fuel_ranking',          // Ranking por camión/chofer (Gestión+)
  MAINTENANCE = 'maintenance',
  OEA = 'oea',
  INCIDENTS_KANBAN = 'incidents_kanban',
  INDICATORS = 'indicators',              // Costo/km — NUNCA en Operación
  HR_FULL = 'hr_full',                    // Historial laboral y estados automáticos
  EXPORT_EXCEL = 'export_excel',
  ALERT_THRESHOLDS = 'alert_thresholds',
  AUDITOR_ROLE = 'auditor_role',
  SCHEDULED_REPORTS = 'scheduled_reports',
  API = 'api',
  MULTI_COMPANY = 'multi_company',
  SSO = 'sso',
  WHITE_LABEL = 'white_label',
}
```

Mapeo completo feature → plan en el [Anexo B](#anexo-b--mapa-de-features-por-plan),
derivado de la matriz de `MODELO-COMERCIAL.md` §4.1.

### 3.2 Guard de feature

`back-camion/src/auth/decorators/requires-feature.decorator.ts` y
`back-camion/src/auth/guard/feature.guard.ts` — **crear**.

```ts
// src/auth/decorators/auth.decorator.ts — decorador compuesto, patrón Aturna
/**
 * Igual que Auth() pero además exige que el plan de la empresa incluya la
 * feature. Se declara compuesto para garantizar el orden de los guards:
 * AuthGuard corre primero y deja el usuario en el request.
 */
export function AuthFeature(feature: Feature, ...roles: Role[]) {
  return applyDecorators(RequiresFeature(feature), Auth(...roles), UseGuards(FeatureGuard));
}
```

Uso en los controladores (ejemplo real):

```ts
// src/settlements/settlements.controller.ts
@Post()
@AuthFeature(Feature.SETTLEMENTS, Role.ADMIN, Role.MANAGER)
create(@Body() dto: CreateSettlementDto, @ActiveUser() user: ActiveUserInterface) { ... }
```

Controladores a anotar: `settlements`, `trip-log`, `fuel`, `maintenance`, `oea`,
`indicators`, `hr` (parcial), y los endpoints de exportación a Excel/PDF de
`trips`, `documents` y `fuel`.

### 3.3 Resolución del plan con caché

`back-camion/src/plans/plan-context.service.ts` — **crear**.

El plan **no viaja en el JWT** (§2.1). El `FeatureGuard` lo consulta por
`companyId`, con caché en memoria de TTL corto (60 s) invalidada
explícitamente cuando cambia el plan de una empresa. Sin la caché, cada request
a un endpoint gateado suma un `SELECT` con join.

### 3.4 Reflejo en el frontend

| Archivo | Acción |
|---|---|
| `front-camion/composables/useFeatures.ts` | **Crear.** `hasFeature(code)`, `plan`, `limits`, leídos del store de auth |
| `front-camion/stores/auth.ts` | Agregar `company`, `plan` y `features` al estado; endpoint `GET /auth/session` que los refresca (patrón `refreshSessionIfStale` de Aturna) |
| `front-camion/components/layout/full/vertical-sidebar/sidebarItem.ts` | Poblar el campo `plan?: string` ya declarado en la línea 34 — pasa a ser `feature?: Feature` |
| `front-camion/components/layout/full/vertical-sidebar/NavItem/index.vue` | Renderizar en gris con candado cuando falta la feature, en lugar de ocultar (§6.2 del modelo comercial) |
| `front-camion/middleware/auth.global.ts` | Chequeo de feature por `to.meta.feature`; redirige a la pantalla de upsell, no a un 403 |
| `front-camion/pages/upgrade/[feature].vue` | **Crear.** Pantalla de upsell: qué incluye, precio, botón "Activar en mi cuenta" |

```ts
// sidebarItem.ts — el gancho que ya existía, ahora usado
{
  title: "Liquidaciones",
  icon: ReceiptIcon,
  to: "/admin/liquidaciones",
  roles: [Role.ADMIN, Role.MANAGER, Role.AUDITOR],
  feature: Feature.SETTLEMENTS,   // ← si el plan no la tiene: gris + candado
},
```

> **Paywall visible, no invisible.** El ítem no se oculta: se muestra deshabilitado
> con candado y linkea a `/upgrade/settlements`. Es una decisión comercial
> explícita del modelo (§6.2), no un descuido de UX.

### Criterio de aceptación

- Con una empresa en plan Control, `POST /settlements` devuelve `403` con un
  mensaje que nombra el plan requerido.
- El sidebar muestra Liquidaciones y OEA en gris con candado.
- Cambiar el plan de la empresa por base de datos se refleja en el front en menos
  de 60 segundos sin volver a loguearse.
- No existe ningún `if (plan === 'control')` en el código: todo pregunta por feature.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R3.1 | Se gatea el controlador pero un servicio interno sigue exponiendo el dato (ej. el dashboard muestra un KPI de rendiciones) | Auditar `dashboard.service.ts` e `indicators.service.ts`: los KPIs también se filtran por feature |
| R3.2 | Hardcodear códigos de plan | Regla de revisión de código: solo `Feature`, nunca `plan.code`. Lint rule si hace falta. |
| R3.3 | El cliente #1 (migrado) pierde acceso a algo | El plan `LEGACY` (D2) tiene todas las features |

**Esfuerzo relativo: M** (~1,5-2 semanas).

---

## Fase 4 — Límites cuantitativos

### Objetivo

Los límites de `MODELO-COMERCIAL.md` §4.1 que no son "sí/no" sino "cuántos":

| Límite | Control | Operación | Gestión | Corporate |
|---|---|---|---|---|
| Retención de histórico | 6 meses | 24 meses | 60 meses | Ilimitada |
| Almacenamiento de adjuntos | 2 GB | 50 GB | 250 GB | Ilimitado |
| Reglas de alerta activas | 3 | 10 | Ilimitadas | Ilimitadas |
| Planes de mantenimiento activos | — | 10 | Ilimitados | Ilimitados |
| Roles habilitados | 4 | 6 | 7 | A medida |

### 4.1 Servicio de límites

`back-camion/src/plans/limits.service.ts` — **crear**.

```ts
/**
 * Los límites de conteo no se validan en un guard: necesitan consultar el
 * estado actual, así que se piden desde el servicio, dentro de la transacción
 * que crea el recurso.
 */
await this.limitsService.assertCanCreate(companyId, 'alertRules');
```

Puntos de llamada:

| Límite | Archivo |
|---|---|
| Reglas de alerta | `src/alerts/alerts.service.ts` (creación/activación de `AlertRuleConfig`) |
| Planes de mantenimiento | `src/maintenance/maintenance.service.ts` |
| Roles habilitados | `src/users/users.service.ts` y `src/auth/auth.service.ts` (`createUser`) |
| Storage | `src/common/attachments/attachments.service.ts` y `src/common/storage/storage.service.ts` |

### 4.2 Storage

`attachment` ya existe (`src/common/attachments/entities/attachment.entity.ts`).
Se agrega el contador acumulado:

- Columna `Company.storageBytesUsed` (`bigint`), actualizada de forma transaccional
  al subir y al borrar adjuntos.
- Cron nocturno de reconciliación (`SUM(attachment.sizeBytes) GROUP BY companyId`)
  que corrige el desvío — el contador incremental siempre se desincroniza.
- Al superar el límite: `413` con un mensaje que ofrece el add-on de
  almacenamiento adicional ($ 19.000 por 50 GB).

> **Este es el límite que protege el margen.** `MODELO-COMERCIAL.md` §7.6 lo
> señala como el costo variable oculto: un cliente con incidentes videofilmados
> puede consumir 200 GB en un año.

### 4.3 Retención de histórico

**Decisión D4: se conserva el dato y se filtra en lectura.** No se borra.

Implementación: el `TenantRepository` (fase 2) agrega, para las entidades
marcadas como "históricas" (`trip`, `trip-log-entry`, `settlement`, `fuel-record`,
`incident`, `maintenance-order`, `oea-inspection`, `checklist`), un
`AND createdAt >= :retentionCutoff` derivado del plan.

```ts
// El corte de retención se calcula del plan, no se hardcodea.
// Un upgrade devuelve el acceso al histórico completo de inmediato: es
// exactamente el argumento de venta del §10.2 punto 6.
const cutoff = plan.limits.retentionMonths
  ? subMonths(new Date(), plan.limits.retentionMonths)
  : null;
```

En el front: una franja informativa en los listados cuando hay corte activo
("Tu plan muestra los últimos 6 meses. Ver histórico completo →").

### Criterio de aceptación

- Una empresa en Control no puede activar una cuarta regla de alerta; el mensaje nombra el límite y el plan siguiente.
- Subir un adjunto que excede el límite falla con un mensaje accionable.
- Una empresa en Control no ve viajes de hace 8 meses; al pasarla a Operación por base de datos, los ve.
- El cron de reconciliación de storage corrige un desvío introducido a mano.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R4.1 | El filtro de retención se aplica a un reporte agregado y da números incorrectos sin avisar | Los indicadores declaran explícitamente si respetan la retención; mostrar siempre el rango efectivo en el encabezado del reporte |
| R4.2 | Un cliente pierde de vista datos que cargó y lo percibe como pérdida | Comunicación clara + el dato **no se borra** (D4) |
| R4.3 | Bajar de plan deja al cliente por encima del límite (ej. 8 reglas activas en Control) | Al aplicar un downgrade (fase 5), desactivar el excedente por antigüedad y notificar. Nunca borrar. |

**Esfuerzo relativo: M** (~1,5 semanas).

---

## Fase 5 — Facturación: suscripciones y add-ons

### Objetivo

Emitir el período facturable de cada empresa con el detalle correcto, manejar
vehículos activos e inactivos, prorrateos y cambios diferidos. **Cobro manual
(transferencia) en esta fase**; MercadoPago es la fase 9.

> `MODELO-COMERCIAL.md` §10.2 punto 8: *"Requiere motor de facturación propio
> desde el día 1. Intentar sostenerlo con planillas fracasa alrededor de los 40
> clientes."*

### 5.1 Entidades

Módulo nuevo `back-camion/src/billing/`:

```
src/billing/
├── entities/
│   ├── subscription.entity.ts          # El período facturable
│   ├── subscription-item.entity.ts     # Línea de detalle de la factura
│   ├── payment.entity.ts               # Pago aplicado a un período
│   ├── addon.entity.ts                 # Catálogo de add-ons
│   ├── company-addon.entity.ts         # Add-on contratado por una empresa
│   ├── company-plan-update.entity.ts   # Histórico + cambios diferidos
│   └── vehicle-billing-snapshot.entity.ts
├── billing.service.ts                  # Emisión y cálculo
├── pricing.util.ts                     # Fórmula pura, testeable
├── billing.cron.ts                     # Renovación, vencimiento, snapshots
└── billing.controller.ts
```

**`Subscription`** — copia directa del patrón `InstitutionSubscription` de Aturna:

```ts
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) companyId: string;

  @Column({ type: 'date' }) periodStart: Date;
  @Column({ type: 'date' }) periodEnd: Date;
  @Column({ type: 'date' }) expiration: Date;

  @Column('decimal', { precision: 12, scale: 2 }) baseAmount: number;      // Abono del plan
  @Column('decimal', { precision: 12, scale: 2 }) vehiclesAmount: number;  // Vehículos
  @Column('decimal', { precision: 12, scale: 2 }) addonsAmount: number;    // Add-ons
  @Column('decimal', { precision: 12, scale: 2 }) discount: number;        // Prepago anual, bonificaciones
  @Column('decimal', { precision: 12, scale: 2 }) amount: number;          // Total

  /** Foto de lo que se facturó: sin esto una disputa es indefendible. */
  @Column('simple-json') billedUnits: BilledUnitsSnapshot;

  @Column({ default: false }) isPaid: boolean;
  @Column({ nullable: true }) invoiceUrl: string;   // S3, vía common/storage

  /**
   * Cargo prorrateado por un cambio a mitad de período (más vehículos, upgrade
   * de plan o alta de add-on). Comparte el periodEnd del período vigente, así
   * que el cron de renovación TIENE que excluirlo: si lo tomara como un período
   * a renovar, generaría una factura completa de más por cada cambio del mes.
   */
  @Column({ default: false }) isProrated: boolean;
}
```

> Ese comentario está copiado en espíritu de
> `back-medicina/src/institution-subscriptions/entities/institution-subscription.entity.ts`.
> Es el bug más caro de este dominio y ya está resuelto en Aturna: no reinventarlo.

### 5.2 Vehículos activos: cómo se cuenta lo facturable

`MODELO-COMERCIAL.md` §2.3:

> *La facturación se calcula sobre el **máximo de vehículos activos simultáneos
> del mes**. Modo inactivo: factura al 30%.*

Eso obliga a observar el estado a lo largo del período, no en un instante.

**Diseño:**

1. `Truck` y `Trailer` suman `billingStatus: BillingStatus` (`ACTIVE` | `INACTIVE` | `DECOMMISSIONED`).
   - `INACTIVE` conserva historial, documentos y órdenes de trabajo, pero **no admite asignación de viajes** — validación de negocio en `TripsService.create()`.
   - El paso a `INACTIVE` requiere ≥30 días corridos fuera de servicio (§2.3). Auditable.
2. Cron diario (`billing.cron.ts`) que escribe un `VehicleBillingSnapshot` por empresa:

```ts
@Entity('vehicle_billing_snapshots')
@Unique(['companyId', 'date'])
export class VehicleBillingSnapshot {
  @Column({ type: 'date' }) date: Date;
  @Column('int') activeTrucks: number;
  @Column('int') inactiveTrucks: number;
  @Column('int') activeTrailers: number;
  @Column('int') inactiveTrailers: number;
}
```

3. Al emitir el período: `MAX()` de cada columna sobre los días del período.

**Por qué un snapshot diario y no un log de eventos**: el snapshot es trivial de
auditar frente al cliente ("el día 12 tenías 14 camiones activos"), no depende de
reconstruir estado, y una fila por empresa por día es despreciable en volumen.

### 5.3 Fórmula de precio

`back-camion/src/billing/pricing.util.ts` — **crear**, con su `.spec.ts`
(igual que `back-medicina/src/common/utils/plan-pricing.util.spec.ts`).

```ts
/**
 * Precio mensual de una empresa. Tarifa PLANA por vehículo: sin tramos ni
 * escalones (MODELO-COMERCIAL §7.2). La compresión por volumen la produce el
 * abono base al repartirse entre más unidades.
 *
 *   acoplado        = 50% de la tarifa por vehículo   (§2.4)
 *   modo inactivo   = 30% de la tarifa que le corresponda   (§2.3)
 *   mínimo de plan  = piso de unidades facturables      (§3.3)
 */
export function calcularPrecioMensual(plan: Plan, units: BilledUnits): PriceBreakdown {
  // 1) El mínimo del plan se aplica SOLO sobre camiones activos (D3).
  const camionesFacturables = Math.max(units.activeTrucks, plan.minVehicles);

  // 2) El precio suma todas las unidades con sus factores. Un acoplado factura
  //    al 50% pero NO ayuda a alcanzar el mínimo: son dos cálculos distintos.
  const unidades =
    camionesFacturables +
    units.inactiveTrucks * 0.3 +
    units.activeTrailers * 0.5 +
    units.inactiveTrailers * 0.5 * 0.3;

  // ...
}
```

**D3 resuelta** ([§3.2](#32-d3-resuelta--el-mínimo-cuenta-camiones-el-precio-cuenta-acoplados)):
el mínimo cuenta camiones; el precio cuenta acoplados al 50%.

### 5.4 Cambios de plan y de flota: fricción asimétrica

`MODELO-COMERCIAL.md` §6.4 define reglas asimétricas que el motor debe respetar:

| Movimiento | Efecto | Implementación |
|---|---|---|
| Upgrade de plan | Inmediato + prorrateo | `Company.planId` cambia ya; se emite una `Subscription` con `isProrated: true` por la diferencia hasta `periodEnd` |
| Agregar vehículos | Inmediato + prorrateo | Se detecta en el snapshot; el prorrateo se emite al cierre o al instante (decidir) |
| Alta de add-on | Inmediato + prorrateo | Igual que upgrade |
| **Downgrade de plan** | **Solo en la renovación** | `Company.scheduledPlanId` + `scheduledEffectiveAt` (patrón Aturna) |
| **Quitar vehículos** | **Solo en la renovación** | Se ofrece modo inactivo primero; la baja real queda pendiente |

`CompanyPlanUpdate` replica `InstitutionPlanUpdate` de Aturna: guarda `status`
(`APPLIED` / `PENDING`), `changeType`, `effectiveAt` y `appliedAt` — este último
es lo que hace **idempotente** al cron que aplica los cambios diferidos.

### 5.5 Add-ons

```ts
@Entity('addons')
export class Addon {
  @Column({ unique: true }) code: string;        // 'gps' | 'ia' | 'erp' | 'api' | ...
  @Column() name: string;
  @Column('decimal') monthlyPrice: number;       // Parte fija
  @Column('decimal') pricePerVehicle: number;    // Parte variable (GPS: 4900; IA: 1900)
  @Column('decimal') setupFee: number;
  @Column('simple-json') availableFromPlans: string[];  // ['operacion','gestion','corporate']
  @Column({ default: false }) isOneTime: boolean;       // Servicios profesionales
}
```

`CompanyAddon` guarda la contratación (`quantity`, `startedAt`, `endedAt`,
`scheduledEndAt`) y es lo que el emisor de períodos recorre para armar
`addonsAmount`.

Un add-on **también puede habilitar features**: el `FeatureGuard` de la fase 3
debe consultar `plan.features ∪ addons.features`. Caso concreto: **API REST +
Webhooks** es add-on en Gestión e incluido en Corporate.

### 5.6 Cobro manual (esta fase)

- Superadmin marca `isPaid` y adjunta el comprobante.
- `Payment` registra método, fecha, importe y comprobante en S3.
- Factura en PDF generada con `src/common/pdf/` y subida a S3 con `common/storage`.

### Criterio de aceptación

- Para el cliente tipo B del modelo comercial (12 camiones, Operación), el motor
  emite exactamente **$ 283.800** (`129.000 + 12 × 12.900`).
- Para el cliente tipo D (80 camiones, Gestión + ERP + IA + API + Soporte
  Premium), emite **$ 2.449.000**.
- Un upgrade a mitad de período genera **una** `Subscription` con `isProrated: true`
  y el cron de renovación **no** emite una factura extra ese mes.
- Un downgrade solicitado el día 10 no cambia nada hasta el próximo `periodStart`.
- `pricing.util.spec.ts` cubre: mínimo de vehículos, acoplados, modo inactivo,
  prepago anual (−15%) y bianual (−22%).

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R5.1 | El cron de renovación toma los prorrateos como períodos y duplica facturas | `WHERE isProrated = false` — el error ya documentado por Aturna |
| R5.2 | Disputa de facturación por el conteo de vehículos | `Subscription.billedUnits` guarda la foto; los snapshots diarios son la evidencia |
| R5.3 | Redondeo y decimales en `decimal(12,2)` con factores 0,5 y 0,3 | Todo el cálculo en la util pura con redondeo explícito a 2 decimales y tests |
| R5.4 | Un cambio de precio de lista reescribe facturas históricas | `Subscription` guarda importes, no referencias al plan. **Nunca recalcular un período emitido.** |
| R5.5 | Indexación por IPC (§7.5) sin mecanismo | Fuera del alcance de esta fase: se resuelve actualizando `Plan.baseFee`/`pricePerVehicle`, que solo afecta períodos futuros |

**Esfuerzo relativo: XL** (~3-4 semanas). Es la fase más grande y la que menos
tolera atajos.

---

## Fase 6 — Onboarding, trial e invitaciones

### Objetivo

Que una empresa se dé de alta sola desde la landing, arranque un trial de 21 días
de plan Operación y pueda invitar a su equipo.

### 6.1 Alta pública

| Archivo | Acción |
|---|---|
| `back-camion/src/companies/companies.controller.ts` | `POST /companies/register` — **público** (`@Public()`) |
| `back-camion/src/companies/companies.service.ts` | Alta transaccional: `Company` (status `TRIAL`, `trialEndsAt = hoy + 21d`, `planId` = Operación) + `User` admin + seed mínimo |
| `back-camion/src/companies/dto/register-company.dto.ts` | DTO con `class-validator`: razón social, CUIT, email, nombre y contraseña del admin |

**Todo en una transacción.** Una empresa a medio crear es un tenant huérfano que
después nadie limpia.

Seed inicial por empresa (dentro de la misma transacción): reglas de alerta por
defecto, ítems de checklist estándar y la plantilla OEA de 7 puntos AFIP.
Reutilizar la lógica de `back-camion/src/database/seed.ts`, extraída a un
`CompanySeedService`.

### 6.2 Onboarding guiado

`front-camion/pages/initial/` — **crear** (patrón `front-medicina/pages/initial/`):

| Paso | Página | Qué carga |
|---|---|---|
| 1 | `pages/initial/empresa.vue` | Datos fiscales, logo, sucursales |
| 2 | `pages/initial/flota.vue` | Primeros camiones y acoplados (con importación desde Excel) |
| 3 | `pages/initial/equipo.vue` | Invitaciones a usuarios y choferes |

`Company.onboardingStep` (int) y el middleware global redirigen mientras esté
incompleto — como hace `front-medicina/middleware/auth.global.ts` con
`finishConfigInsitution`.

### 6.3 Invitaciones

`back-camion/src/invites/` — **crear** (patrón `back-medicina/src/invites/`):

```ts
@Entity('invites')
export class Invite {
  @Column({ unique: true }) token: string;   // UUID, un solo uso
  @Column({ type: 'uuid' }) companyId: string;
  @Column() email: string;
  @Column({ type: 'enum', enum: Role }) role: Role;
  @Column() expiresAt: Date;
  @Column({ default: false }) used: boolean;
}
```

- `front-camion/pages/invite/[token].vue` — **crear**. Público. El invitado
  define su contraseña y queda dentro de la empresa correcta.
- **Los choferes se invitan igual**: es el flujo que reemplaza al alta manual y
  el que sostiene la promesa de "choferes ilimitados".

### 6.4 Estado de la cuenta

`back-camion/src/auth/guard/account-status.guard.ts` — **crear**, adaptando
`back-medicina/src/auth/guard/account-status.guard.ts`:

| Estado | Acceso |
|---|---|
| `TRIAL` | Completo, con banner de días restantes |
| `ACTIVE` | Completo |
| `DEFAULTER` | Completo, con banner de deuda |
| `BLOCKED` | **Solo lectura** sobre una lista blanca de rutas (D6) |
| `CANCELLED` | Sin acceso |

`front-camion/pages/estado-plan/index.vue` — **crear**: qué plan tiene, qué
consume, qué debe, cómo pagar (patrón `front-medicina/pages/estado-plan/`).

### Criterio de aceptación

- Un visitante completa el formulario de la landing y en menos de 2 minutos está
  usando el sistema con su empresa creada y datos de ejemplo cargados.
- Una empresa creada a la que le falla el seed **no queda registrada** (rollback).
- Un invitado con token vencido recibe un mensaje claro, no un 500.
- Al llegar `trialEndsAt` sin pago, la cuenta pasa a `BLOCKED` y solo lee.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R6.1 | Alta masiva de cuentas basura / abuso | `ThrottlerGuard` en el endpoint público (Aturna ya tiene `user-throttler.guard.ts`), verificación de email obligatoria, CAPTCHA si escala |
| R6.2 | Alta parcial deja tenant huérfano | Transacción única, sin excepciones |
| R6.3 | El `slug` de la empresa colisiona | Generación con sufijo numérico y unique en base |
| R6.4 | El seed inicial es lento y el usuario abandona | Medir; si supera ~3 s, hacerlo asincrónico con pantalla de "preparando tu cuenta" |

**Esfuerzo relativo: M** (~2 semanas).

---

## Fase 7 — Landing pública en la raíz

> **Fase independiente.** No depende de ninguna otra y puede ejecutarse en
> paralelo desde el día 0. Lo único que necesita de la fase 5 es el precio real
> de los planes (mientras tanto, se puede mostrar el de `MODELO-COMERCIAL.md`).

### Objetivo

Liberar `/` para la landing pública sin romper el backoffice ni la app del chofer.

### 7.1 Mover el panel

| Archivo | Acción |
|---|---|
| `front-camion/pages/index.vue` | **Mover** a `front-camion/pages/admin/index.vue` (queda con el resto de `pages/admin/`) |
| `front-camion/pages/index.vue` | **Reescribir** como landing pública, `definePageMeta({ layout: 'public' })` |
| `front-camion/components/layout/full/vertical-sidebar/sidebarItem.ts` | El ítem "Panel" pasa de `to: "/"` a `to: "/admin"` |
| `front-camion/middleware/auth.global.ts` | `home` del backoffice pasa de `/` a `/admin`; agregar la lista blanca de rutas públicas |

```ts
// middleware/auth.global.ts — nueva lista blanca
const publicRoutes = [
  '/',                       // Landing
  '/planes',
  '/contacto',
  '/para-transportistas',    // Landing SEO por segmento
  '/politica-de-privacidad',
  '/terminos-y-condiciones',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/invite',                 // startsWith
]
```

> **Ojo**: hoy el middleware hace `to.path.startsWith(r)`. Con `'/'` en la lista,
> `startsWith('/')` matchea **todo**. La ruta raíz debe compararse con
> igualdad exacta, como hace `front-medicina/middleware/auth.global.ts`
> (`to.path === "/"`). **Es el bug más probable de esta fase.**

### 7.2 Layout público

`front-camion/layouts/public.vue` — **crear** (patrón `front-medicina/layouts/home.vue`):

- Barra superior con `LogoHorizontal`, links a secciones, botones "Ingresar" y
  "Probar gratis".
- Footer con datos de contacto, links legales y redes.
- `titleTemplate` propio: `"%s | CamioNex"`.
- **No** carga el sidebar, ni los sockets, ni los stores del backoffice.

### 7.3 Secciones de la landing

Componentes nuevos en `front-camion/components/landing/`:

| Componente | Contenido | Fuente |
|---|---|---|
| `Hero.vue` | *"Dejá el cuaderno. Controlá tu flota desde el celular del chofer."* + CTA "Probar gratis 21 días" | §1.2 |
| `Problema.vue` | Los tres dolores: vencimientos, rendiciones, costo por km | §4.3 |
| `Modulos.vue` | Grilla de módulos con capturas reales | §4.1 |
| `Diferencial.vue` | Rendiciones, legajo argentino (LiNTI/CNRT), OEA — lo que ningún competidor tiene | §8.3 |
| `Planes.vue` | Las 4 tarjetas con precios reales, leídos de `GET /plans/public` | §3.2 + **D8** |
| `Calculadora.vue` | *Abono + (vehículos × tarifa)*: el cliente ve su precio en dos segundos | §10.1 punto 1 |
| `Prueba.vue` | Formulario de alta → `POST /companies/register` (fase 6) | §6.1 |
| `Contacto.vue` | Para Corporate y consultas | — |

`GET /plans/public` es **público** y devuelve solo los `isPublic: true`. Con eso,
un cambio de precio en la base actualiza la landing sin deploy.

### 7.4 SEO

Con `ssr: false` (`nuxt.config.ts`) **no hay HTML pre-renderizado**: los
crawlers modernos ejecutan JS, pero la indexación es peor y las previsualizaciones
de WhatsApp/LinkedIn (que no ejecutan JS) fallan.

**Opciones:**

| Opción | Costo | Efecto |
|---|---|---|
| Dejar `ssr: false` | 0 | OG/Twitter cards rotas al compartir. Inaceptable para la venta. |
| `nitro.prerender.routes` para las rutas públicas | Bajo | Genera HTML estático de la landing manteniendo el resto SPA. **Recomendado.** |
| Pasar todo a SSR | Alto | Rompe el modelo actual (auth en localStorage/Preferences, Capacitor) |

```ts
// nuxt.config.ts
nitro: {
  serveStatic: true,
  prerender: {
    routes: ['/', '/planes', '/contacto', '/para-transportistas',
             '/politica-de-privacidad', '/terminos-y-condiciones'],
  },
},
```

Cada página pública declara `useSeoMeta({ title, description, ogImage, ... })` y
se agrega `public/robots.txt` + `public/sitemap.xml`.

### 7.5 Convivencia con la app del chofer — **el riesgo real**

`front-camion/public/site.webmanifest` **no tiene `start_url`**, así que la PWA
arranca en `/`. Si `/` pasa a ser la landing, **la app instalada del chofer abre
la landing en lugar del login**.

**Correcciones necesarias:**

1. `public/site.webmanifest`: agregar `"start_url": "/chofer"`, `"scope": "/"`,
   `"name": "CamioNex"`, `"short_name": "CamioNex"` (hoy están vacíos) y
   `"theme_color": "#2563EB"` (hoy `#ffffff`, no coincide con el tema).
2. `middleware/auth.global.ts`: si el usuario autenticado es `DRIVER` y cae en `/`,
   redirigir a `/chofer` **antes** de resolver la ruta pública.
3. `plugins/capacitor-boot.client.ts` — **crear**: si `Capacitor.isNativePlatform()`,
   redirigir `/` a `/chofer` (o `/auth/login` si no hay sesión). La landing nunca
   debe verse dentro de la app nativa.

> **Verificar primero**: no hay `capacitor.config.ts` en el repositorio, aunque
> `@capacitor/core` y `@capacitor/preferences` son dependencias. Antes de tocar
> el arranque hay que confirmar si existe un proyecto nativo (Android/iOS) fuera
> del repo o si el uso es solo PWA + `Preferences` (que es lo que sugiere
> `composables/usePersist.ts`).

### Criterio de aceptación

- `/` muestra la landing a un visitante anónimo, sin redirigir a login.
- Un admin autenticado que entra a `/` ve la landing y tiene un botón "Ir al panel".
- Un chofer autenticado que entra a `/` termina en `/chofer`.
- La PWA instalada abre en `/chofer`.
- Compartir `https://<dominio>/` en WhatsApp muestra título, descripción e imagen.
- Lighthouse SEO ≥ 90 en `/`.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R7.1 | `startsWith('/')` en el middleware deja **todo** el sistema público | Comparación exacta para `/`. Test de middleware obligatorio. |
| R7.2 | La app del chofer instalada abre la landing | `start_url` + plugin de arranque + prueba en un dispositivo real con la PWA ya instalada (el manifest cacheado es el caso difícil) |
| R7.3 | El prerender falla porque la landing consulta `/plans/public` en build time | La landing renderiza precios como fallback estático y los refresca en cliente |
| R7.4 | El layout público carga el bundle completo del backoffice | Verificar el tamaño del chunk de `/`; separar imports pesados (apexcharts, socket.io) |

**Esfuerzo relativo: M** (~2 semanas, mayormente diseño y contenido).

---

## Fase 8 — Superadmin

### Objetivo

Administrar empresas, planes, suscripciones y cobranzas sin entrar a la base.

### 8.1 Backend

`back-camion/src/superadmin/` — **crear** (patrón `back-medicina/src/superadmin/`).

- `Role.SUPERADMIN` en `src/common/enums/role.enum.ts` (**D10**).
- El superadmin **no tiene `companyId`**: es el único caso legítimo de acceso
  cross-tenant. Su escape hatch al aislamiento de la fase 2 es **explícito y
  auditado**: cada consulta cross-tenant se registra.
- Endpoints: listado de empresas con métricas (vehículos activos, usuarios, MRR,
  storage, último acceso), cambio de plan, alta/baja de add-ons, emisión manual
  de un período, marcado de pago, bloqueo/desbloqueo, impersonación.

> **La impersonación es la funcionalidad de soporte más útil y la más peligrosa.**
> Requiere: registro en `audit-log`, token de vida corta, banner permanente en
> el front indicando que se está impersonando, y prohibición de escrituras
> (misma mecánica que el `DemoReadOnlyGuard` existente).

### 8.2 Auditoría

`back-camion/src/audit-log/` — **crear** (patrón `back-medicina/src/audit-log/`).
No solo para el superadmin: es lo que sostiene la promesa comercial de
**"Rol Auditor y trazabilidad de cambios"** (Gestión+, §4.1) y el requisito de
ERP de trazabilidad de create/update/delete.

### 8.3 Frontend

`front-camion/pages/superadmin/` — **crear**:

| Página | Contenido |
|---|---|
| `index.vue` | Tablero: MRR, altas del mes, churn, cuentas en mora, trials por vencer |
| `empresas/index.vue` | Listado con filtros por plan, estado y tamaño de flota |
| `empresas/[id].vue` | Ficha: datos, plan, add-ons, suscripciones, pagos, uso, acciones |
| `planes.vue` | ABM de planes, features y límites — **sin deploy** |
| `cobranzas.vue` | Períodos emitidos, vencidos, conciliación de pagos |

Layout propio (`layouts/superadmin.vue`) visualmente distinto del de cliente,
para que nunca haya dudas de dónde se está parado.

### Criterio de aceptación

- Un superadmin ve las N empresas; un admin de empresa que fuerza la URL de
  superadmin recibe `403` del backend, no solo un redirect del front.
- Cambiar un plan desde el panel se refleja en el cliente en < 60 s.
- Toda acción de superadmin sobre una empresa queda en `audit-log` con actor,
  empresa, acción y timestamp.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R8.1 | El superadmin es el agujero del aislamiento | Escape hatch explícito y auditado, nunca implícito. Sin `companyId` no se puede escribir. |
| R8.2 | Impersonación usada para escribir en nombre del cliente | Impersonación de solo lectura + banner + auditoría |

**Esfuerzo relativo: M** (~2 semanas).

---

## Fase 9 — MercadoPago y crons de cobranza

### Objetivo

Cobro automático recurrente y ciclo de vida comercial sin intervención manual.

### 9.1 Integración

Patrón directo de Aturna: `back-medicina/src/mp-auth/`, `mp-payments/`,
`webhooks/` y `common/utils/mp-oauth.util.ts` / `payments.util.ts`.

- **Diferencia importante**: Aturna usa MP Marketplace (cada institución cobra a
  sus pacientes con su propia cuenta). CamioNex necesita lo contrario: **CamioNex
  le cobra a la empresa**. Es más simple — una sola cuenta de MP, con
  `preapproval` (suscripción recurrente) por empresa.
- `Company.mpPreapprovalId` (ya previsto en el diseño de la fase 1).
- Los tokens se cifran con el `crypto.util.ts` ya existente en ambos proyectos.
- `back-camion/src/webhooks/` recibe las notificaciones de MP; **idempotencia
  obligatoria** (MP reenvía).

### 9.2 Crons

`back-camion/src/billing/billing.cron.ts`:

| Cron | Horario | Qué hace |
|---|---|---|
| Snapshot de vehículos | `0 2 * * *` | Escribe `VehicleBillingSnapshot` del día anterior |
| Aplicación de cambios diferidos | `0 3 * * *` | Aplica `CompanyPlanUpdate` con `effectiveAt <= hoy` y `status = PENDING`. Idempotente por `appliedAt`. |
| Renovación | `0 4 * * *` | Emite el período siguiente. **`WHERE isProrated = false`** (R5.1) |
| Vencimiento y mora | `0 5 * * *` | `ACTIVE` → `DEFAULTER` al vencer; `DEFAULTER` → `BLOCKED` tras los días de gracia (**D9**) |
| Fin de trial | `0 5 * * *` | `TRIAL` → `BLOCKED` (D6) con avisos previos a 7, 3 y 1 día |
| Reconciliación de storage | `0 1 * * *` | Corrige `Company.storageBytesUsed` |

> Aturna usa `@Cron('0 1 * * *')` y `@Cron('30 1 * * *')` en
> `institution-subscriptions.service.ts`, y deja documentado por qué una
> institución genera **una sola** factura por renovación aunque estuviera en
> mora. Replicar ese razonamiento tal cual.

### 9.3 Emails transaccionales

Reutilizar `back-camion/src/notifications/email/`: aviso de emisión, de
vencimiento próximo, de pago recibido, de mora y de bloqueo.

### Criterio de aceptación

- Una empresa completa un ciclo entero (emisión → pago por MP → webhook →
  `isPaid: true`) sin intervención.
- Un webhook duplicado de MP no genera un segundo `Payment`.
- Una empresa en mora se bloquea y se desbloquea sola al acreditarse el pago.
- Los crons son idempotentes: correrlos dos veces el mismo día no duplica nada.

### Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R9.1 | Doble facturación por cron corrido dos veces | Unicidad `(companyId, periodStart, isProrated)` en base, no solo en código |
| R9.2 | Webhook duplicado | Tabla de eventos procesados por `mpPaymentId` |
| R9.3 | Bloqueo indebido de un cliente que sí pagó | Días de gracia (D9) + alerta al superadmin antes del bloqueo, nunca bloqueo silencioso |
| R9.4 | Cambio de precio de lista aplicado a períodos ya emitidos | R5.4: los importes se congelan en la `Subscription` |

**Esfuerzo relativo: L** (~2-3 semanas).

---

## Fase 10 — Corporate: multi-empresa, API y SSO

> Posterior. `MODELO-COMERCIAL.md` §11.3: *"Corporate — Mes 12+. Requiere
> multi-empresa, SSO y API. No venderlo antes de tenerlo."*

### Alcance

| Capacidad | Trabajo |
|---|---|
| **Multi-empresa** | Entidad `CompanyGroup`; tabla pivote `user_company` (resuelve **D1** definitivamente); selector de empresa en el header; consolidación de indicadores a nivel grupo |
| **API REST + Webhooks** | `ApiKey` por empresa, `ApiKeyGuard` (Aturna ya tiene `api-key.guard.ts`), rate limiting por empresa, documentación pública |
| **SSO / Active Directory** | SAML/OIDC. Evaluar `passport-saml`. |
| **Sandbox** | Un tenant espejo por empresa Corporate |
| **Marca blanca** | `Company.logoUrl` / `primaryColor` ya previstos; dominio propio requiere routing por host |

**Esfuerzo relativo: XL**. Se planifica por separado cuando exista el primer
cliente Corporate real.

### Comprobante del abono

**Cerrado el 10/09/2026.** El cliente ya no tiene que pedir la factura por mail:
la administración la sube al período y él se la baja de su propia pantalla.

La decisión de fondo es que **el sistema no emite la factura**. Integrar el web
service de AFIP es un proyecto en sí mismo —puntos de venta, tipos de
comprobante, contingencia— y no es lo que hoy duele: lo que duele es que la
factura exista en el mail de alguien y no en el sistema. Así que se resolvió la
mitad que sí importa: donde vive el archivo y contra qué datos se emite.

| Pieza | Archivo | Nota |
|---|---|---|
| Datos de facturación | `companies.invoiceTaxCondition`, `invoiceAddress` | Se suman a `invoiceName`, `invoiceCuit` e `invoiceEmail`, que ya existían. **Sin la condición frente al IVA no se sabe si va una A o una B**, así que con los tres campos viejos no se podía emitir. |
| Pantalla del cliente | `components/billing/InvoiceDataCard.vue` en `/estado-plan` | Avisa qué falta en lugar de exigirlo: se puede operar sin completarlo, pero entonces la factura sale a nombre de la cuenta y sin condición de IVA. Los lee de `GET /companies/me` y **no de la sesión**, que se persiste en cada dispositivo. |
| El archivo | `subscriptions.invoiceKey` (+ `invoiceNumber`, `invoiceUploadedAt`) | La columna se llamaba `invoiceUrl` y **nadie la escribía nunca**. Renombrada porque lo que guarda es la key de S3: un nombre que dice "url" termina dentro de un `href` que da 403. |
| Carga | `POST /superadmin/companies/:id/billing/:subscriptionId/invoice` | Multipart, sólo PDF, la key la resuelve el backend. Auditada (`billing.invoice_uploaded`). |
| Descarga | `GET /billing/subscriptions/:id/invoice` (cliente) y el equivalente en `superadmin` | Se sirve el archivo, **no una URL firmada**: el bucket no es público y una URL firmada que se filtra sigue valiendo hasta que expira. Mismo criterio que el PDF de la rendición. |
| Baja | `DELETE .../invoice` | **El archivo queda en S3**: es documentación fiscal y borrarla por una carga equivocada sería irreversible. Se corta el vínculo y la key va a la bitácora, que es lo único que permite recuperarlo. |

**El aislamiento es lo que se testeó.** Los tres métodos del servicio buscan el
período **por id y por empresa**, porque el endpoint del superadmin recibe las
dos cosas por la URL: si alguno filtrara sólo por id, pegarle con el id de un
período ajeno dejaría subirle —o bajarle— la factura al cliente equivocado.
`billing-invoice.service.spec.ts` lo fija con **10 casos**, cuatro de ellos
cruzando empresa.

**Los datos de facturación son de sólo lectura en el panel.** El superadmin los
ve para emitir y ve qué le falta al cliente, pero no los edita: cambiárselos
desde la plataforma sería facturarle a un CUIT que el cliente no eligió.

### Por qué la fase 10 espera

**Decisión del 14/08/2026: no se arranca ninguno de los cinco tracks todavía.**

Se llegó a evaluarla en detalle y se frenó antes de escribir la primera línea de
producción. El motivo no es de esfuerzo sino de secuencia, y sale del propio
`MODELO-COMERCIAL.md`:

| Capacidad | Plan que la incluye | Cuándo se vende |
|---|---|---|
| `multi_company`, `sso`, `sandbox` | Sólo Corporate | §11.3: **Mes 12+**, *"no venderlo antes de tenerlo"* |
| `api` | Add-on de Gestión ($ 119.000) e incluida en Corporate | Cuando un cliente Gestión lo pida |
| `white_label` | Add-on de Gestión+ ($ 149.000) | Ídem |

La curva de §9.3 pone el año 1 en **mix Control / Operación**. Los dos tracks
vendibles hoy (`api` y `white_label`) son add-ons de **Gestión**, que en esa
curva todavía casi no existe, y los otros tres son exclusivos de Corporate, que
son 15 clientes del año 3.

Y hay una razón que pesa más que el calendario: **una API es un contrato que se
sostiene para siempre**. La forma que se le dé sin un integrador real del otro
lado es una conjetura, y la conjetura se paga cuando el primer cliente pide algo
que no encaja y ya hay endpoints publicados que no se pueden cambiar. Es
exactamente el mismo argumento que §11.3 aplica a Corporate, sólo que en la
escala de un add-on.

**Cuándo dejar de esperar** — cualquiera de estas tres alcanza:

1. Un cliente Gestión pide la integración y está dispuesto a pagarla.
2. Aparece la primera oportunidad Corporate concreta (ahí el track que arranca es
   multi-empresa, no la API).
3. La operación interna necesita la API para algo propio (por ejemplo, alimentar
   un tablero de la plataforma sin consultar la base a mano).

Cuando eso pase, el orden sugerido es **API REST + Webhooks primero**: es el
único track que no toca el núcleo de aislamiento de la fase 2, así que no
arrastra la revisión de los 104 tests e2e que sí arrastra multi-empresa.

Lo que ya está listo y no hay que rehacer: los flags `api`, `multi_company`,
`sso`, `sandbox` y `white_label` existen en `Feature` y están sembrados en los
planes y en el catálogo de add-ons, y `PlanContextService` ya resuelve las
features como `plan ∪ add-ons`. El gating está puesto; falta lo que va detrás.

### El rate limit no corría — corregido el 14/08/2026

Apareció al evaluar la fase 10 y **no dependía de ella**, así que se resolvió por
separado.

> **`ThrottlerGuard` nunca se había registrado como `APP_GUARD`.**
>
> `app.module.ts` importaba `ThrottlerModule.forRoot(...)`, pero sin un provider
> `APP_GUARD` **`@nestjs/throttler` no intercepta nada**: los seis `@Throttle(...)`
> de las fases 6 y 9 estaban declarados y no corrían, y el techo global tampoco.
> Quedaban sin efecto el freno al alta pública de empresas —que es la mitigación
> de **R6.1** junto con la verificación de email—, el reenvío de invitaciones y de
> confirmación de casilla, y el webhook de Mercado Pago, que **es público**.
>
> Es el peor tipo de protección: la que se lee bien en el código, figura como
> cubierta en el plan y no hace nada.

**Cómo se cerró:**

| Cambio | Por qué |
|---|---|
| `AppThrottlerGuard` registrado como `APP_GUARD` | Global y no por controlador: un límite que hay que acordarse de poner en cada ruta nueva falta tarde o temprano justo donde importa |
| El contador es **por sesión** cuando hay token, y por IP cuando no | Contar por IP a los usuarios autenticados rompería a cualquier cliente con oficina: diez personas detrás de una sola IP pública compartirían el balde y se cortarían entre ellas. Los anónimos no tienen token, y son justo los casos —login, alta, webhook— donde limitar por IP es lo correcto |
| El token se guarda hasheado (SHA-256 recortado) en la clave del throttler | La clave termina en memoria y en los diagnósticos; una credencial válida no tiene por qué estar ahí |
| `TRUST_PROXY` en `main.ts`, con default 1 en producción | **Sin esto el arreglo habría sido peor que el problema.** La app escucha en texto plano y nginx termina TLS, así que `req.ip` era siempre la IP del proxy: todo el tráfico anónimo habría compartido un contador y el alta de empresas se habría agotado entre todos los clientes |
| `THROTTLE_ENABLED=false` en el entorno e2e | Las suites corren seguidas desde la misma IP y agotarían cualquier techo. Un test que falla por el rate limit no dice nada sobre lo que probaba |

**Verificación:** `src/common/throttler/app-throttler.guard.spec.ts` (9 casos sobre
qué se cuenta) y `test/rate-limit.e2e-spec.ts` (5 casos e2e). Estos últimos son
los que importan, porque prueban lo que fallaba: que un endpoint decorado
devuelva **429**. Se verifican dos endpoints con límites distintos (5 y 5 sobre
un techo global de 120) para que no puedan pasar por casualidad si el guard
estuviera enganchado pero ignorando el `@Throttle` del método.

> ⚠️ **`TRUST_PROXY` hay que definirlo en el `.env.production` del servidor**: los
> `.env` están en `.gitignore` y no viajan con el deploy. El default del código es
> 1 (nginx en la misma máquina); si hay un balanceador o un CDN delante, va 2.

### Deuda abierta

> **`POST /auth/login` no tiene `@Throttle` propio.** Apareció al escribir los
> tests del arreglo anterior: un test daba por hecho un límite de 20 intentos y
> resultó que no existe. Hoy el login sólo tiene el techo global —**120 intentos
> por minuto y por IP**—, que para probar contraseñas por fuerza bruta es
> holgado. Lo mismo vale para `forgot-password`, `reset-password` y
> `change-password`.
>
> El arreglo es un decorador por endpoint. Se dejó afuera a propósito del cambio
> anterior: aquél reparaba una protección que se creía activa, y ésta es una
> protección nueva, con su propia decisión de cuán estricta conviene que sea
> (demasiado estricta y un usuario que se equivoca tres veces queda afuera diez
> minutos).

---

## 11. Orden de ejecución, dependencias y esfuerzo

### 11.1 Grafo de dependencias

```
 Fase 0 ──► Fase 1 ──► Fase 2 ──┬──► Fase 3 ──► Fase 4
 (migrac.)  (modelo)  (aislam.) │         │
                                │         └──► Fase 5 ──► Fase 9
                                │              (billing)   (MP + crons)
                                └──► Fase 6 ────────┘
                                     (onboarding)
                                          │
                                          └──► Fase 8 (superadmin)

 Fase 7 (landing) ─── independiente, en paralelo desde el día 0
                      (solo necesita GET /plans/public de la fase 5 para
                       mostrar precios dinámicos; hasta entonces, estáticos)

 Fase 10 (Corporate) ─── requiere 1..9 completas
```

### 11.2 Tabla resumen

| Fase | Nombre | Esfuerzo | Depende de | Entregable verificable |
|---|---|:---:|---|---|
| **0** | Migraciones y red de seguridad | **S** | — | Esquema controlado por migraciones |
| **1** | Modelo de datos multi-tenant | **L** | 0 | Dos empresas conviven en la base |
| **2** | Aislamiento por defecto | **L** | 1 | Barrido de endpoints cruzados: cero fugas |
| **3** | Planes y gating cualitativo | **M** | 2 | Control no puede llamar a `/settlements` |
| **4** | Límites cuantitativos | **M** | 3 | Límites de reglas, storage y retención activos |
| **5** | Facturación y add-ons | **XL** | 3 | Los 5 clientes tipo del modelo facturan exacto |
| **6** | Onboarding, trial e invitaciones | **M** | 2 (3 y 5 deseables) | Alta autoservicio en < 2 minutos |
| **7** | Landing pública | **M** | — | `/` es pública y la PWA del chofer sigue funcionando |
| **8** | Superadmin | **M** | 5, 6 | Gestión de cartera sin tocar la base |
| **9** | MercadoPago y crons | **L** | 5 | Ciclo de cobro completo sin intervención |
| **10** | Corporate | **XL** | 1–9 | Multi-empresa, API, SSO — ⏸️ [postergada](#por-qué-la-fase-10-espera) |

**Escala**: S ≈ 3-4 días · M ≈ 1,5-2 semanas · L ≈ 2-3 semanas · XL ≈ 3-4 semanas
(1 desarrollador full-time).

**Total fases 0–9: aproximadamente 4,5 a 5,5 meses** de un desarrollador
full-time, o ~3 meses con dos personas si la fase 7 y parte de la 8 corren en
paralelo.

### 11.3 Secuencia mínima para vender el primer cliente #2

Si el objetivo es facturarle a una segunda empresa lo antes posible:

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 (parcial: solo las features que separan Control de Operación)
                                 → alta manual de la empresa por SQL
                                 → cobro por transferencia, fuera del sistema
```

Eso son **~6-7 semanas** y ya permite tener dos clientes reales. Las fases 5, 6,
8 y 9 son las que permiten pasar de 2 clientes a 40 sin que el proceso se rompa
— y según `MODELO-COMERCIAL.md` §10.2 punto 8, **40 es exactamente donde se
rompe** si no están.

### 11.4 Lo que NO se debe posponer

| Cosa | Por qué |
|---|---|
| El **tripwire** de la fase 2 | Postergarlo es aceptar que la primera fuga se descubra por un cliente |
| El **motor de facturación** (fase 5) | El propio modelo comercial lo marca: las planillas fracasan a los 40 clientes |
| `isProrated` en la `Subscription` | Agregarlo después implica recalcular facturas ya emitidas |
| Las **migraciones** (fase 0) | Cada día con `synchronize: true` es un cambio de esquema no auditado más |

---

## Anexo A — Las 13 constraints `unique` globales

| # | Entidad | Archivo | Columna | ¿Rompe multi-tenant? | Acción |
|---|---|---|---|:---:|---|
| 1 | `Truck` | `src/fleet/entities/truck.entity.ts:37` | `plate` | **Sí, duro** | `UNIQUE (companyId, plate)` |
| 2 | `Trailer` | `src/fleet/entities/trailer.entity.ts:34` | `plate` | **Sí, duro** | `UNIQUE (companyId, plate)` |
| 3 | `Fleet` | `src/fleet/entities/fleet.entity.ts:38` | `code` | **Sí, duro** | `UNIQUE (companyId, code)` |
| 4 | `Employee` | `src/hr/entities/employee.entity.ts:55` | `documentId` | **Sí, duro** | `UNIQUE (companyId, documentId)` — un chofer puede trabajar en dos empresas |
| 5 | `Incident` | `src/incidents/entities/incident.entity.ts:45` | `code` | **Sí, duro** | `UNIQUE (companyId, code)` + secuencia por empresa |
| 6 | `Trip` | `src/trips/entities/trip.entity.ts:39` | `code` | **Sí, duro** | `UNIQUE (companyId, code)` + secuencia por empresa |
| 7 | `AlertRuleConfig` | `src/alerts/entities/alert-rule-config.entity.ts:21` | `key` | **Sí, duro** | `UNIQUE (companyId, key)` — cada empresa configura sus reglas |
| 8 | `FuelRecord` | `src/fuel/entities/fuel-record.entity.ts:99` | `clientId` | No (UUID), pero sí como vector | `UNIQUE (companyId, clientId)` — evita que un cliente reclame el `clientId` de otro tenant |
| 9 | `OeaInspection` | `src/oea/entities/oea-inspection.entity.ts:115` | `clientId` | Ídem | `UNIQUE (companyId, clientId)` |
| 10 | `TripLogEntry` | `src/trip-log/entities/trip-log-entry.entity.ts:74` | `clientId` | Ídem | `UNIQUE (companyId, clientId)` |
| 11 | `Driver` | `src/drivers/entities/driver.entity.ts:42` | `employeeId` | **No** | Se mantiene global: es una FK UUID y expresa "un chofer por empleado". Documentar. |
| 12 | `DeviceToken` | `src/notifications/push/entities/device-token.entity.ts:19` | `token` | **No** | Se mantiene global: el token FCM es único por dispositivo por naturaleza. Agregar `companyId` y **reasignarlo** al re-registrar (un celular puede cambiar de empresa). |
| 13 | `User` | `src/users/entities/user.entity.ts:34` | `email` | **No — decisión tomada** | **D1 resuelta: se mantiene `UNIQUE` global.** Se agrega `companyId` (un usuario pertenece a una empresa por vez) y `isActive`. El cambio de empresa se resuelve **reasignando** el registro, no dando de alta uno nuevo — ver [§3.1](#31-d1-resuelta--email-único-global-y-el-caso-borde-del-cambio-de-empresa). |

---

## Anexo B — Mapa de features por plan

Derivado de `MODELO-COMERCIAL.md` §4.1. **Este mapa vive en la base**
(`Plan.features`), no en el código: es el `seed` inicial, y el superadmin lo
edita sin deploy.

| Feature | Control | Operación | Gestión | Corporate |
|---|:---:|:---:|:---:|:---:|
| `fleet`, `documents`, `alerts`, `trips`, `checklists`, `messages`, `incidents` (básico), `driver_app` | ✅ | ✅ | ✅ | ✅ |
| `export_excel` | — | ✅ | ✅ | ✅ |
| `trip_log` (bitácora y adelantos) | — | ✅ | ✅ | ✅ |
| `settlements` (rendiciones) — **nunca en Control** | — | ✅ | ✅ | ✅ |
| `fuel` | — | ✅ | ✅ | ✅ |
| `maintenance` | — | ✅ | ✅ | ✅ |
| `oea` | — | ✅ | ✅ | ✅ |
| `incidents_kanban` | — | ✅ | ✅ | ✅ |
| `hr_basic` | — | ✅ | ✅ | ✅ |
| `fuel_ranking` | — | — | ✅ | ✅ |
| `indicators` (costo/km) — **nunca en Operación** | — | — | ✅ | ✅ |
| `hr_full` (historial laboral, bloqueo por licencia) | — | — | ✅ | ✅ |
| `alert_thresholds` | — | — | ✅ | ✅ |
| `auditor_role` | — | — | ✅ | ✅ |
| `scheduled_reports` | — | — | ✅ | ✅ |
| `api` | — | — | add-on | ✅ |
| `multi_company`, `sso`, `sandbox` | — | — | — | ✅ |
| `white_label` | — | — | add-on | add-on |

**Límites** (`Plan.limits`):

| Límite | Control | Operación | Gestión | Corporate |
|---|---|---|---|---|
| `retentionMonths` | 6 | 24 | 60 | `null` (ilimitado) |
| `storageGb` | 5 | 50 | 250 | `null` |
| `alertRules` | 3 | 10 | `null` | `null` |
| `maintenancePlans` | 0 | 10 | `null` | `null` |
| `roles` | `[admin, dispatcher, driver, manager]` | `+ maintenance, hr` | `+ auditor` | a medida |

---

_Documento elaborado el 8 de agosto de 2026. Las decisiones marcadas **D1–D10**
requieren definición del dueño del producto antes de ejecutar la fase donde
aparecen._
