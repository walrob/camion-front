# Configuración por empresa

> Cómo CamioNex se adapta a la forma de trabajar de cada cliente, en vez de
> obligarlo a trabajar como el sistema. Documento de diseño: qué se configura,
> qué no, con qué modelo de datos y en qué orden se construye.

---

## 1. El principio

En un SaaS de flotas, dos clientes del mismo tamaño operan distinto: uno no deja
salir un camión sin checklist firmado y el otro no usa checklist; uno renueva el
seguro con 60 días de anticipación y el otro con 15; uno paga viáticos por
convenio y el otro los rinde contra ticket; uno cruza a Paraguay y cobra en
guaraníes.

**Ninguna de esas diferencias justifica un desarrollo a medida.** Todas son
configuración. La regla que ordena este documento:

> El sistema se adapta a la empresa. Lo que cambia entre clientes es
> configuración; lo que no puede cambiar sin dejar de ser el mismo producto es
> código.

---

## 2. Las tres reglas de diseño

### 2.1 El default vive en el código

Una empresa nueva opera **sin una sola fila de configuración propia**. Es el
patrón que el sistema ya usa —`DEFAULT_THRESHOLDS` en `alerts.service.ts`,
`DEFAULT_CHECKLIST_ITEMS` en `common/enums/checklist.enum.ts`,
`DEFAULT_OEA_ITEMS`— y por el que en la fase 6 se descartó el
`CompanySeedService`: no habría hecho nada.

La configuración es un **override**, nunca un requisito de alta. Quien no toca
nada, tiene un sistema que funciona; quien toca, tiene el suyo.

### 2.2 Clave estable, etiqueta editable

Todo elemento de catálogo tiene una `key` que el código usa para decidir, y un
`label` que la empresa edita para leer. **El código nunca compara contra el
texto visible.**

```ts
// Bien: la lógica depende de la clave.
if (entry.type === 'cash_advance') restar()

// Mal: la empresa renombra "Adelanto" a "Anticipo" y se rompe la rendición.
if (entry.typeLabel === 'Adelanto') restar()
```

Las claves que el código consume —`cash_advance`, `fuel`, `per_diem`— quedan
fijas aunque la empresa agregue tipos propios. Un tipo nuevo creado por el
cliente nace con una `key` generada y **sin comportamiento especial**: suma como
gasto, que es el default seguro.

### 2.3 Se desactiva, no se borra

Borrar un tipo de gasto rompe los viajes del año pasado. Todo catálogo tiene
`isActive`: lo desactivado no aparece en los selectores nuevos y sigue
resolviendo el histórico.

### 2.4 Toda entidad nueva hereda de `TenantEntity`

Sin excepciones. Es lo que la mete en el aislamiento multi-empresa, y
`tenant-entities.spec.ts` falla si aparece una entidad de negocio sin
`companyId` fuera de la lista blanca de catálogo global. Una tabla de
configuración que se escape de ahí es una fuga entre clientes.

---

## 3. Qué hay hoy

| Pieza | Estado |
|---|---|
| `CompanySetting` + `GET`/`PATCH /settings` + pantalla **Configuración** | ✅ **Fase A, construida.** Seis ajustes de viaje, rendición y combustible, aplicados en `trips`, `settlements` y `fuel`. |
| `AlertRuleConfig` + catálogo de reglas + `GET`/`PUT /alerts/rules` + pantalla **Alertas** | ✅ **Fase E, construida.** Ocho reglas con su umbral; el cupo del plan se cuenta sobre esta tabla (§6.3). |
| `CompanySequence` (`trip`, `incident`) | ✅ Numeración correlativa por empresa. Falta que el prefijo sea configurable. |
| `Company`: `cuit`, `phone`, `address`, `city`, `state`, `logoUrl`, `primaryColor` | ✅ Identidad fiscal y visual, ya por empresa. |
| Multi-moneda: `CompanyCurrency`, `ExchangeRate`, `exchangeRate` + `amountBase` congelados | ✅ **Fase D, construida.** Toda la aritmética de plata pasó a moneda base (§7). |
| `DEFAULT_OEA_ITEMS` + `OeaTemplateItem` | ✅ Los 7 puntos AFIP son piso normativo; la empresa suma los suyos (§6.2). |
| 26 listas en `front-camion/composables/*.ts` | ✅ Las siete de negocio salen del catálogo de la empresa, con la constante como respaldo offline (§5, §11). El resto son **estados**: no se configuran (§8). |
| Ventana de «por vencer» de documentos y permisos | ✅ Sale de la regla de alerta de cada empresa; el `days: 30` del front se eliminó. |
| Formato de importes y números en el front | ✅ `money()` acepta la moneda del importe (PYG/CLP sin decimales) y el `locale` sale del ajuste de la empresa. |

