# FleetLog — Modelo Comercial SaaS

> Diseño de monetización para escalar de 1 a 1.000+ empresas de transporte de carga.
> Mercado: Argentina. Moneda de lista: ARS + IVA.
> Fecha de elaboración: agosto 2026 · Tipo de cambio de referencia: USD 1 = ARS 1.520 (oficial venta).

> **Estado al 15/08/2026.** El modelo dejó de ser un diseño: **está implementado**.
> Planes, features, límites, facturación, prorrateo, trial, alta autoservicio y
> cobro por Mercado Pago corren en el producto (fases 0 a 9 de
> [`PLAN-SAAS.md`](./PLAN-SAAS.md)). Lo que **no** está construido —y por lo tanto
> no se puede vender todavía— está marcado con ⏳ a lo largo del documento y
> resumido en el [§12](#12-anexo--estado-de-implementación-del-gating).

---

## Índice

1. [Estrategia general](#1-estrategia-general)
2. [Arquitectura comercial](#2-arquitectura-comercial)
3. [Diseño de planes](#3-diseño-de-planes)
4. [Funcionalidades por plan](#4-funcionalidades-por-plan)
5. [Servicios adicionales (Add-ons)](#5-servicios-adicionales-add-ons)
6. [Estrategia de upgrades](#6-estrategia-de-upgrades)
7. [Estrategia de pricing](#7-estrategia-de-pricing)
8. [Benchmark internacional](#8-benchmark-internacional)
9. [Simulación de ingresos](#9-simulación-de-ingresos)
10. [Ventajas y desventajas del modelo](#10-ventajas-y-desventajas-del-modelo)
11. [Recomendación final](#11-recomendación-final)
12. [Anexo — Estado de implementación del gating](#12-anexo--estado-de-implementación-del-gating)

---

## 1. Estrategia general

### 1.1 La tesis comercial

FleetLog no compite por ser el software de flota más completo. Compite por ser **el
primero que una empresa de transporte argentina puede poner a andar en dos semanas y
que el chofer efectivamente usa**.

Eso define tres decisiones estructurales:

| Decisión | Por qué |
|---|---|
| **La unidad de valor es el vehículo, no el usuario** | El camión es lo que genera ingresos y costos. Cobrar por usuario castiga la adopción — y la adopción es lo único que evita el churn. |
| **Choferes y usuarios ilimitados en todos los planes** | Un chofer que no está en el sistema es un cuaderno que sigue existiendo. Cobrar por chofer es cobrar por el propio éxito del producto. |
| **El alcance funcional se compra con el plan, no con el volumen** | Una empresa de 5 camiones que necesita rendiciones vale más que una de 15 que solo necesita ver vencimientos. El plan captura el valor funcional; el vehículo captura la escala. |

### 1.2 El posicionamiento por resultado

Los planes no se llaman por tamaño ("Básico / Pro / Premium"): se llaman por **el
problema que resuelven**. El dueño de una flota de 12 camiones no se identifica con
"Básico" — se identifica con "necesito controlar la plata de los viajes".

```
CONTROL       →  "Sé qué tengo y qué se me vence."
OPERACIÓN     →  "Sé qué pasa en cada viaje y cuánto me costó."
GESTIÓN       →  "Sé cuánto gano por kilómetro y por chofer."
CORPORATE     →  "Manejo varias empresas como una sola operación."
```

Esta escalera es también el guion de venta: **cada plan es una respuesta a una pregunta
que el cliente ya se está haciendo.**

### 1.3 Los cuatro motores de crecimiento

| Motor | Mecánica | Impacto |
|---|---|---|
| **Land** | Plan Control con barrera baja y onboarding acotado | Volumen de cuentas |
| **Expand por módulo** | Upgrade de plan al aparecer una necesidad nueva | +180% ARPU (Control → Operación) |
| **Expand por flota** | Crecimiento orgánico de vehículos del cliente | +8-12% ARPU anual sin esfuerzo comercial |
| **Expand por add-on** | GPS, IA, ERP, API, soporte premium | +25-40% ARPU en cuentas maduras |

El objetivo es una **Net Revenue Retention (NRR) > 110%**: aunque no se sume un solo
cliente nuevo, la facturación crece.

---

## 2. Arquitectura comercial

### 2.1 Los tres componentes del ingreso

```
┌─────────────────────────────────────────────────────────────────┐
│  1. IMPLEMENTACIÓN  (pago único, al inicio)                     │
│     Setup, carga inicial, parametrización, capacitación         │
│     → Financia el CAC · Filtra curiosos · Ancla el compromiso   │
├─────────────────────────────────────────────────────────────────┤
│  2. SUSCRIPCIÓN  (recurrente mensual)                           │
│                                                                 │
│         ABONO DEL PLAN        +      PRECIO POR VEHÍCULO        │
│         (valor funcional)            (escala de la operación)   │
│         fijo, por cuenta             variable, decreciente      │
│                                                                 │
│     → El 100% de la valuación de la empresa vive acá            │
├─────────────────────────────────────────────────────────────────┤
│  3. ADD-ONS  (recurrentes + servicios profesionales únicos)     │
│     GPS · IA · ERP · API · Soporte Premium · Migración · etc.   │
│     → Sube el ARPU sin tocar la lista de precios                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Por qué abono base + por vehículo (y no solo por vehículo)

Fleetio y la mayoría de los SaaS de flota cobran **únicamente** por vehículo y
resuelven el piso con un mínimo de unidades. El esquema **abono base + por vehículo**
que elegiste es superior para el mercado argentino por cuatro razones:

1. **Separa el precio del valor funcional del precio de la escala.** El abono base es
   lo que el cliente paga por *tener acceso a un conjunto de capacidades*; el precio
   por vehículo es lo que paga por *usarlas sobre más activos*. Son dos ejes distintos
   y conviene cobrarlos por separado.

2. **Protege el margen en cuentas chicas.** Servir a un cliente de 4 camiones cuesta
   casi lo mismo que servir a uno de 25 (soporte, infraestructura, onboarding,
   almacenamiento). Sin abono base, la cuenta chica es deficitaria.

3. **El abono base ya funciona como descuento por volumen, sin tabla de tramos.**
   Al ser un monto fijo que se reparte entre más unidades, el precio efectivo por
   vehículo baja solo a medida que la flota crece. En Operación va de $ 38.700 por
   camión con 5 unidades a $ 15.480 con 50 — una compresión del 60% que ocurre
   automáticamente y que **no requiere una tabla de escalones** (ver §7.2).

4. **Deja una sola tarifa por vehículo para cotizar.** Dos números y una
   multiplicación. Un vendedor lo hace de memoria frente al cliente.

### 2.3 Definición contractual de "vehículo activo"

Este es el punto que más disputas genera en operación. Definición recomendada,
explícita en el contrato:

> **Vehículo activo**: unidad (camión o acoplado con seguimiento propio) que estuvo
> habilitada en la plataforma al menos un día del período facturado. La facturación se
> calcula sobre el **máximo de vehículos activos simultáneos del mes**.
>
> **Modo inactivo**: una unidad declarada fuera de servicio por más de 30 días
> corridos (rotura mayor, baja estacional, venta en trámite) puede pasarse a modo
> inactivo y factura al **30% del precio por vehículo**. Conserva su historial, sus
> documentos y sus órdenes de trabajo, pero no admite asignación de viajes.

El modo inactivo es un mecanismo de **retención**, no de descuento: evita que un
cliente con flota estacional dé de baja el servicio completo en temporada baja.

> **Implementado, con el detalle que evita el abuso**: se factura el **máximo de
> unidades activas del período** —hay una foto diaria por empresa—, no la
> situación del último día, así que dar de baja las unidades el día 30 no evita el
> cargo. Y una unidad en modo inactivo **no admite asignación de viajes**: si
> pudiera operar al 30 %, el modo inactivo sería un descuento encubierto.

### 2.4 Los acopl​ados

Un acoplado consume funcionalidad real (documentos, VTV, mantenimiento, checklist)
pero mucho menos que un camión. Recomendación: **acoplado = 50% del precio por
vehículo**, en todos los planes. Es simple de explicar, es percibido como justo y suma
ingreso sobre un activo que hoy nadie cobra.

---

## 3. Diseño de planes

### 3.1 Cuántos planes

**Cuatro: tres autoservicio + uno negociado.** Es el número que sostienen Fleetio
(Essential/Professional/Premium), Geotab (Base/Regulatory/Pro/ProPlus) y prácticamente
todo el SaaS B2B maduro.

- **Menos de tres** deja plata sobre la mesa: no hay escalera de upgrade.
- **Más de cuatro** paraliza la decisión y hace imposible entrenar a un vendedor.

### 3.2 La tabla comercial

| | **CONTROL** | **OPERACIÓN** ⭐ | **GESTIÓN** | **CORPORATE** |
|---|---|---|---|---|
| **Promesa** | "Dejá el cuaderno" | "Del checklist a la rendición" | "Decidí con números" | "Varias empresas, una operación" |
| **Cliente típico** | Fletero / familiar | PyME de transporte | Empresa consolidada | Grupo / multi-planta |
| **Flota** | 3 – 8 unidades | 8 – 25 unidades | 25 – 80 unidades | 60+ unidades |
| **Abono base / mes** | **$ 59.000** | **$ 129.000** | **$ 249.000** | desde **$ 490.000** |
| **Por vehículo / mes** | **$ 7.900** | **$ 12.900** | **$ 18.900** | negociado (desde $ 10.900) |
| **Mínimo de vehículos** | 3 | 5 | 8 | 25 |
| **Implementación (única)** | $ 290.000 | $ 590.000 | $ 990.000 | desde $ 2.500.000 |
| **Compromiso** | Mensual o anual | Anual recomendado | Anual | 24 – 36 meses |
| **Usuarios y choferes** | Ilimitados | Ilimitados | Ilimitados | Ilimitados |

*Precios en ARS + IVA. Acoplados al 50%. **Tarifa plana por vehículo: sin tramos ni
escalones de volumen** — la compresión la produce el abono base (§7.2).*

### 3.3 Lógica de los mínimos de vehículos

El mínimo es el mecanismo que **impide que un cliente chico se lleve el 100% del
producto pagando poco**. Una empresa de 4 camiones que quiere Gestión paga por 8:

```
4 camiones en Gestión    →  $ 249.000 + (8 × $ 18.900)  =  $ 400.200/mes
4 camiones en Operación  →  $ 129.000 + (5 × $ 12.900)  =  $ 193.500/mes
```

No se le niega el producto — se le cobra lo que vale el acceso a esas capacidades.
En la práctica, ese cliente compara y elige Operación, que es exactamente el
resultado deseado.

---

## 4. Funcionalidades por plan

### 4.1 Matriz completa

Basada en lo efectivamente desarrollado en la plataforma hoy.

| Funcionalidad | Control | Operación | Gestión | Corporate |
|---|:---:|:---:|:---:|:---:|
| **BASE** | | | | |
| Usuarios de backoffice ilimitados | ✅ | ✅ | ✅ | ✅ |
| Choferes ilimitados | ✅ | ✅ | ✅ | ✅ |
| Roles y permisos (7 roles) | 4 roles | 6 roles | 7 roles | A medida |
| App del chofer (PWA, mobile-first) | ✅ | ✅ | ✅ | ✅ |
| Modo offline con sincronización | ✅ | ✅ | ✅ | ✅ |
| Dictado por voz y captura de fotos | ✅ | ✅ | ✅ | ✅ |
| Buscador global / paleta de comandos | ✅ | ✅ | ✅ | ✅ |
| **FLOTA** | | | | |
| Camiones, acoplados y agrupaciones de flota | ✅ | ✅ | ✅ | ✅ |
| Centro documental con adjuntos | ✅ | ✅ | ✅ | ✅ |
| Alertas automáticas de vencimiento | ✅ | ✅ | ✅ | ✅ |
| Exportación de documentos a Excel | — | ✅ | ✅ | ✅ |
| **VIAJES** | | | | |
| Alta y asignación de viajes | ✅ | ✅ | ✅ | ✅ |
| Inicio / fin con odómetro y GPS | ✅ | ✅ | ✅ | ✅ |
| Hoja de ruta en PDF | ✅ | ✅ | ✅ | ✅ |
| Checklist pre-viaje con firma digital | ✅ | ✅ | ✅ | ✅ |
| Filtros avanzados y exportación a Excel | — | ✅ | ✅ | ✅ |
| **BITÁCORA Y DINERO** | | | | |
| Bitácora en ruta (gastos, peajes, multas, viáticos) | — | ✅ | ✅ | ✅ |
| Adelantos de dinero al chofer | — | ✅ | ✅ | ✅ |
| Comprobantes fotográficos por movimiento | — | ✅ | ✅ | ✅ |
| Resumen en vivo de neto a rendir | — | ✅ | ✅ | ✅ |
| **Rendiciones automáticas + PDF** | — | ✅ | ✅ | ✅ |
| **COMBUSTIBLE** | | | | |
| Carga de abastecimientos desde la app | — | ✅ | ✅ | ✅ |
| Tablero km/l, l/100km, costo/km | — | ✅ | ✅ | ✅ |
| Ranking y comparativa por camión y chofer | — | — | ✅ | ✅ |
| **MANTENIMIENTO** | | | | |
| Órdenes de trabajo con adjuntos y PDF | — | ✅ | ✅ | ✅ |
| Planes preventivos por km / horas / fecha | — | 10 activos | Ilimitados | Ilimitados |
| Proyección de próximos servicios | — | ✅ | ✅ | ✅ |
| **OPERACIÓN DIARIA** | | | | |
| Mensajería chofer ↔ base | ✅ | ✅ | ✅ | ✅ |
| Incidentes: reporte desde la app | ✅ | ✅ | ✅ | ✅ |
| Tablero kanban en vivo, responsables, timeline | — | ✅ | ✅ | ✅ |
| Adjuntos de audio y video en incidentes | — | ✅ | ✅ | ✅ |
| Motor de alertas automáticas | 3 reglas | 10 reglas | Ilimitadas | Ilimitadas |
| Umbrales de alerta personalizables | — | — | ✅ | ✅ |
| **COMPLIANCE** | | | | |
| Planillas OEA (7 puntos AFIP + precintos) | — | ✅ | ✅ | ✅ |
| Firma digital en planillas e inspecciones | ✅ | ✅ | ✅ | ✅ |
| Rol Auditor y trazabilidad de cambios | — | — | ✅ | ✅ |
| **PERSONAL (RRHH)** | | | | |
| Perfil operativo del chofer | ✅ | ✅ | ✅ | ✅ |
| Legajo completo del empleado | — | Básico | ✅ | ✅ |
| Permisos y habilitaciones con vencimiento | — | ✅ | ✅ | ✅ |
| **Historial laboral y estados automáticos** | — | — | ✅ | ✅ |
| Bloqueo de asignación por licencia/suspensión | — | — | ✅ | ✅ |
| Panel "Fuera de servicio hoy" | — | — | ✅ | ✅ |
| **INTELIGENCIA DE NEGOCIO** | | | | |
| Panel de inicio | Resumen | ✅ | ✅ | ✅ |
| **Indicadores gerenciales completos** | — | — | ✅ | ✅ |
| Costo por km · Costos extraordinarios | — | — | ✅ | ✅ |
| Disponibilidad de flota · Tiempo de resolución | — | — | ✅ | ✅ |
| Filtros por flota / camión / chofer | — | — | ✅ | ✅ |
| Exportación de todos los reportes | — | Parcial | ✅ | ✅ |
| Reportes programados por email ⏳ | — | — | ✅ | ✅ |
| **PLATAFORMA** | | | | |
| Multi-empresa / multi-sucursal ⏳ | — | — | — | ✅ |
| Consolidación de grupo ⏳ | — | — | — | ✅ |
| API REST + Webhooks ⏳ | — | — | Add-on | ✅ |
| SSO / Active Directory ⏳ | — | — | — | ✅ |
| Ambiente de prueba (sandbox) ⏳ | — | — | — | ✅ |
| **LÍMITES Y SOPORTE** | | | | |
| Retención de histórico | 6 meses | 24 meses | 60 meses | Ilimitada |
| Almacenamiento de adjuntos | 2 GB | 50 GB | 250 GB | Ilimitado |
| Soporte | Email, 48h | Prioritario, 24h | SLA 8h hábiles | 24/7, SLA 99,5% |
| Customer Success | — | — | Revisión trimestral | CSM dedicado |

> **⏳ = vendido en la matriz, todavía no construido.** El gating de esas filas ya
> existe —la feature está declarada y el plan la trae—, pero **detrás no hay
> funcionalidad**: `scheduled_reports` no envía ningún reporte y las capacidades de
> plataforma (multi-empresa, API pública, SSO, sandbox) son la **fase 10**, que
> está postergada a propósito hasta que haya demanda real. **Consecuencia
> comercial: Corporate no es vendible hoy** salvo como contrato a futuro con fecha
> comprometida. Todo el resto de la matriz está implementado y verificado contra
> la API.

### 4.2 Las cinco funcionalidades que nunca se regalan

Estas son las que sostienen el precio. Si aparecen en el plan de entrada, el modelo
comercial completo se derrumba.

| # | Funcionalidad | Por qué nunca va en Control |
|---|---|---|
| 1 | **Rendiciones automáticas** | Es *la* razón por la que un dueño de flota paga. Todos los meses hay una discusión con el chofer por la plata. Resolverla vale más que todo el resto del producto junto. |
| 2 | **Indicadores gerenciales (costo/km)** | Es el número que el dueño no tiene y que ningún Excel le da bien. Es el argumento de venta de Gestión y el único que justifica saltar de $ 129.000 a $ 249.000 de abono. |
| 3 | **RRHH: historial laboral y estados automáticos** | Es el módulo con mayor costo de reemplazo y mayor *data gravity*. Un cliente con 3 años de legajos cargados no se va nunca. |
| 4 | **Retención de histórico e integraciones** | El histórico es lo que convierte al software en el sistema de registro de la empresa. Regalarlo es regalar el switching cost. |
| 5 | **API y multi-empresa** | Son capacidades de plataforma. Su valor es proporcional al tamaño del cliente, así que deben cobrarse donde ese tamaño existe. |

### 4.3 Las funcionalidades que más valor perciben (y cómo usarlas en la venta)

Ordenadas por impacto en la demo. Estas son las que hacen que el cliente diga "esto lo
necesito":

| Funcionalidad | Demo que la vende | Plan donde vive |
|---|---|---|
| **App del chofer offline con foto del ticket** | Poner el celular en modo avión, cargar un gasto, volver a conectar y verlo aparecer en el backoffice | Control (gancho) |
| **Alerta de vencimiento de documentos** | Mostrar la campanita con "VTV del interno 14 vence en 12 días" | Control (gancho) |
| **Rendición automática** | Generar una rendición de un viaje con 9 movimientos en 4 segundos y descargar el PDF | **Operación (conversión)** |
| **Tablero de combustible km/l por chofer** | Mostrar dos choferes con el mismo camión y 18% de diferencia de rendimiento | **Operación (conversión)** |
| **Costo por kilómetro** | Un solo KPI: "tu costo es $ X por km; el mes pasado fue $ Y" | **Gestión (upsell)** |
| **Bandeja de alertas priorizada** | Comparar con una captura de un grupo de WhatsApp de 400 mensajes | Operación |
| **Planilla OEA firmada** | Mostrar el PDF firmado listo para una inspección | Operación |

**Regla de la demo**: los ganchos de Control se muestran en los primeros 5 minutos;
los de conversión, entre el minuto 5 y el 15; el costo por kilómetro se muestra
**siempre**, incluso si el cliente va a comprar Operación — es lo que siembra el
upgrade a Gestión seis meses después.

---

## 5. Servicios adicionales (Add-ons)

### 5.1 Principio rector

> **Todo lo que tiene costo marginal real se cobra aparte, siempre, en todos los
> planes — incluido Corporate.**

GPS/telemetría (tráfico de datos), IA (tokens de modelo) y almacenamiento extra
(S3) tienen COGS del 35-45%. Incluirlos en un plan destruye el margen bruto de forma
invisible y no recuperable. Se venden como add-on con precio propio.

### 5.2 Add-ons recurrentes

| Add-on | Precio mensual | Disponible en | En Corporate |
|---|---|---|---|
| **Integración GPS / telemetría** | $ 4.900 por vehículo conectado | Operación+ | Add-on (1ª integración incluida) |
| **Integración ERP / contable** (Tango, Bejerman, SAP, Xubio, Colppy) | $ 89.000 + setup | Gestión+ | ✅ Incluida (1 sistema) |
| **API REST + Webhooks** | $ 119.000 | Gestión | ✅ Incluida |
| **FleetLog IA** — OCR de tickets, resumen de viaje, detección de gastos anómalos, consultas en lenguaje natural | $ 149.000 + $ 1.900 por vehículo | Operación+ | Add-on |
| **Soporte Premium** — SLA 4h, canal directo, 24/7 | $ 179.000 | Todos | ✅ Incluido |
| **Portal del dador de carga** — seguimiento de carga para el cliente final | $ 129.000 | Gestión+ | Add-on |
| **Reportes personalizados / BI** — dataset y conector Power BI | $ 99.000 | Gestión+ | Add-on |
| **Paquete de automatizaciones avanzadas** | $ 69.000 | Operación | ✅ Incluido |
| **Marca blanca** — logo, colores y dominio propio | $ 149.000 | Gestión+ | Add-on |
| **Almacenamiento adicional** | $ 5.900 (hasta 10 GB)<br>$ 24.900 (hasta 50 GB) | Todos | No aplica |

**Estado del catálogo.** Los 15 add-ons —los diez de arriba más los servicios
profesionales del §5.3— **están cargados con estos precios** y se contratan y
facturan por sistema: alta con prorrateo inmediato y baja diferida a la
renovación. Ahora bien, **facturable no es lo mismo que entregable**:

| Add-on | Qué hace hoy el sistema |
|---|---|
| **Almacenamiento** (10/50 GB) | ✅ Completo: levanta el tope real de la cuenta. |
| **Automatizaciones avanzadas** | ✅ Habilita los umbrales de alerta personalizables en Operación. |
| **Soporte Premium** | ✅ Es un servicio humano: el sistema solo lo factura. |
| **API REST + Webhooks** ⏳ | Habilita la feature, pero **la API pública no existe** (fase 10). |
| **Reportes / BI** ⏳ | Habilita `scheduled_reports`, que **no envía nada** todavía. |
| **Marca blanca** ⏳ | La feature se activa; **no hay logo, colores ni dominio propio** detrás. |
| **GPS · IA · ERP · Portal del dador de carga** ⏳ | **Sin desarrollo**: son integraciones a construir. Vender uno es comprometer un desarrollo. |

### 5.3 Servicios profesionales (pago único)

No escalan, pero **financian el CAC y aumentan brutalmente la retención**: un cliente
que pagó una migración no se va a los 6 meses.

| Servicio | Precio | Cuándo se vende |
|---|---|---|
| **Implementación / Onboarding** | Según plan (§3.2) | Obligatorio, en el alta |
| **Migración de datos** desde Excel o sistema anterior | desde $ 690.000 | Alta, si hay historia previa |
| **Capacitación adicional on-site** | $ 290.000 por jornada | Alta o post-venta |
| **Consultoría de procesos / diagnóstico de flota** | desde $ 1.200.000 | Cuentas de 30+ unidades |
| **Reporte a medida** | desde $ 490.000 | Post-venta, Gestión+ |
| **Integración a medida** | Cotizada (scoping pago previo de $ 350.000) | Corporate |

> En el catálogo del sistema están cargados los cuatro primeros. **Reporte a
> medida** e **integración a medida** se cotizan caso por caso y se facturan a
> mano, que es lo correcto: no tienen precio de lista.

> **Regla de oro para integraciones a medida**: nunca cotizar sin un *scoping* pago
> previo. Es el error que convierte a un SaaS en una consultora — exactamente lo que
> este modelo busca evitar.

### 5.4 Qué va incluido en Corporate y qué no

**Incluido** (son capacidades de plataforma, sin costo marginal): API, Webhooks, SSO,
soporte premium, automatizaciones ilimitadas, almacenamiento ilimitado, sandbox, una
integración ERP.

**No incluido, nunca** (tienen costo marginal): GPS por vehículo, IA, portal del dador
de carga, integraciones adicionales, servicios profesionales.

Esta distinción es lo que permite que Corporate tenga un precio por vehículo bajo sin
perder margen: lo caro se cobra aparte.

---

## 6. Estrategia de upgrades

### 6.1 El trial ancla arriba, no abajo

**Todo prospecto arranca con 21 días de plan Operación completo**, no de Control.

Razón: el efecto dotación. Un cliente que durante tres semanas usó rendiciones
automáticas y el tablero de combustible, y después tiene que elegir, no compara
Control contra nada — compara Control contra *lo que ya tenía*. La tasa de conversión
directa a Operación sube fuerte, y quien no convierte cae naturalmente a Control en
lugar de irse.

> **Implementado tal cual.** Toda alta pública nace con 21 días de Operación
> (`DIAS_DE_TRIAL = 21`, `PLAN_DE_TRIAL = 'operacion'`). Hay avisos por email a los
> 7, 3 y 1 día del vencimiento, y **3 días de gracia** antes de suspender la
> cuenta. Los datos no se borran: activar un plan los devuelve.

### 6.2 Paywalls visibles, no invisibles

El módulo no disponible **no se oculta**: se muestra en el menú, en gris, con un
candado y un enlace "Ver qué incluye". El cliente ve todos los días lo que le falta.

```
  Flota
  ├── Flota
  ├── Mantenimiento
  ├── Combustible
  └── Documentos

  Administración
  ├── 🔒 Rendiciones          ← visible, gris, clicable
  └── 🔒 Planillas OEA
```

Al hacer clic, no aparece un formulario de contacto: aparece **una pantalla del módulo
con datos de ejemplo del propio cliente** (sus camiones, sus choferes) y un botón
"Activar en mi cuenta". La fricción de upgrade debe ser menor que la de abrir WhatsApp.

> **Implementado a medias, y la mitad que falta es la que convierte.** El candado
> visible sí está: el ítem bloqueado se muestra al 45 % de opacidad y lleva a
> `/upgrade/<feature>`. Pero esa pantalla **explica** qué incluye el módulo y con
> qué plan viene; **no muestra el módulo con los datos del cliente**. Es la
> diferencia entre un folleto y una demo, y era el punto del diseño. Queda como
> mejora pendiente de mayor impacto comercial.

### 6.3 Disparadores automáticos de upgrade ⏳

**Nada de esta sección está implementado.** El sistema tiene los datos para
detectarlos —viajes, documentos vencidos, aperturas de pantalla, vehículos,
empleados— pero **no hay telemetría de producto ni avisos in-app**: hoy los
disparadores se detectan a mano mirando el panel de superadmin. Es la palanca de
expansión más barata que queda sin construir.

Cada uno debería disparar un aviso in-app y una tarea comercial:

| Disparador | Señal | Oferta |
|---|---|---|
| Cliente Control supera 10 documentos vencidos en un mes | Está usando el producto para compliance | Operación: "además, los gastos se rinden solos" |
| Cliente Control carga >30 viajes/mes | Operación intensa sin control de dinero | Operación |
| Cliente Operación abre Indicadores 3 veces en 30 días | Busca el número que no tiene | Gestión |
| Cliente Operación supera 20 vehículos | Cruzó el umbral de complejidad | Gestión (con la caída del costo efectivo por camión como argumento) |
| Cliente Operación carga >15 empleados en RRHH básico | Necesita historial laboral | Gestión |
| Cliente Gestión con >2 CUIT en el mismo grupo | Multi-empresa | Corporate |
| Cualquier cliente que agrega 5+ vehículos en un trimestre | Está creciendo | Contacto proactivo del CSM |

### 6.4 Fricción asimétrica

| Movimiento | Regla |
|---|---|
| **Upgrade** | Inmediato, prorrateado automáticamente. Solo se cobra la **diferencia** de implementación, nunca el onboarding completo de nuevo. Cero llamadas comerciales necesarias. |
| **Agregar vehículos** | Inmediato, prorrateado. Autoservicio. |
| **Add-on** | Inmediato, autoservicio (excepto integraciones a medida). |
| **Downgrade** | Solo efectivo en la renovación del período. Con aviso explícito de qué se pierde (histórico, módulos, reglas activas). |
| **Quitar vehículos** | Solo en la renovación mensual. Se ofrece **modo inactivo** primero. |

Esta asimetría es estándar en SaaS y perfectamente defendible: subir es gratis y
al instante; bajar requiere esperar al ciclo.

> **Implementado, con una decisión que el diseño no había previsto.** El upgrade
> emite un cargo prorrateado en el acto; el downgrade queda agendado a la
> renovación y no factura nada al pedirse. Lo que se resolvió después: un
> downgrade que deja a la empresa **por encima de un límite** (8 reglas de alerta
> activas en un plan de 3) **no borra nada** — apaga el excedente por antigüedad y
> pausa lo que sobra, dejando constancia en el histórico comercial. Subir de plan
> lo devuelve intacto.
>
> **Autoservicio hasta donde llega el cobro**: el cambio de plan y el alta/baja de
> add-ons son por API; el pago es por Mercado Pago (link por período o débito
> automático). **Sin factura AFIP**: el sistema registra el pago, no emite el
> comprobante fiscal.

### 6.5 El camino de vida del cliente

```
 Mes 0      Mes 6            Mes 14           Mes 24          Mes 36
   │          │                │                │               │
 CONTROL → OPERACIÓN  →  OPERACIÓN+GPS  →   GESTIÓN    →  GESTIÓN + IA + ERP
 5 veh      8 veh           12 veh           18 veh          26 veh
$ 98.500   $ 232.200       $ 342.600        $ 589.200      $ 1.027.800

                    ARPU × 10,4 en tres años
```

Ninguno de esos saltos requiere que el cliente cambie de proveedor, migre datos ni
vuelva a capacitar a nadie. **Ese es el activo del modelo.**

---

## 7. Estrategia de pricing

### 7.1 Metodología de anclaje

El precio no sale del costo ni de la competencia: sale del **valor operativo del
vehículo**.

Un camión de larga distancia en Argentina mueve un costo operativo del orden de
USD 6.000 – 10.000 por mes (combustible, chofer, cubiertas, mantenimiento, peajes,
seguro). El plan Operación cuesta el equivalente a **USD 12 – 16 por vehículo/mes**:

```
Costo de FleetLog / Costo operativo del camión  ≈  0,15% – 0,25%
```

**Referencia local de mercado**: un proveedor argentino de radar y control de
combustible cobra hoy del orden de **$ 25.000 por camión/mes** — por una solución
mucho más acotada, con hardware y sin gestión de viajes, rendiciones ni RRHH.
Operación queda en **$ 23.650 por camión todo incluido en una flota de 12
unidades**: por debajo de ese punto de referencia, con un alcance funcional varias
veces mayor. Es el mejor anclaje disponible para la conversación de precio, porque
el cliente ya lo tiene en la cabeza.

Con eso, el argumento de venta se reduce a una frase:

> *"Si el sistema te ahorra medio punto de combustible, o evita una sola multa de
> CNRT al año, o recupera un adelanto mal rendido por trimestre, ya se pagó tres
> veces."*

Y es cierto: un solo litro cada 100 km de mejora en una flota de 12 camiones que
recorren 12.000 km/mes al precio actual del gasoil supera holgadamente el abono
mensual completo.

### 7.2 Precio por vehículo — tarifa plana, sin escalones

**Decisión: una sola tarifa por vehículo por plan, igual para todas las flotas.**
Sin tramos, sin tabla de porcentajes, sin cálculo marginal.

El razonamiento es que **el abono base ya produce la compresión por volumen**. Al ser
un monto fijo repartido entre más unidades, el precio efectivo por vehículo cae solo:

| Flota | Operación · efectivo por vehículo | Gestión · efectivo por vehículo |
|---|---|---|
| 5 unidades | $ 38.700 | — |
| 10 unidades | $ 25.800 | $ 43.800 |
| 15 unidades | $ 21.500 | $ 35.500 |
| 25 unidades | $ 18.060 | $ 28.860 |
| 50 unidades | $ 15.480 | $ 23.880 |
| 80 unidades | $ 14.513 | $ 22.013 |

```
Operación: de $ 38.700 a $ 14.513 por camión   →   −62% sin ninguna tabla de tramos
Gestión:   de $ 43.800 a $ 22.013 por camión   →   −50%
```

**Ejemplo — Gestión con 80 vehículos:**

```
 Abono base Gestión:        $   249.000
 80 vehículos × $ 18.900:   $ 1.512.000
                            ───────────
 TOTAL:                     $ 1.761.000/mes   →   $ 22.013 por vehículo
```

Ventajas de eliminar los escalones:

- **Se cotiza de memoria.** Abono + (unidades × tarifa). No hay que abrir una planilla
  frente al cliente ni explicar qué es un tramo marginal.
- **El motor de facturación es trivial.** Sin lógica de tramos, sin prorrateos por
  cruce de escalón a mitad de mes, sin casos borde cuando un vehículo pasa a modo
  inactivo. Menos código y menos disputas de facturación.
- **No hay efecto acantilado ni percepción de castigo.** Con tramos, el cliente que
  está en 24 unidades siente que le conviene esperar; con tarifa plana, agregar la
  unidad 25 cuesta exactamente lo mismo que la unidad 3.
- **Protege el ingreso en cuentas grandes.** Una flota de 80 unidades factura
  $ 1.761.000 en lugar de $ 1.661.550 — casi $ 100.000 más por mes, sin resistencia
  real de compra dado el punto de referencia del mercado (§7.1).

> El descuento por tamaño no desaparece: se traslada a la **negociación de Corporate**,
> donde se otorga a cambio de algo concreto (contrato de 24-36 meses), en vez de
> regalarse automáticamente por tabla.

### 7.3 Cómo evitar que el precio explote en flotas grandes

Tres mecanismos, ninguno de ellos una tabla de tramos:

1. **La dilución del abono base** (§7.2). Es automática, invisible y suficiente para el
   rango de 5 a 100 unidades, que cubre a la enorme mayoría del mercado argentino.
2. **Salto obligatorio a Corporate a partir de 100 vehículos.** Precio por vehículo
   **plano negociado** (desde $ 10.900, típicamente 25-35% por debajo de la lista de
   Gestión) más un **tope de facturación mensual** acordado. El cliente gana
   predecibilidad; FleetLog gana un contrato de 24-36 meses. El descuento se **cambia
   por compromiso**, que es como debe otorgarse.
3. **Prepago anual o bianual** (−15% / −22%), disponible para cualquier tamaño.

Verificación del rango: incluso sin ningún descuento negociado, Gestión con 100
unidades da $ 2.139.000/mes, o **$ 21.390 por camión** — por debajo del punto de
referencia de mercado de $ 25.000. El precio no explota.

### 7.4 Descuentos: qué se permite y qué no

| Palanca | Descuento | Condición | Impacto |
|---|---|---|---|
| **Prepago anual** | **−15%** sobre la suscripción | Pago adelantado 12 meses | Caja + churn −40% |
| **Prepago bianual** | **−22%** | 24 meses | Solo Gestión y Corporate |
| **Bonificación de implementación** | Hasta 100% | A cambio de contrato anual firmado | Palanca principal de cierre |
| **Descuento sobre el precio por vehículo** | ❌ **Nunca** | — | Rompe la escala y sienta precedente |
| **Descuento sobre el abono base** | ❌ **Nunca** | — | Es el precio del valor funcional |
| **Módulo de plan superior "de regalo"** | ❌ **Nunca** | — | Destruye toda la escalera de upgrade |

> El vendedor tiene **una sola** palanca de negociación: la implementación. Es
> suficiente para cerrar, no toca el recurrente, y convierte un descuento en un
> compromiso anual. Todo lo demás requiere aprobación de dirección.

### 7.5 Indexación — el punto crítico en Argentina

Ningún precio en pesos sobrevive doce meses. Política recomendada:

| Segmento | Mecanismo |
|---|---|
| **Control y Operación** | Precios de lista en ARS, **revisión trimestral** (enero, abril, julio, octubre). Contratos con cláusula de ajuste automático por IPC INDEC del trimestre, notificado con 30 días. |
| **Gestión** | Igual, con **tope de ajuste anual acordado** como argumento de venta ("tu precio no sube más de X% al año"). |
| **Corporate** | **Precio nominado en USD, facturado en ARS al tipo de cambio oficial del día de emisión.** Protege el margen íntegramente y es la práctica aceptada en cuentas grandes. |

**Nunca** firmar un contrato anual en pesos con precio congelado. Es el error que más
márgenes ha destruido en el SaaS argentino.

### 7.6 Estructura de márgenes objetivo

| Concepto | % sobre MRR | Nota |
|---|---|---|
| Infraestructura (cómputo, base de datos) | 6 – 8% | Multi-tenant, escala bien |
| Almacenamiento y CDN | 3 – 5% | Fotos y videos de incidentes: el costo variable oculto. Controlado con límites por plan. |
| Soporte L1 + L2 | 6 – 9% | El abono base es lo que lo financia |
| **Margen bruto objetivo** | **80 – 85%** | Rango sano de SaaS B2B vertical |
| COGS de add-ons IA / GPS | 35 – 45% del add-on | Por eso van con precio propio |

**Alerta de margen**: el almacenamiento es el riesgo silencioso. Un cliente con
incidentes videofilmados puede consumir 200 GB en un año. Los límites por plan
(2 / 50 / 250 GB) y el add-on de GB no son burocracia: son protección de margen.

### 7.7 Almacenamiento: por qué se cobra por capacidad y no subiendo de plan

El costo de S3 es proporcional a los **GB**, no a las funcionalidades. Obligar a
un cliente a saltar de Control a Operación porque se le llenó el espacio le
vende módulos que no pidió y no resuelve el problema de fondo. Por eso la
capacidad se amplía con un add-on de **dos escalones fijos**:

| Escalón | Capacidad total | Precio mensual |
|---|---|---|
| Sin add-on | La del plan (2 / 50 / 250 GB) | — |
| **Ampliación 1** | **10 GB** | **$ 5.900** |
| **Ampliación 2** | **50 GB** | **$ 24.900** |

Es un **techo**, no un incremento: el tope efectivo es el mayor entre lo que trae
el plan y el escalón contratado, así que contratar 10 GB en un plan que ya trae
50 nunca degrada la capacidad. **Así está implementado**, y cuando la cuenta llega
al tope el rechazo de la subida ofrece el escalón siguiente.

**Dos escalones y no GB a medida** porque un tope cerrado se cotiza de memoria,
se factura sin prorrateos raros y evita discutir cuántos GB necesita el cliente.

#### Verificación del margen

> ⚠️ **Los costos de abajo son una estimación, no un dato verificado.** No se
> pudo confirmar la tarifa de `sa-east-1` en la página pública de AWS; hay que
> validarla en la **AWS Pricing Calculator** antes de fijar estos precios.

Estimación de costo todo incluido (S3 Standard en San Pablo + egreso, asumiendo
que se consulta ~20% de lo almacenado por mes): **≈ $ 110 – 150 por GB/mes**.

| Escalón | GB sobre el plan Control | Costo estimado | Precio | Margen |
|---|---:|---:|---:|---:|
| Ampliación 1 | 8 GB | $ 880 – 1.200 | $ 5.900 | **80 – 85 %** |
| Ampliación 2 | 48 GB | $ 5.280 – 7.200 | $ 24.900 | **71 – 79 %** |

> El precio anterior del add-on ($ 19.000 por 50 GB = $ 380/GB) quedaba por
> debajo del objetivo de margen del §7.6 y, además, era **invendible a un cliente
> de Control**: nadie que necesita 3 GB compra 50.

#### Dos palancas que bajan el costo real

1. **Archivado en frío alineado con la retención.** La retención ya define una
   frontera: pasados los 6/24/60 meses el dato **no se muestra** (decisión D4 del
   plan de conversión). Por definición, eso es dato que no se lee — el candidato
   perfecto para una política de ciclo de vida a S3 Glacier, que recorta el costo
   de almacenamiento entre 60 % y 80 %. **La ventana de retención y la de
   archivado deberían ser la misma frontera.**
2. **Compresión en origen.** Ya se comprimen las imágenes al subirlas. El video
   de incidentes, que es lo que realmente hace volar el consumo, todavía no.

#### Riesgo cambiario

El costo de S3 está **100 % dolarizado** y el add-on se cobra en pesos. Es el
único componente del modelo cuyo margen se erosiona con cada devaluación sin que
nada lo compense. Recomendación: **nominar el add-on de almacenamiento en USD**
—facturado en pesos al tipo de cambio del día, como Corporate (§7.5)— o, como
mínimo, revisarlo en cada ajuste trimestral junto con el tipo de cambio y no sólo
por IPC.

---

## 8. Benchmark internacional

### 8.1 Comparativa

| Plataforma | Modelo | Precio por vehículo/mes (USD) | Usuarios | Contrato | Hardware |
|---|---|---|---|---|---|
| **Fleetio** | SaaS puro, 3 tiers por módulo | **$ 4 / $ 7 / $ 10** | Ilimitados | Anual (tiers altos) | No |
| **Motive** | Hardware + SaaS, ELD compliance | ~$ 20 – 35 | Ilimitados | 12 – 36 meses | Sí, obligatorio |
| **Samsara** | Hardware + SaaS, enterprise | **$ 27 – 33** base; **$ 40 – 60** real | Ilimitados | **36 meses mínimo** | $ 99 – 148/unidad |
| **Verizon Connect** | Telemática, venta directa | ~$ 20 – 40 | Ilimitados | Largos, rígidos | Sí |
| **Geotab** | Canal de partners, 4 tiers de capacidad | ~$ 10 – 45 según tier | Ilimitados | Variable por partner | Sí (GO device) |
| **Linxup** | GPS low-cost, autoservicio | ~$ 15 – 25 | Ilimitados | **Sin contrato** | Sí |
| **FleetLog** | **SaaS puro, abono + vehículo plano, 4 tiers** | **~$ 9 – 20** equivalente | **Ilimitados** | Mensual → 36 meses | **No** |

**Referencia local**: un proveedor argentino de radar y control de combustible cobra
del orden de **$ 25.000 (≈ USD 16,5) por camión/mes** por una solución con hardware,
sin gestión de viajes, rendiciones ni RRHH. Es el precio contra el que el cliente
argentino compara en la práctica — más relevante que cualquiera de los seis
referentes internacionales.

### 8.2 Qué copiar de cada uno

| De | Estrategia | Aplicación en FleetLog |
|---|---|---|
| **Fleetio** | Usuarios ilimitados + precio por vehículo **público en la web** + tiers definidos por módulo, no por límites arbitrarios | Adoptar íntegro. Publicar precios es la mayor ventaja competitiva en un mercado donde todos cotizan "a consultar". |
| **Geotab** | Tiers nombrados por **capacidad progresiva**, donde cada escalón agrega un dominio funcional completo | Es exactamente la lógica Control → Operación → Gestión → Corporate. |
| **Samsara / Motive** | El hardware es el ancla de retención: el cliente no se va porque tiene equipos instalados | FleetLog **no tiene hardware**. Hay que reemplazar ese ancla con: implementación paga + *data gravity* (histórico, legajos, rendiciones) + contrato anual. **Este es el punto estratégico más importante del documento.** |
| **Linxup** | Autoservicio sin contrato, ciclo de venta corto | Aplicar al plan **Control**: alta con tarjeta, sin llamada comercial, sin contrato. Es el motor de volumen. |
| **Verizon Connect** | ⚠️ **Qué NO copiar**: contratos rígidos, precios opacos, penalidades de salida | En la PyME argentina, la opacidad y la letra chica matan la venta. FleetLog debe ser lo opuesto. |
| **Todos** | **Ninguno cobra por chofer o por usuario.** El vehículo es la unidad universal de la industria. | Confirma que la decisión de "choferes ilimitados" no es una concesión: es el estándar del sector. |

### 8.3 El espacio en blanco que ocupa FleetLog

Ninguno de los seis referentes resuelve tres cosas que en Argentina son obligatorias:

1. **Rendición de gastos y adelantos del chofer.** Fleetio no lo tiene. Samsara no lo
   tiene. Es un problema cultural del transporte latinoamericano, y es donde más plata
   se pierde.
2. **Legajo con habilitaciones argentinas** — LiNTI, CNRT, psicofísico, carga
   peligrosa — con vencimientos y bloqueo de asignación.
3. **Planilla OEA / 7 puntos AFIP** firmada digitalmente.

Eso justifica que FleetLog cobre **por encima de Fleetio** (que en producto crudo tiene
más años de desarrollo) y **muy por debajo de Samsara** (que exige hardware y 36 meses).
La posición es: *"más completo que el barato, sin el compromiso del caro, y hecho para
cómo se trabaja acá"*.

---

## 9. Simulación de ingresos

### 9.1 Cinco clientes tipo

#### A — Fletero familiar · 4 camiones · Control · prepago anual

| Concepto | Mensual |
|---|---|
| Abono base Control | $ 59.000 |
| 4 vehículos × $ 7.900 | $ 31.600 |
| **Total mensual** | **$ 90.600** (≈ USD 60) |
| Por vehículo | $ 22.650 (≈ USD 14,9) |

**Año 1**: $ 924.120 (anual con −15%) + $ 290.000 implementación = **$ 1.214.120** (≈ USD 799)

---

#### B — PyME de transporte · 12 camiones · Operación

| Concepto | Mensual |
|---|---|
| Abono base Operación | $ 129.000 |
| 12 vehículos × $ 12.900 | $ 154.800 |
| **Total mensual** | **$ 283.800** (≈ USD 187) |
| Por vehículo | $ 23.650 (≈ USD 15,6) |

**Año 1**: $ 3.405.600 + $ 590.000 implementación = **$ 3.995.600** (≈ USD 2.629)

> Este es el cliente de referencia del modelo. Su costo por camión —$ 23.650 todo
> incluido— queda **por debajo de los $ 25.000 que cobra un proveedor local de radar
> y control de combustible**, con un alcance funcional incomparablemente mayor.

---

#### C — Empresa consolidada · 30 camiones · Gestión + GPS

| Concepto | Mensual |
|---|---|
| Abono base Gestión | $ 249.000 |
| 30 vehículos × $ 18.900 | $ 567.000 |
| Add-on GPS: 30 × $ 4.900 | $ 147.000 |
| **Total mensual** | **$ 963.000** (≈ USD 634) |
| Por vehículo, todo incluido | $ 32.100 (≈ USD 21,1) |

**ARR**: $ 11.556.000 (≈ USD 7.603)

---

#### D — Flota grande · 80 camiones · Gestión + ERP + IA + API + Soporte Premium

| Concepto | Mensual |
|---|---|
| Abono base Gestión | $ 249.000 |
| 80 vehículos × $ 18.900 | $ 1.512.000 |
| Integración ERP | $ 89.000 |
| FleetLog IA ($ 149.000 + 80 × $ 1.900) | $ 301.000 |
| API + Webhooks | $ 119.000 |
| Soporte Premium | $ 179.000 |
| **Total mensual** | **$ 2.449.000** (≈ USD 1.611) |
| Por vehículo | $ 30.613 (≈ USD 20,1) |

**ARR**: $ 29.388.000 (≈ USD 19.334) · **Add-ons = 28% de la factura**

---

#### E — Grupo multi-empresa · 250 unidades · 3 CUIT · Corporate + GPS + IA

| Concepto | Mensual |
|---|---|
| Abono base Corporate | $ 490.000 |
| 250 vehículos × $ 10.900 (plano negociado) | $ 2.725.000 |
| GPS 250 unidades (−30% por volumen) | $ 857.500 |
| FleetLog IA (con descuento de volumen) | $ 481.500 |
| **Total mensual** | **$ 4.554.000** (≈ USD 2.996) |
| Por vehículo | $ 18.216 (≈ USD 12,0) |

**ARR**: $ 54.648.000 (≈ USD 35.953) · Implementación: $ 4.500.000

---

### 9.2 Cartera objetivo a 36 meses

| Segmento | Clientes | ARPU mensual | MRR |
|---|---:|---:|---:|
| Control (fleteros, 3-8 unidades) | 120 | $ 104.000 | $ 12.480.000 |
| Operación (PyME, 8-25 unidades) | 110 | $ 295.000 | $ 32.450.000 |
| Gestión (25-80 unidades) | 55 | $ 900.000 | $ 49.500.000 |
| Corporate (100+ unidades) | 15 | $ 2.400.000 | $ 36.000.000 |
| **TOTAL** | **300** | **$ 434.767** | **$ 130.430.000** |

```
MRR   =  ARS 130.430.000   ≈  USD  85.809
ARR   =  ARS 1.565.160.000 ≈  USD 1.029.711
```

> **300 clientes = USD 1M de ARR.** Es la métrica que hay que memorizar: define el
> tamaño de la fuerza comercial, el objetivo de captación mensual (~9 clientes netos)
> y la conversación con cualquier inversor.

A eso se suman los **servicios profesionales**: con 300 cuentas activas y ~110 altas
anuales en régimen, la implementación y migraciones aportan del orden de
ARS 90 – 120M anuales adicionales (≈ USD 60.000 – 79.000), no recurrentes pero
suficientes para financiar buena parte del equipo de onboarding.

### 9.3 Curva de crecimiento

| | Año 1 | Año 2 | Año 3 |
|---|---:|---:|---:|
| Clientes activos | 45 | 140 | 300 |
| Mix dominante | Control / Operación | Operación | Operación / Gestión |
| ARPU mensual | $ 255.000 | $ 358.000 | $ 434.767 |
| **MRR** | **$ 11,5 M** | **$ 50,1 M** | **$ 130,4 M** |
| **ARR (USD)** | ~USD 91 K | ~USD 396 K | ~USD 1,03 M |
| NRR | — | ~112% | ~118% |

El ARPU crece 70% en tres años **sin subir un solo precio de lista**: crece por mix de
planes, crecimiento de flota de los clientes existentes y attach de add-ons.

### 9.4 Unit economics por segmento

Margen bruto asumido: 82%. LTV limitado a 60 meses para presentación conservadora.

| Segmento | ARPU | Churn mensual | LTV | CAC objetivo | **LTV/CAC** | Payback |
|---|---:|---:|---:|---:|---:|---:|
| Control | $ 104.000 | 2,5% | ≈ USD 2.244 | USD 400 | **5,6×** | ~7 meses |
| Operación | $ 295.000 | 1,3% | ≈ USD 9.549 | USD 1.800 | **5,3×** | ~11 meses |
| Gestión | $ 900.000 | 0,8% | ≈ USD 29.132 | USD 5.000 | **5,8×** | ~10 meses |
| Corporate | $ 2.400.000 | 0,4% | ≈ USD 77.684 | USD 15.000 | **5,2×** | ~12 meses |

Los cuatro segmentos convergen en LTV/CAC ≈ 5,5× y payback ≈ 10 meses. Esa
consistencia es deliberada: significa que **conviene vender los cuatro planes**, y que
el equipo comercial puede optimizar por volumen sin destruir la economía del negocio.
El pago de implementación reduce el payback real entre 1 y 3 meses adicionales.

---

## 10. Ventajas y desventajas del modelo

### 10.1 Ventajas

| # | Ventaja | Por qué importa |
|---|---|---|
| 1 | **Se cotiza con dos números y una multiplicación** | "Abono + (camiones × tarifa)". Sin tramos, sin planilla, sin explicar qué es un escalón marginal. Un vendedor lo hace de memoria frente al cliente y este lo verifica en su cabeza. Esto solo ya acorta el ciclo de venta. |
| 2 | **La adopción no tiene costo** | Choferes y usuarios ilimitados: nadie tiene que pedir permiso para sumar gente. La adopción total es la mejor defensa contra el churn. |
| 3 | **Ingreso alineado al crecimiento del cliente** | Si el cliente compra camiones, FleetLog factura más automáticamente. Expansión sin esfuerzo comercial. |
| 4 | **Cuatro vectores de expansión independientes** | Plan, vehículos, add-ons y servicios. Si uno se estanca, los otros tres siguen. |
| 5 | **Margen bruto protegido por diseño** | Lo que tiene costo marginal (IA, GPS, storage) nunca entra en un plan. |
| 6 | **Sin hardware** | Cero capital de trabajo, cero logística, cero inventario, márgenes de software puro y despliegue en días en vez de semanas. |
| 7 | **Data gravity creciente** | A los 24 meses el cliente tiene su histórico de rendiciones, legajos y documentos adentro. El costo de irse es prohibitivo. |
| 8 | **Precio público como diferencial** | En un mercado donde todos dicen "a consultar", publicar precios genera confianza y filtra prospectos antes de la primera llamada. |

### 10.2 Desventajas y su mitigación

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | **El vehículo no siempre correlaciona con el uso.** Cinco camiones que hacen 40 viajes/mes valen mucho más que cinco que hacen 4. | El abono base absorbe parte del desvío. Si el patrón se vuelve sistemático, agregar un add-on de "alto volumen operativo" (>25 viajes por vehículo/mes) en lugar de cambiar el modelo. |
| 2 | **Flotas estacionales dan de baja unidades en temporada baja.** | Definición contractual de vehículo activo + **modo inactivo al 30%** (§2.3). Retiene el ingreso y el cliente. |
| 3 | **El abono base castiga a la cuenta muy chica.** Un fletero de 3 camiones paga 66% de abono fijo. | Es deliberado: esa cuenta no es rentable sin abono base. Se compensa con un plan Control genuinamente barato en términos absolutos (≈ USD 57/mes) y autoservicio sin costo comercial. |
| 4 | **Sin hardware no hay ancla física de retención.** | Reemplazada por tres anclas: implementación paga, contrato anual con bonificación de implementación como incentivo, y data gravity. Es el riesgo #1 del modelo y requiere disciplina. |
| 5 | **Riesgo macro argentino: inflación y devaluación.** | Revisión trimestral con cláusula IPC en Control/Operación/Gestión; nominación en USD para Corporate (§7.5). |
| 6 | **Canibalización: clientes que se quedan en Control para siempre.** | Mínimos de vehículos, módulos de dinero reservados a Operación+, retención de histórico de solo 6 meses. A los 7 meses, un cliente Control ya perdió acceso a su primer mes de datos: es el recordatorio permanente. |
| 7 | **Los add-ons de integración pueden convertir el SaaS en consultora.** | Scoping pago obligatorio, catálogo cerrado de ERPs soportados y desarrollo a medida solo en Corporate. |
| 8 | **Complejidad de facturación** (prorrateos, modo inactivo, add-ons). | Requiere motor de facturación propio desde el día 1. Intentar sostenerlo con planillas fracasa alrededor de los 40 clientes. La tarifa plana por vehículo reduce mucho esta complejidad respecto de un esquema de tramos. |
| 9 | **Sin escalones automáticos, una flota de 150+ unidades puede percibir el precio como alto** si compara solo el componente variable. | El salto obligatorio a Corporate a los 100 vehículos resuelve el caso antes de que aparezca, y convierte el descuento en contrato plurianual en vez de regalarlo por tabla. |

---

## 11. Recomendación final

### 11.1 El modelo, en una página

> **Cuatro planes nombrados por resultado** — Control, Operación, Gestión, Corporate —
> con **abono base + una tarifa plana por vehículo**, **choferes y usuarios ilimitados
> en todos**, **implementación paga obligatoria** y un catálogo de **add-ons que aísla
> todo lo que tiene costo marginal**.
>
> La escalera de valor se construye sobre **el dinero**: Control muestra el estado de
> la flota, Operación controla la plata de cada viaje, Gestión revela el costo por
> kilómetro, Corporate consolida grupos. Cada escalón responde a una pregunta que el
> cliente ya se hace, y ninguno exige cambiar de proveedor.

### 11.2 Las cinco decisiones que no se negocian

1. **Rendiciones nunca en Control.** Es el módulo que sostiene toda la conversión a
   Operación. Sin ese muro, el 70% de la cartera se queda en el plan de entrada.
2. **Indicadores nunca en Operación.** El costo por kilómetro es el único argumento
   que justifica el salto a Gestión.
3. **IA y GPS nunca incluidos en ningún plan**, ni siquiera Corporate. Tienen COGS
   real y su inclusión erosiona el margen de forma invisible.
4. **Nunca descontar el precio por vehículo ni el abono base.** La única palanca de
   negociación es la implementación.
5. **Nunca firmar contratos anuales en pesos sin cláusula de ajuste.**

### 11.3 Secuencia de ejecución sugerida

| Fase | Estado | Foco |
|---|---|---|
| **1. Habilitar el gating por plan** | ✅ **Hecho** | 26 features, guard en el backend, candados visibles en el menú y los cuatro límites (retención, storage, reglas de alerta, planes de mantenimiento) validados del lado del servidor. |
| **2. Facturación y prorrateo** | ✅ **Hecho** | Suscripciones, add-ons, modo inactivo, prorrateo, snapshot diario de unidades y emisión idempotente. Cobro por Mercado Pago y ciclo de mora automático. |
| **3. Lanzar Operación y Gestión** | 🎯 **Es el próximo paso, y es comercial, no técnico** | El producto ya los soporta completos. Lo que falta es la venta. |
| **4. Autoservicio para Control** | ✅ **Hecho** | Alta pública con verificación de email, trial de 21 días, onboarding guiado, invitaciones por email y pago autogestionado. |
| **5. Add-ons: GPS primero, IA después** | ⏳ **Sin desarrollo** | Están en el catálogo y se facturan; no hay integración detrás (§5.2). |
| **6. Corporate** | ⏸️ **Postergado a propósito** | Multi-empresa, SSO y API son la fase 10 del plan técnico, en espera de demanda real. **No venderlo antes de tenerlo** sigue vigente. |

**Lo que cambió respecto del plan original**: el autoservicio (paso 4, previsto
para el mes 4-6) se adelantó y salió junto con la facturación, así que hoy el
embudo completo —landing, alta, prueba, contratación y cobro— funciona sin
intervención humana. La secuencia dejó de estar limitada por el desarrollo y pasó
a estarlo por la venta.

### 11.4 Las tres métricas del tablero

```
  NRR  > 110%       →  la cartera crece sola
  LTV/CAC  > 4×     →  cada peso de venta devuelve cuatro
  Payback  < 12 m   →  el crecimiento se autofinancia
```

Si las tres se sostienen, el modelo funciona a 30, a 300 y a 3.000 clientes. Si alguna
se rompe, el problema está en el mix de planes o en el descuento — nunca en el precio
de lista.

---

## 12. Anexo — Estado de implementación del gating

> Este anexo describía el trabajo mínimo pendiente. **Ese trabajo está hecho**;
> ahora describe cómo quedó y qué falta. El detalle técnico completo, fase por
> fase, está en [`PLAN-SAAS.md`](./PLAN-SAAS.md).

**Lo que está funcionando:**

| Pieza | Cómo quedó |
|---|---|
| **Vocabulario** | 26 *features*. El código de negocio **nunca pregunta por el nombre del plan**: pregunta por feature. Eso permite que API sea add-on en Gestión e incluida en Corporate sin lógica duplicada. |
| **Catálogo en la base** | Planes y add-ons —precios, mínimos, features y límites— viven en la base, **no en el código**: el superadmin cambia un precio y la landing lo publica sin deploy. |
| **Gating real en el backend** | Un guard por controlador devuelve 403 con la feature y el plan actual, para que el front ofrezca el upgrade correcto. **El ADMIN no tiene privilegio acá**: el plan es un límite comercial de la empresa, no un permiso del usuario. |
| **Paywall visible** | El ítem bloqueado se muestra con candado y linkea a la pantalla de upgrade (§6.2). |
| **«Mi plan» en el menú** | Sección **Cuenta** del sidebar, para `ADMIN` y `MANAGER`. El ítem avisa por sí solo: «Pago pendiente», «Suspendida» o los días que quedan de prueba en la última semana. Es el recordatorio que hace que una mora se resuelva en dos clics en lugar de escalar a un bloqueo. |
| **Los cuatro límites** | Reglas de alerta activas, planes de mantenimiento, GB de adjuntos y meses de retención — todos validados en el servidor. El de storage se valida **antes** de subir a S3, y un contador se reconcilia todas las noches. |
| **Aislamiento entre empresas** | Filtrado por empresa por defecto en todo el acceso a datos, más un *tripwire* que corta si una consulta devolvió una fila ajena. Un barrido automático recorre **todos** los endpoints cruzando tokens: un endpoint nuevo queda cubierto sin tocar el test. |
| **Sin re-login al cambiar de plan** | El plan **no viaja en el token**: se resuelve contra la base con caché de 60 s. Un upgrade se refleja en menos de un minuto. |
| **Retención sin borrar nada** | Recorta la **lectura**, no el dato (decisión D4). Es lo que hace verdadero el argumento del §10.2: subir de plan devuelve el histórico al instante. |

**Lo que falta, en orden de impacto comercial:**

1. **Telemetría de disparadores (§6.3)** — es la palanca de expansión más barata
   que queda sin construir.
2. **Pantalla de upgrade con los datos del propio cliente (§6.2)** — hoy explica en
   vez de demostrar.
3. **Comprobante fiscal** — se registra el pago; la factura AFIP se emite aparte.
4. **Los add-ons con ⏳ del §5.2** — se facturan, no se entregan.

> **Regla de seguridad**: el gating de front es experiencia de usuario; el gating real
> vive en el backend. Un cliente Control no debe poder consultar el endpoint de
> rendiciones aunque manipule el store del navegador.

---

## Fuentes del benchmark

- [Fleetio — Pricing & Plans](https://www.fleetio.com/pricing)
- [Fleetio Review 2026 — Tech.co](https://tech.co/fleet-management/fleetio-review)
- [Samsara Pricing 2026 — AirPinpoint](https://airpinpoint.com/compare/samsara-pricing)
- [Samsara vs Motive 2026 — AirPinpoint](https://airpinpoint.com/compare/samsara-vs-motive)
- [Fleet GPS Tracking Pricing Comparison 2026 — Spytec](https://spytec.com/blogs/news/fleet-tracking-pricing-comparison)
- [Cuánto cuesta un sistema de gestión en Argentina — rql.Ecosystem](https://ecosystem.rqlsistemas.com.ar/blog/cuanto-cuesta-sistema-gestion-argentina)
- [Software de gestión de flotas Argentina — ComparaSoftware](https://www.comparasoftware.com.ar/gestion-de-flotas)
- [Cotización dólar oficial, agosto 2026 — El Cronista](https://www.cronista.com/finanzas-mercados/dolar-oficial-asi-abre-la-cotizacion-este-viernes-7-de-agosto/)

---

_Documento elaborado el 8 de agosto de 2026. Los precios son propuestas de lista sujetas a
validación con los primeros 10 clientes; la estructura del modelo es la recomendación firme._
