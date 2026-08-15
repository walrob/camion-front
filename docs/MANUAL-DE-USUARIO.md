# Manual de Usuario — Sistema de Gestión de Flota

> Guía práctica para operar el sistema día a día: qué hace cada rol, cómo se
> navega y cuál es el flujo completo de un viaje, desde el alta hasta la rendición.

> **Alcance de este documento.** Es una muestra de las funcionalidades ya
> desarrolladas, pensado para entender de un vistazo qué ofrece el sistema. No es
> un reglamento cerrado: los flujos y reglas de negocio concretos (por ejemplo, quién
> y cómo asigna un viaje, o los umbrales de las alertas) **quedan a definir y son
> adaptables**. El sistema está construido para que la empresa que lo adopte pueda
> **ajustarlo a sus propias necesidades**.

---

## 1. ¿Qué es el sistema?

Reemplaza el cuaderno del chofer y los grupos de WhatsApp por una plataforma web
**mobile-first**. Es un servicio **multi-empresa**: cada empresa tiene su propia
cuenta y **solo ve sus datos**. Hay **tres puertas** sobre la misma aplicación:

| Puerta | Dirección | Para quién |
|--------|-----------|------------|
| **Sitio público** | `/` | Cualquiera: qué hace el sistema, planes y precios, alta de cuenta. |
| **App del Chofer** | `/chofer` | rol `DRIVER`. Pantalla de celular con barra inferior, botones grandes, dictado por voz y captura de fotos. Funciona sin señal (offline) y se sincroniza al recuperar conexión. |
| **Backoffice / Gerencial** | `/admin` | `ADMIN`, `MANAGER`, `DISPATCHER`, `MAINTENANCE`, `HR`, `AUDITOR`. Panel de escritorio con menú lateral organizado por secciones. |

Al iniciar sesión, el sistema redirige automáticamente: el chofer va a `/chofer`
y el resto a `/admin`. Cada usuario ve solo lo que su rol permite, y cada empresa
solo lo que su **plan** incluye (ver §3).

> **Si la app del chofer está instalada** en el celular (PWA), abre directamente en
> `/chofer`: no pasa por el sitio público.

---

## 2. Alta de la cuenta y primeros pasos

### 2.1 Crear la cuenta

Desde el sitio público, **Crear cuenta** (`/auth/registro-empresa`): nombre de la
empresa, CUIT, y el nombre, email y contraseña del primer usuario, que queda como
**ADMIN**.

1. **Confirmación de email.** Llega un correo con un link de verificación. Hasta
   confirmar, el login no deja entrar y ofrece **reenviar** el correo.
2. **Prueba gratuita: 21 días de plan Operación completo** —no del plan de
   entrada—, así que durante ese período están habilitadas rendiciones,
   combustible, mantenimiento, OEA y RRHH básico.
3. Al vencer la prueba sin contratar, la cuenta queda **suspendida** tras 3 días de
   gracia: los datos no se borran y se recuperan al activar un plan.

### 2.2 Configuración inicial (`/initial`)

Después del alta aparece una guía de **tres pasos**, que se pueden saltear y
retomar:

1. **Cargá tu flota** — camiones y acoplados con patente y número interno. (Si son
   muchas unidades, se puede pedir la carga asistida desde la planilla: todavía no
   hay importador de Excel.)
2. **Sumá a tu equipo** — choferes y taller. Los choferes son **ilimitados en todos
   los planes**.
3. **Creá tu primer viaje** — con camión y chofer asignados; la app del chofer lo
   recibe al instante.

En esa misma pantalla se puede cargar el **logo de la empresa**, que después
aparece en la aplicación.

### 2.3 Dos caminos para dar acceso a una persona

| Camino | Cuándo | Dónde |
|---|---|---|
| **RRHH → Choferes** | Personal propio, en relación de dependencia: además del acceso, arma el **legajo**. | `/admin/rrhh` y `/admin/choferes` |
| **Equipo (invitación por email)** | Gente sin legajo: contador, despachante tercerizado, auditor externo. | `/admin/equipo` |

La invitación se manda por email, **vale 7 días** y es de un solo uso. La pantalla
muestra además un **link copiable**, que es la salida cuando el correo cae en spam
o la casilla quedó mal escrita. El **rol que se puede invitar depende del plan**
(§3.3). `/admin/equipo` es de `ADMIN` y `MANAGER`.