---

## 4. Nivel 1 — Ajustes

Valores sueltos. Una entidad `CompanySetting` (clave/valor/`enabled`), que es
**generalizar `AlertRuleConfig`** en vez de crear una tabla paralela: mismo
patrón, mismo servicio de lectura con fallback al default del código.

✅ = ya construido (fase A) · ⏳ = planificado.

**El default es siempre lo que el sistema hacía antes.** Por eso
`trip.requireChecklistToStart` viene en `true` (era obligatorio para todos) y
`fuel.requireOdometer` en `false` (el campo era opcional): la versión que
incorpora la configuración no le cambia el comportamiento a nadie.

### 4.1 Reglas del viaje

| Clave | Default | Qué cambia | |
|---|---|---|---|
| `trip.requireChecklistToStart` | `true` | Sin checklist aprobado no se puede `Iniciar`. Quien no usa checklist lo apaga. | ✅ |
| `trip.requireOeaToStart` | `false` | Ídem con la planilla OEA en estado conforme. | ✅ |
| `trip.blockOnExpiredDocs` | `false` | Bloquea la asignación si el camión, el acoplado o el chofer tienen documentación vencida, y dice cuál. Apagado, el sistema igual avisa por alerta. | ✅ |
| `trip.codePrefix` | `V-` | Prefijo de la numeración (`CompanySequence`). | ✅ |
| `trip.international` | `false` | Habilita país de destino y moneda del viaje (§7). | ⏳ |

### 4.2 Rendición

| Clave | Default | Qué cambia | |
|---|---|---|---|
| `settlement.allowReopen` | `true` | Si una rendición cerrada puede volver a borrador. Apagado, es definitiva incluso para el administrador. | ✅ |
| `settlement.perDiemMode` | `log` | `log` = el chofer lo carga en la bitácora · `fixed` = monto fijo del viaje · `both`. Ver §6.4. | ✅ |
| `settlement.requireFxOnClose` | `true` | No deja cerrar con movimientos sin convertir a moneda base (§7). | ✅ |
| `settlement.rounding` | `2` | Decimales del neto a rendir. | ⏳ |

### 4.3 Combustible

| Clave | Default | Qué cambia | |
|---|---|---|---|
| `fuel.requireOdometer` | `false` | Sin odómetro hay gasto pero no rendimiento. Recomendado activarlo. | ✅ |
| `fuel.requireTicketPhoto` | `false` | Foto del ticket obligatoria. Necesita que la carga y el adjunto viajen juntos: hoy el adjunto va en una segunda llamada. | ⏳ |
| `fuel.efficiencyTolerance` | `20` | % de desvío de km/l que dispara alerta de carga sospechosa. Va con el motor de alertas (fase E). | ⏳ |

### 4.4 Vencimientos y avisos ✅ (fase E, como reglas)

No terminaron acá: **son umbrales de reglas de alerta**, no ajustes sueltos, y
viven en la pantalla de Alertas (§6.3). Duplicarlos en `CompanySetting` habría
creado una segunda fuente de verdad para lo mismo.

Lo que sí se cerró: `computeStatus` —el que decide si un documento o un permiso
está «por vencer»— usa la ventana de la empresa, y el `days: 30` que estaba
hardcodeado en `stores/document.ts` desapareció.

### 4.5 Localización y presentación

`locale.baseCurrency` ✅ (fase D) y `locale.locale` ✅: el formato de números y
fechas sale del ajuste de la empresa, con `es-AR` de default.

`locale.timezone` **no se hizo, y se deja anotado**: para que sirviera habría que
pasar por el huso de la empresa el corte del «gasto del día», los cortes de los
crons y las fechas de los reportes. Un ajuste que sólo cambiara la etiqueta
sería peor que no tenerlo: diría que el sistema respeta un huso que no respeta.

---

## 5. Nivel 2 — Catálogos ✅ (fase C)

Listas editables por empresa. Sólo hay filas de lo que la empresa **tocó**:
hasta entonces se usan los elementos de sistema del código.

| Catálogo | Estado | Por qué varía |
|---|---|---|
| Tipos de gasto de la bitácora | ✅ | Estacionamiento, balanza, lavadero, guía: cada operación tiene los suyos |
| Tipos de incidente | ✅ | Rubro y tipo de carga |
| Categorías de documento | ✅ | Carta de porte, MIC/DTA, senasa, ADR: depende de qué transporte |
| Tipos de permiso / habilitación | ✅ | LiNTI y psicofísico son argentinos |
| Puestos y su rol de acceso | ✅ | Organigrama propio |
| Motivos de licencia | ✅ | Convenio aplicable |
| Tipos de combustible | ✅ | Flotas eléctricas o a GNC |

Un elemento lleva `key`, `label`, `color`, `icon`, `order`, `isActive`,
`behavior` e `isSystem`. **`isSystem` marca los que trae el producto**: se
renombran, recolorean, reordenan y desactivan, pero no se eliminan —el histórico
los nombra y el código los espera por su clave—.

### 5.1 El comportamiento, o por qué un catálogo no es sólo texto

Hay catálogos donde el elemento no es una etiqueta sino una decisión del código:

- En **gastos**, `cash_advance` es lo que **resta** en la rendición. Si el
  cliente agrega «Adelanto por transferencia» y el sistema lo cuenta como gasto,
  la rendición da mal y nadie se entera hasta que alguien reclama.
- En **puestos**, el puesto define **con qué rol entra la persona a la app**. Un
  cliente que crea el puesto «Playero» necesita poder decir con qué permisos
  entra, o el sistema no tiene con qué crearle el usuario.

Por eso cada catálogo puede declarar un `comportamiento`: un conjunto
**cerrado** de valores que el código entiende, con su etiqueta para la pantalla
y su valor por defecto. El elemento propio del cliente elige uno.

| Catálogo | Comportamiento | Valores |
|---|---|---|
| Tipos de gasto | Cómo cuenta en la rendición | `expense` (default, suma) · `advance` (resta) |
| Puestos | Rol de acceso | los siete roles del sistema; default `driver` |

Dos reglas que lo sostienen:

- **El comportamiento de un elemento de sistema no se toca.** Renombrar
  «Adelanto» a «Anticipo» le cambia el nombre, no la cuenta — hay un test que lo
  fija.
- **Quien consume, pregunta al catálogo.** Liquidaciones y la bitácora resuelven
  qué resta consultando los elementos de la empresa; RRHH resuelve el rol igual.
  Nadie compara contra la constante.

La pantalla de configuración no conoce ningún catálogo en particular: dibuja el
selector con lo que declara el backend, así el próximo catálogo con
comportamiento no toca el front.

### 5.2 Cómo se suma el próximo catálogo

Media hora, cuatro pasos:

1. Agregar la definición con sus elementos de sistema en `catalogs.catalog.ts`.
2. Migración que libere la columna del `enum` de MySQL a `varchar(64)`.
3. Cambiar el `@IsEnum` del DTO por `catalogsService.assertVigente()` en el
   servicio.
4. En el front, que el consumidor use `useCatalogOptions()` en vez de su
   constante — que queda como fallback offline.

---

## 6. Nivel 3 — Plantillas y reglas

### 6.1 Checklist pre-viaje ✅ (fase B)

Los siete ítems eran una constante global. Ahora son una **plantilla por
empresa** y, si hace falta, **por tipo de unidad**: un tractor con cisterna no se
revisa como un furgón.

Modelo: `ChecklistTemplate` (nombre, `vehicleType` opcional, `isActive`) +
`ChecklistTemplateItem` (`key`, `label`, `order`, `isCritical`,
`requiresPhotoOnFail`, `isActive`).

Cómo se resuelve al crear el checklist de un viaje: **plantilla del tipo de la
unidad → plantilla general de la empresa → la constante del código**. Ese último
escalón es lo que hace que quien nunca configuró nada siga teniendo su checklist
de siempre.

Tres decisiones que valen para el resto de los niveles:

- **`checklist_items.key` dejó de ser un `enum` de MySQL.** Era el techo real:
  una empresa que agrega «Cadenas de nieve» no puede necesitar una migración de
  esquema (§2.2).