---

## 3. Planes, candados y límites

La empresa contrata un **plan** —Control, Operación, Gestión o Corporate— y eso
define **qué módulos están habilitados**, además de los límites de la cuenta.

### 3.1 Los módulos bloqueados se ven, no se esconden

Un módulo fuera del plan **sigue apareciendo en el menú**, en gris y con un
**candado**. Al hacer clic lleva a una pantalla que explica qué incluye y con qué
plan viene. La regla también corre del lado del servidor: no alcanza con conocer la
dirección de la pantalla.

### 3.2 Qué trae cada plan

| Módulo | Control | Operación | Gestión | Corporate |
|---|:---:|:---:|:---:|:---:|
| Flota, Documentos, Alertas, Viajes, Checklist, Mensajes, Incidentes, App del chofer | ✅ | ✅ | ✅ | ✅ |
| Bitácora en ruta y **Rendiciones** | — | ✅ | ✅ | ✅ |
| Combustible · Mantenimiento · Planillas OEA | — | ✅ | ✅ | ✅ |
| Tablero kanban de incidentes | — | ✅ | ✅ | ✅ |
| RRHH — legajo y habilitaciones | — | ✅ | ✅ | ✅ |
| Exportación a Excel | — | ✅ | ✅ | ✅ |
| **Indicadores** gerenciales (costo por km) | — | — | ✅ | ✅ |
| RRHH — historial laboral y estados automáticos | — | — | ✅ | ✅ |
| Ranking de consumo · Umbrales de alerta · Rol Auditor | — | — | ✅ | ✅ |
| Multi-empresa, API y SSO | — | — | — | ✅ |

### 3.3 Límites por plan

| Límite | Control | Operación | Gestión | Corporate |
|---|---|---|---|---|
| **Retención de histórico** | 6 meses | 24 meses | 60 meses | Sin límite |
| **Almacenamiento de adjuntos** | 2 GB | 50 GB | 250 GB | Sin límite |
| **Reglas de alerta activas** | 3 | 10 | Sin límite | Sin límite |
| **Planes de mantenimiento activos** | — | 10 | Sin límite | Sin límite |
| **Roles habilitados** | 4 | 6 | 7 | 7 |
| **Usuarios y choferes** | Ilimitados | Ilimitados | Ilimitados | Ilimitados |

- **Retención**: los listados históricos (viajes, bitácora, rendiciones,
  combustible, incidentes, órdenes de trabajo, OEA y checklists) muestran un aviso
  cuando el plan recorta lo que se ve. **El dato no se borra**: al subir de plan
  reaparece completo. Los maestros —flota, choferes, legajos, documentos— nunca se
  recortan.
- **Almacenamiento**: al llegar al tope, la subida de un adjunto se rechaza con el
  mensaje del add-on de ampliación.
- **Roles**: Control habilita `ADMIN`, `MANAGER`, `DISPATCHER` y `DRIVER`;
  Operación suma `MAINTENANCE` y `HR`; Gestión suma `AUDITOR`.
- Los **indicadores** avisan en pantalla cuando el rango que muestran quedó
  recortado por la retención del plan.

---

## 4. Estado de la cuenta y pagos

En **Mi plan** —menú lateral, sección **Cuenta**— se ve el plan vigente, el consumo
del mes (camiones y acoplados activos), el total mensual y los períodos pendientes
de pago. Desde ahí se paga con **Mercado Pago** —link de pago por período o
**débito automático**— y se da de baja el débito. Lo ven `ADMIN` y `MANAGER`.

> El propio ítem del menú avisa cuando hay algo que resolver: **«Pago pendiente»**
> en naranja si la cuenta entró en mora, **«Suspendida»** en rojo si ya está
> bloqueada, y los **días que quedan de prueba** durante la última semana. Con la
> cuenta al día no muestra nada.

**Estados de la cuenta:**