- **Los flags se copian al checklist, no se leen de la plantilla.** Si mañana la
  empresa deja de considerar crítico el matafuego, el checklist que se rechazó
  por eso tiene que seguir explicando por qué se rechazó. Es el mismo principio
  que congelar `amountBase` en §7.
- **La firma ahora decide el resultado.** Antes toda firma aprobaba, con lo cual
  «aprobado» no significaba nada. Una falla en un punto **crítico** rechaza el
  checklist —y con `trip.requireChecklistToStart` activo, el viaje no arranca—, y
  una falla en un punto que **exige foto** no se puede firmar sin el adjunto.

### 6.2 Plantilla OEA ✅

Los 7 puntos AFIP y los precintos son un piso normativo: se mantienen como base
del sistema y la empresa **agrega** los suyos —una faja propia, el control de
temperatura de un furgón refrigerado—. Los de norma no se editan ni se
desactivan: no son una preferencia.

`OeaTemplateItem` guarda sólo los puntos propios; la planilla se arma con
«norma + propios activos». `oea_inspection_items.key` dejó de ser `enum`, el
mismo desbloqueo del checklist y los catálogos. Editar la plantilla entra con
`checklist_templates`, la feature que vende «plantillas de inspección propias»;
leerla la puede cualquiera, porque el chofer ve la planilla que va a completar.

### 6.3 Reglas y umbrales de alerta ✅ (fase E)

Estaba vendido —*Umbrales de alerta personalizables* es feature de Gestión— y
corría con los valores del código: era deuda comercial, no una idea nueva.

**Corrección al plan original.** Este documento decía que las cinco claves de
`AlertRuleConfig` se absorbían en `CompanySetting`. **No se hizo, a propósito**:
el límite del plan —3 reglas en Control, 10 en Operación, ilimitadas en Gestión—
se cuenta sobre las filas de esa tabla y ya estaba enforced en `LimitsService`.
Fusionarlas en ajustes sueltos habría roto un límite vendido. Lo que faltaba no
era mudarlas de tabla: era darles un **catálogo** (`alerts.catalog.ts`) y una
pantalla.

Las ocho reglas que el motor conoce:

| Regla | Umbral | |
|---|---|---|
| Incidente reportado por un chofer | — | siempre activa |
| Viaje asignado a alguien de licencia | — | siempre activa |
| Gasto fuera de lo esperado | monto (en moneda base) | |
| Camión detenido demasiado tiempo | horas | |
| Documento por vencer | días | |
| Permiso o habilitación por vencer | días | |
| Mantenimiento próximo (por km) | km | |
| Mantenimiento próximo (por fecha) | días | |

Tres decisiones:

- **Todas vienen activas con el valor de siempre.** Una empresa que no entra a
  la pantalla recibe exactamente las mismas alertas que antes de la fase E.
- **Dos reglas no se apagan.** Silenciar el aviso de un accidente no es una
  preferencia: es perder el motivo por el que el chofer tiene la app. Tampoco
  consumen cupo.
- **Dos permisos distintos**: apagar o prender una regla entra con la
  configuración (Operación); cambiar un umbral es la feature de Gestión. El cupo
  del plan se consume al configurar una regla por primera vez —guardar los
  valores de fábrica no crea fila ni gasta cupo—.

Esto además cierra §4.4: la ventana de «por vencer» de documentos y permisos
**es** el umbral de esas dos reglas. `computeStatus` la recibe por parámetro
—una consulta por cron, no una por documento— y el `days: 30` que estaba
hardcodeado en el front desapareció: el backend resuelve la ventana de cada
empresa.

### 6.4 Viático de monto fijo ✅

`settlement.perDiemMode` decide cómo se paga:

| Modo | Qué pasa |
|---|---|
| `log` (default) | Lo carga el chofer en la bitácora, como siempre |
| `fixed` | El importe lo define la oficina al asignar el viaje |
| `both` | Suman los dos |

**El riesgo era la doble cuenta**, y es donde está el cuidado: en modo `fixed`,
los viáticos que el chofer cargó en la bitácora **no suman** —`summary` los saca
del total mirando el mismo ajuste y los reporta como `noComputado`—, porque ese
importe lo pone la rendición desde el viaje. Siguen apareciendo en el detalle por
tipo: no desaparecen, no computan. Hay tests que fijan los tres modos.

El viaje lleva `perDiemAmount` + `perDiemCurrency`: un viaje a Asunción puede
tener el viático en dólares aunque la empresa facture en pesos, y se convierte a
moneda base con la misma regla congelada de §7.2. Sin cotización, el viático
queda pendiente igual que cualquier otro movimiento.

### 6.5 Viático por país o ruta

Para quien paga viáticos por convenio: `PerDiemRate` (país o ruta → monto +
moneda + vigencia). Al crear un viaje internacional, el monto se propone solo.
Es lo último de la lista: sin clientes que lo pidan, no se construye.

---

## 7. Viajes internacionales y monedas

El disparador es concreto: un viaje a Paraguay se paga peaje en guaraníes,
combustible en reales y el viático se acuerda en dólares. Si el sistema suma todo
como si fueran pesos, la rendición es basura.

### 7.1 Lo que ya está ✅ (fase D)

`TripLogEntry.currency`, `Settlement.currency` y `FuelRecord.currency` ya
existían con default `'ARS'`: el modelo estaba previsto y nunca se completó. La
fase D agregó lo que faltaba —cotización, importe convertido y la aritmética que
los usa— y lo dejó andando de punta a punta.

### 7.2 El modelo

**Moneda base de la empresa** (`locale.baseCurrency`, default `ARS`). Todo lo que
sea reporte, indicador o comparación vive en esa moneda; los movimientos viven en
la moneda en que se gastó.

Cada monto suma dos columnas:

| Columna | Para qué |
|---|---|
| `exchangeRate` (decimal 12,6, nullable) | La tasa aplicada a **ese** movimiento |
| `amountBase` (decimal, nullable) | El monto convertido a moneda base |

**`amountBase` se congela al registrar.** No se recalcula nunca: la rendición de
marzo no puede cambiar de valor en junio porque se movió el dólar. Es la
diferencia entre un comprobante y una estimación.

Dos entidades nuevas, ambas `TenantEntity`:

- **`CompanyCurrency`** — qué monedas usa la empresa: `code` (ISO 4217), `symbol`,
  `decimals`, `isBase`, `isActive`.
- **`ExchangeRate`** — `currencyCode`, `date`, `rate`, `source` (`manual` | `api`).
  Se aplica la última vigente con fecha ≤ la del movimiento.

### 7.3 Qué pasa cuando no hay tasa

Es el caso normal, no el borde: el chofer está en la aduana a las 3 de la mañana,
sin señal y sin que nadie haya cargado la cotización del día.

**Nunca se bloquea la carga.** El movimiento se guarda con su `amount` y su
`currency`, `amountBase = null`, y queda **pendiente de conversión**. La oficina
lo resuelve cargando la tasa del día —una vez, y se aplica a todos los
movimientos de esa fecha—. Con `settlement.requireFxOnClose = true`, la rendición
no cierra hasta que no quede ninguno pendiente.

En la app del chofer: la lista de monedas habilitadas y la última tasa conocida se
**cachean junto con los catálogos**, así el selector de moneda funciona offline.

### 7.4 Cómo se ve

- **Bitácora**: el selector de moneda aparece sólo si la empresa tiene más de una
  activa. Con una sola moneda, la pantalla es exactamente la de hoy.
- **Rendición**: `totalsByCurrency` (subtotal por moneda original) **más** el total
  en moneda base. El PDF muestra las dos columnas, que es lo que después se
  discute con el chofer y con el contador.
- **Indicadores y combustible**: siempre en moneda base, calculados sobre
  `amountBase`, con un aviso cuando hay movimientos sin convertir en el período.
  Un costo por km que ignora medio viaje es peor que no tenerlo.
- **Formato**: `useFormatters` deja de asumir `ARS` y recibe la moneda; PYG y CLP
  no llevan decimales, y `Intl` ya lo sabe.

### 7.4.1 Dónde quedó aplicado

Todo lo que suma plata pasó a usar `amountBase`, no `amount`: la bitácora, el
resumen del viaje, la rendición, el tablero de combustible —costo por km,
precio del litro—, los indicadores y el panel. Sumar guaraníes con pesos daba un
número que parecía correcto y no lo era.

Dos consecuencias buscadas:

- **Lo pendiente no se cuela en un total.** Un movimiento sin cotización no
  suma; se cuenta aparte (`pendingFx`) y se avisa en la pantalla del chofer, en
  el PDF de la rendición y al intentar cerrarla.