| Estado | Qué pasa |
|---|---|
| **Prueba** (`trial`) | Acceso completo al plan Operación por 21 días. Avisos a los 7, 3 y 1 día del vencimiento. |
| **Activa** (`active`) | Acceso completo. |
| **En mora** (`defaulter`) | Acceso completo, con aviso de deuda a la vista. Empieza después de 10 días de vencido el período. |
| **Bloqueada** (`blocked`) | **Solo lectura**, 10 días después de entrar en mora. Se puede seguir viendo la información y **pagar**; no se puede cargar nada nuevo. |
| **Dada de baja** (`cancelled`) | Sin acceso. |

Cómo se cobra: la facturación es **abono del plan + precio por vehículo activo**,
con los acoplados al 50 % y un **mínimo de vehículos** por plan. Se cuenta el
**máximo de unidades activas del mes**, no las del último día. Subir de plan o
agregar unidades es inmediato y se prorratea; bajar de plan o quitar unidades
recién tiene efecto en la renovación del período.

---

## 5. Roles y qué puede hacer cada uno

| Rol | Función | Accede principalmente a | Desde el plan |
|-----|---------|-------------------------|---------------|
| **ADMIN** | Administrador de la empresa | Todo: usuarios, flota, viajes, finanzas, plan y pagos | Control |
| **MANAGER** (Gerente) | Dirección / dueños | Panel, indicadores, lectura de toda la operación | Control |
| **DISPATCHER** (Despachante) | Coordina la operación diaria | Alta de viajes, incidentes, alertas, mensajes, flota | Control |
| **DRIVER** (Chofer) | Conductor en ruta | Sus viajes, bitácora, checklist, combustible, OEA, incidentes, mensajes | Control |
| **MAINTENANCE** (Taller) | Mantenimiento de unidades | Mantenimiento, órdenes de trabajo, documentos de camiones | Operación |
| **HR** (RRHH) | Recursos Humanos | Legajos del personal, permisos/vencimientos, choferes | Operación |
| **AUDITOR** | Auditoría / contable | Lectura de bitácoras, rendiciones, indicadores, planillas OEA | Gestión |

---

## 6. Menú del Backoffice

El menú lateral está agrupado por dominio de uso diario. Los ítems marcados con 🔒
dependen del plan: si no está incluido, se ven con candado.

**Inicio**
- **Panel** (`/admin`) — resumen gerencial.
- 🔒 **Indicadores** (`/admin/indicadores`) — KPIs con filtros y exportación
  (`ADMIN`, `MANAGER`, `AUDITOR`; plan Gestión).

**Operación**
- **Viajes** (`/admin/viajes`) — alta y seguimiento de viajes.
- **Incidentes** (`/admin/incidentes`) — tablero de incidentes reportados por choferes.
- **Alertas** (`/admin/alertas`) — bandeja priorizada de avisos automáticos.
- **Mensajes** (`/admin/mensajes`) — mensajería con los choferes.

**Flota**
- **Flota** (`/admin/flota`) — camiones y acoplados.
- 🔒 **Mantenimiento** (`/admin/mantenimiento`) — planes preventivos y órdenes de trabajo.
- 🔒 **Combustible** (`/admin/combustible`) — tablero de consumos (km/l, gasto por camión/chofer).
- **Documentos** (`/admin/documentos`) — centro documental con vencimientos.

**Personal**
- 🔒 **RRHH** (`/admin/rrhh`) — legajos, permisos/habilitaciones e **historial laboral** del personal.
- **Choferes** (`/admin/choferes`) — perfil operativo del chofer.
- **Equipo** (`/admin/equipo`) — accesos e invitaciones para gente sin legajo.

**Administración**
- 🔒 **Rendiciones** (`/admin/liquidaciones`) — cierre de gastos por viaje.
- 🔒 **Planillas OEA** (`/admin/oea`) — inspecciones de seguridad firmadas.

**Cuenta**
- **Mi plan** (`/estado-plan`) — plan contratado, consumo, deuda y pago (§4).

---

## 7. Flujo completo de un viaje

Este es el circuito central del sistema, paso a paso.

### Paso 0 — Preparación (una sola vez / según necesidad)

Antes de operar, deben existir los datos base. Los carga el backoffice —es lo mismo
que propone la guía de configuración inicial (§2.2):

1. **Flota** (`Flota`): dar de alta camiones (patente, número interno, km actual) y
   acoplados. Desde la tabla, el botón **Ver documentos** de cada unidad abre el
   Centro Documental ya filtrado por ese camión/acoplado.
2. **Personal** (`RRHH`): cargar el legajo del empleado (datos personales, DNI/CUIL)
   con su **fecha de ingreso** (obligatoria: abre el *historial laboral*) y sus
   **permisos/habilitaciones** con fecha de vencimiento (carnet, LiNTI/CNRT,
   psicofísico, carga peligrosa, etc.). En cada permiso se puede **adjuntar la imagen
   o PDF del certificado** además de los datos y el vencimiento.
3. **Choferes** (`Choferes`): habilitar al empleado como chofer (perfil operativo) y,
   si corresponde, darle acceso a la app. Al elegir/editar el chofer se muestra el
   **DNI** junto al nombre para distinguir homónimos, y se puede buscar por ese dato.

### Paso 1 — Dar de alta el viaje  → *Despachante / Admin*

En **Viajes** → botón **Nuevo viaje**. Se completa:

- **Camión** * y **Chofer** * (obligatorios).
- **Acoplado** (opcional).
- **Origen** * y **Destino** *.
- **Carga** (descripción), **Salida planificada** y **Llegada planificada**.
- **Notas**.

El viaje queda en estado **Asignado** (`assigned`) y aparece automáticamente en la
app del chofer asignado.

> **Disponibilidad del chofer.** El sistema valida la situación del legajo del
> chofer **en la fecha de inicio del viaje**:
> - Si está **de licencia** en esa fecha, ofrece un aviso para **finalizar la
>   licencia y asignar igual** (queda registrado en el historial y genera una
>   alerta para RRHH), o reprogramar el viaje.
> - Si está **suspendido** o **dado de baja**, el sistema **bloquea** la asignación
>   (primero debe resolverse desde RRHH).

Los selectores de **camión** y **chofer** permiten **buscar tecleando** (patente,
nombre o DNI). En el listado de viajes hay un **filtro por chofer**, botones para
**exportar a Excel** el listado filtrado y, por fila, **Hoja de ruta (PDF)**: un
comprobante imprimible con la unidad, el chofer, la carga y la ruta para entregarle
al conductor.

### Paso 2 — El chofer recibe y prepara el viaje  → *Chofer*

En su celular (`/chofer` → "Mis viajes") el chofer ve el viaje asignado. Antes de
salir:

1. **Checklist pre-viaje**: desde el viaje, botón **Checklist**. Revisa cada ítem
   (luces, frenos, cubiertas, aceite, matafuego, documentación, acoplado…) marcando
   **OK / Falla / N/A**, puede adjuntar foto y **firma digital**. El resultado queda
   como *aprobado* o *rechazado*.
2. **Planilla OEA** (si aplica): desde `/chofer/oea`, inspección de seguridad de los
   7 puntos AFIP + precintos, con fotos por ítem, firma y resultado
   *conforme / no conforme*.

### Paso 3 — Iniciar el viaje  → *Chofer*

En el viaje, botón **Iniciar**. Se registra el **odómetro de salida** (el sistema
sugiere el km actual del camión) y se captura la **ubicación GPS** del celular. El
viaje pasa a **En curso** (`in_progress`).

### Paso 4 — Bitácora en ruta  → *Chofer*

Durante el viaje, el chofer registra todo lo que ocurre (botón **+** en la pantalla
del viaje). Cada movimiento tiene fecha, hora, autor y ubicación:

- **Tipos de carga en la bitácora**: combustible, peaje, gasto, **adelanto**
  (`cash_advance`), reparación, multa, viático, otros.
- Puede adjuntar el **comprobante** (foto del ticket) y usar **dictado por voz** para
  las observaciones.

> **Sobre el viático** *(a definir)*: el sistema soporta el viático como un tipo más
> de movimiento. Queda por definir en cada implementación **quién lo carga**: el
> chofer en la bitácora, o la administración al asignar el viaje (como monto fijo
> del viaje). Ambos caminos son posibles y se ajustan a la operatoria del cliente.
- **Combustible**: desde `/chofer/combustible`, carga litros + monto + km + foto del
  ticket (alimenta el tablero de consumos).

La pantalla del viaje muestra en vivo un **resumen**: total de gastos, total de
adelantos y la diferencia (**neto a rendir**).