- **El umbral de alerta de gasto compara en moneda base.** El umbral está en la
  moneda de la empresa; comparar contra 200.000 guaraníes lo dispararía siempre.

### 7.5 El viático internacional

Con `settlement.perDiemMode = 'fixed'`, el viaje lleva `perDiemAmount` +
`perDiemCurrency`: un viaje a Asunción puede tener el viático en dólares aunque la
empresa facture en pesos. Entra en la rendición como un movimiento más, con su
conversión, y el neto a rendir sale por moneda y en base.

### 7.6 El viaje internacional en sí

Con `trip.international = true`, el formulario de viaje suma **país de destino** y
**moneda del viaje** (que preselecciona la moneda de los gastos). Habilita además
exigir la documentación del cruce mediante las categorías de documento del
catálogo (MIC/DTA, carta de porte internacional, seguro con cobertura regional) y
la regla `trip.blockOnExpiredDocs`.

---

## 8. Lo que no se configura

Y conviene decir por qué, porque en algún momento alguien lo va a pedir.

| Qué | Por qué no |
|---|---|
| **Estados y transiciones** (`assigned → in_progress → finished`, `draft → closed`) | Es la máquina de estados. En el back son columnas `enum` de MySQL (`TripStatus`, `SettlementStatus`): cambiarlas es una migración, no una configuración. El front compara contra esos literales en 18 lugares. Se puede renombrar lo que se muestra; la clave, nunca. |
| **La matriz de roles** | Configurarla es construir un editor de permisos: mucha superficie, mucho soporte y una fuente inagotable de «no veo tal cosa». El rol es el contrato del producto. |
| **La fórmula de la rendición** (gastos − adelantos) | Si eso se configura, dos clientes dejan de tener el mismo sistema y ninguna versión futura se puede probar. |
| **Auditoría y trazabilidad** | No se apaga. Es lo que hace que la rendición valga como comprobante. |
| **Límites, retención y gating por plan** | Son comerciales. Los define el plan, no el cliente. |

---

## 9. Modelo de datos y endpoints

Ya construidas: `CompanySetting` (fase A), `ChecklistTemplate` y
`ChecklistTemplateItem` (fase B).

```
CompanySetting        (TenantEntity)  key, value, updatedBy          ← generaliza AlertRuleConfig
CatalogItem           (TenantEntity)  catalog, key, label, color, icon, order, isActive, isSystem
ChecklistTemplate     (TenantEntity)  name, vehicleType?, isActive
ChecklistTemplateItem (TenantEntity)  templateId, key, label, order, requiresPhotoOnFail, isCritical
CompanyCurrency       (TenantEntity)  code, symbol, decimals, isBase, isActive
ExchangeRate          (TenantEntity)  currencyCode, date, rate, source
PerDiemRate           (TenantEntity)  country?, route?, amount, currency, validFrom, validTo
```

| Endpoint | Nota |
|---|---|
| `GET /settings` | Devuelve el merge **default del código + override de la empresa**. Una sola llamada al entrar. |
| `PATCH /settings` | Sólo `admin`. Auditado: cambiar `blockOnExpiredDocs` es una decisión operativa. |
| `GET /catalogs` | Todos los catálogos de la empresa en una respuesta, con `updatedAt` para cachear. |
| `POST/PATCH /catalogs/:catalog/items` | Alta y edición. No hay `DELETE`: se desactiva. |
| `GET/POST /checklist-templates` | Plantillas y sus ítems. |
| `GET/POST /currencies`, `GET/POST /exchange-rates` | Monedas habilitadas y cotizaciones. |
| `GET/POST /alerts/thresholds` | Ya existe. Se le suma `enabled` por regla. |

---

## 10. Gating por plan

Configurar es una capacidad más del producto y entra donde dice la matriz de
MODELO-COMERCIAL §4.1. **Que el sistema sea adaptable no lo saca del modelo
comercial.**

| Plan | Qué puede configurar |
|---|---|
| **Control** | Nada. Opera con los defaults. |
| **Operación** | Ajustes (§4), catálogos (§5) y checklist propio. |
| **Gestión** | Reglas y umbrales de alerta, plantillas por tipo de unidad, viáticos por país/ruta. |
| **Corporate** | Todo, más lo que traiga multi-empresa. |

Features que lo implementan:

| Feature | Desde | Habilita | |
|---|---|---|---|
| `settings` | Operación | Cambiar los ajustes de operación (§4) | ✅ |
| `checklist_templates` | Operación | Armar la plantilla propia del checklist (§6.1) | ✅ |
| `checklist_by_type` | Gestión | Tener una plantilla distinta por tipo de unidad | ✅ |
| `catalogs` | Operación | Editar los catálogos (§5) | ✅ |
| `alert_thresholds` | Gestión | Umbrales y reglas de alerta (§6.3) | existe, sin pantalla |

**Se gatea escribir, nunca leer.** `GET /settings` y `GET /checklist-templates`
quedan abiertos a cualquier plan: la app del chofer necesita saber qué se le va a
exigir, y saberlo no puede depender de lo que pague la empresa. Lo que el plan
decide es quién puede *cambiarlo*.

Dónde se aplica cada verificación:

- **Endpoint** (`@AuthFeature`) cuando la feature es todo el endpoint: `PATCH
  /settings`, y el alta/edición/baja de plantillas.
- **Servicio** cuando depende del contenido y no del endpoint: la misma llamada
  que guarda una plantilla es válida sin `checklist_by_type` si la plantilla es
  general, y no lo es si lleva `vehicleType`.
- **Front**: candado en el menú, `feature` en la página —el middleware lleva a la
  pantalla de upgrade— y el control deshabilitado con la leyenda del plan que lo
  incluye. Es experiencia de usuario: el gating real es el del backend.

Multi-moneda (§7) es la única excepción y **no se gatea**: quien cruza la
frontera necesita que las cuentas cierren, sea cual sea su plan. Cobrar por eso
es cobrar por no dar un resultado incorrecto.

---

## 11. Impacto en el front

Los siete catálogos de negocio de `composables/*.ts` pasan a venir del servidor,
pero **la constante del código se queda como fallback**:

```ts
// El default deja de ser "la lista" y pasa a ser "la lista cuando no hay otra".
const { items } = useCatalog('expenseType')   // servidor → caché → constante
```

Tres cuidados:

1. **La app del chofer trabaja offline.** Catálogos, monedas y última tasa se
   cachean en el dispositivo junto con la cola de sincronización. Si no hay caché
   ni red, se usa la constante: peor es un selector vacío.
2. **Nada de bloquear el render esperando el catálogo.** Se pinta con lo cacheado
   y se refresca en segundo plano.
3. **Los `=== "assigned"` no se tocan.** Esos son estados, no catálogos (§8).

---

## 12. Orden de trabajo

| # | Qué | Por qué en ese orden |
|---|---|---|
| **A** ✅ | `CompanySetting` + pantalla **Configuración** (Cuenta → Configuración, sólo `admin`), con los seis ajustes marcados ✅ en §4 | Máximo dolor resuelto por línea de código; generaliza algo que ya existe |
| **B** ✅ | Checklist configurable (§6.1) | Es el pedido que más aparece en una demo |
| **C** ✅ | Catálogos (§5): los siete, con comportamiento donde el código decide algo | Habilita el vocabulario propio de cada operación |
| **D** ✅ | Multi-moneda (§7) | **Se adelanta a la posición A/B si el primer cliente hace internacional**: es requisito, no mejora |
| **E** ✅ | Reglas y umbrales de alerta con pantalla (§6.3), que además cierra §4.4 | Era deuda: estaba vendido y no estaba entregado |

Cada fase cierra con su sección en el manual de usuario
([docs/manual-usuario/manual.html](manual-usuario/manual.html)): una funcionalidad
configurable que nadie sabe configurar no se usa.

---

## 13. Riesgos

- **La pantalla de configuración se vuelve un panel de 60 perillas.** Se agrupa por
  módulo, cada opción explica en una línea qué cambia, y todo tiene su default
  visible. Si una opción no se puede explicar en una línea, probablemente no
  debería ser configurable.
- **Soporte a ciegas.** Ante «esto no anda», lo primero es saber cómo está
  configurada esa empresa: la configuración efectiva tiene que verse desde el
  panel de plataforma, y cada cambio queda en la auditoría con autor y fecha.
- **Configuración que contradice al plan.** El backend valida contra la feature,
  no contra lo que quedó guardado: una empresa que baja de plan conserva sus filas
  pero deja de aplicarlas, y las recupera intactas si vuelve a subir.