> **Sin señal**: la bitácora, el checklist y los incidentes se guardan en el celular
> y se sincronizan solos al recuperar conexión. Un indicador muestra los registros
> pendientes.

### Paso 5 — Reportar incidentes (cuando ocurren)  → *Chofer*

Desde `/chofer/incidente/nuevo`: tipo (mecánico, accidente, faltante de caja,
demora, problema de carga/cliente, emergencia), descripción por voz, **fotos/audio/
video** y GPS. El despachante lo ve en el tablero de **Incidentes** y puede generar
una **Alerta** priorizada (roja/naranja/amarilla/verde).

### Paso 6 — Finalizar el viaje  → *Chofer*

Botón **Finalizar**. Se registra el **odómetro de llegada** y GPS. El sistema calcula
la distancia recorrida y el viaje pasa a **Finalizado** (`finished`). A partir de
aquí la bitácora queda cerrada para edición del chofer.

### Paso 7 — Rendición / liquidación  → *Admin / Manager / Auditor*

En **Rendiciones** → botón **Generar rendición**. Se elige un viaje **finalizado** y
el sistema **arma la rendición automáticamente** desde la bitácora:

```
Neto a rendir = Total de gastos rendidos  −  Total de adelantos
```

- La rendición nace en estado **Borrador** (`draft`): se puede revisar.
- Se puede **descargar el PDF** de la rendición.
- Con todo conforme, se **Cierra** (`closed`) y queda como comprobante definitivo.

> El sistema hoy solo **suma y resta** lo cargado en la bitácora; no calcula viáticos
> automáticos por convenio (queda preparado para agregarlos más adelante).

---

## 8. Estados a tener en cuenta

**Viaje:** `Asignado` → `En curso` → `Finalizado` (o `Cancelado`).

**Rendición:** `Borrador` → `Cerrada`.

**Alerta:** `Nueva` → `Vista` → `Reconocida` → `Resuelta`
(niveles: roja / naranja / amarilla / verde).

**Documentos y permisos:** `Vigente` → `Por vencer` → `Vencido` (el sistema avisa
automáticamente antes del vencimiento).

**Estado laboral del empleado:** `Activo` · `Licencia` · `Suspendido` · `Baja`. No
se edita a mano: lo **calcula el sistema** a partir del *historial laboral* del
legajo (ver §9) y se **auto-corrige** cuando una licencia o suspensión vence.

---

## 9. Módulos de apoyo

> Varios de estos módulos dependen del plan contratado (§3.2): **Combustible**,
> **Mantenimiento**, **Planillas OEA**, **Rendiciones** y el tablero kanban de
> **Incidentes** vienen desde Operación; **Indicadores**, el ranking de consumo y
> el **historial laboral** de RRHH, desde Gestión.

### Incidentes

El chofer reporta un problema desde la app (tipo, descripción por voz, fotos/audio/
video y GPS) y en el backoffice llega a un **tablero tipo kanban** con columnas por
estado: **Pendiente → En progreso → Resuelto**. Al abrir un incidente, el
despachante puede:

- **Asignar un responsable** (cualquier usuario del staff) para que se ocupe.
- Ajustar la **severidad** y cambiar el **estado** del incidente.
- Ver la **línea de tiempo** (historial de cambios) y **agregar comentarios**.

Se actualiza **en vivo** (websocket): un incidente nuevo aparece solo en el tablero.

### Alertas

Es una **bandeja priorizada** que el sistema **genera automáticamente** con un motor
de reglas —no se cargan a mano—. Cada alerta tiene un **nivel de color** según la
urgencia:

- 🔴 **Roja** — crítico (ej. accidente): atención inmediata.
- 🟠 **Naranja** — importante (ej. camión detenido demasiado tiempo; se finalizó una
  licencia para poder asignar un viaje).
- 🟡 **Amarilla** — a revisar (ej. gasto fuera del umbral esperado; viaje asignado a
  un chofer que venía de licencia).
- 🟢 **Verde** — informativa (ej. documento o permiso próximo a vencer).

Llegan **en tiempo real** al centro de alertas del navbar (la campanita con
contador) y a la pantalla **Alertas**, que se puede **filtrar** por nivel, estado y
fechas. Sobre cada alerta se trabaja con un **flujo de estados** mediante botones:
**Visto → Atender → Resolver** (o *Desatender* para volver atrás). A diferencia de
los incidentes, **la alerta no se asigna a una persona**: se dirige por rol a quien
corresponda y cualquiera con acceso la gestiona. Reemplaza los cientos de mensajes
de WhatsApp por una lista ordenada por prioridad.

### Combustible

El chofer carga cada abastecimiento (litros, monto, km y foto del ticket). El
backoffice obtiene un tablero de **rendimiento por camión y por chofer** alineado con
los km: km/l, l/100km y costo/km, con gráficos y **exportación a Excel**.

### Mantenimiento

Organizado en tres pestañas: **Próximos**, **Planes** y **Órdenes**. Se definen
**planes preventivos** por km, horas o fecha, y el sistema **avisa cuando un camión
llega a su próximo servicio**. Cada intervención del taller se registra como una
**orden de trabajo** (ítems, costo, notas y adjuntos), que puede **imprimirse en PDF**
como comprobante para el taller.

### Documentos (Centro Documental)

Repositorio de la documentación de **unidades, choferes y empresa** (seguro, VTV,
licencias, permisos, etc.), con **archivo adjunto** (imagen/PDF) y **fechas de
vencimiento**. Tiene una pestaña de **Por vencer** —con **buscador y filtros** por
estado y entidad, y **exportación a Excel**— y dispara alertas verdes automáticas
antes de que algo caduque. Se puede llegar filtrado por una unidad desde el botón
**Ver documentos** en la pantalla de **Flota**.

### RRHH — Legajo e Historial laboral

Cada empleado tiene un **legajo** con sus datos, sus **permisos/habilitaciones**
(con archivo adjunto y vencimiento) y su **historial laboral**: una línea de tiempo
de **movimientos** que registra ingresos, **licencias** (con su motivo: vacaciones,
enfermedad, accidente, etc.), **suspensiones**, **reincorporaciones** y **bajas**.
Cada movimiento admite un **archivo de respaldo** (p. ej. certificado de reposo).

- El **estado laboral** (Activo / Licencia / Suspendido / Baja) **surge del
  historial**: no se edita a mano y se **auto-corrige** cuando un período vence.
- Una licencia o suspensión con fecha de fin se puede **cerrar antes** (botón de
  reincorporación anticipada).
- El sistema **no deja cargar** una licencia, suspensión o baja si el chofer tiene
  **viajes sin cerrar** en ese período: primero hay que cancelarlos o finalizarlos
  (ofrece un acceso directo a los viajes de ese chofer).
- En el listado de RRHH, un panel **"Fuera de servicio hoy"** muestra de un vistazo
  quién está de licencia o suspensión en la fecha.

### Indicadores / Panel

Visión **gerencial en tiempo real**: KPIs operativos con **filtros** por flota,
camión y chofer, y **exportación a Excel**. El Panel de inicio resume el estado
general de la operación.

### Mensajes

**Canal directo chofer ↔ base**, con formato de chat (lista de conversaciones a un
lado y el hilo del otro). Reemplaza los grupos de WhatsApp para la comunicación
operativa del día a día.

---

## 10. Resumen del recorrido (de un vistazo)

```
BACKOFFICE                          CHOFER (celular)                 BACKOFFICE
──────────                          ────────────────                 ──────────
Alta de flota, personal
y choferes
        │
Alta de VIAJE  ───────────────►  Ve el viaje asignado
(Despachante)                          │
                                 Checklist + OEA (firma)
                                       │
                                 INICIAR (odómetro + GPS)
                                       │
                                 Bitácora en ruta
                                 (gastos, adelantos,
                                  combustible, fotos)
                                       │
                                 Incidentes  ──────────────►  Tablero + Alertas
                                       │
                                 FINALIZAR (odómetro + GPS)
                                       │
                                       └──────────────────►  RENDICIÓN
                                                             (gastos − adelantos)
                                                             Borrador → PDF → Cerrada
```

---

_Última actualización: 2026-08-15 — incorpora el alta autoservicio, los planes y
límites, el estado de cuenta y el pago por Mercado Pago (fases 0 a 9 del plan SaaS).
La **fase 10** —multi-empresa, API y SSO del plan Corporate— todavía no está
disponible._
