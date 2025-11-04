# 📋 Guía de Actualización de Appwrite - Sistema de Gestión Clínica

## ✅ Resumen Ejecutivo

**¿Qué necesitas hacer?** 
1. Crear 5 colecciones nuevas
2. Crear 2 buckets de storage
3. Agregar atributos a 3 colecciones existentes (articulos, clientes, empleados)

**¿Hay que borrar algo?** ❌ NO. Solo AGREGAR colecciones, buckets y atributos nuevos.

**¿Hay que actualizar appwrite.config.json manualmente?** ❌ NO. Se sincroniza automáticamente después con `npx appwrite pull`.

---

## 🎯 Paso 1: Acceder a Appwrite

1. Ve a tu consola de Appwrite
2. Selecciona el proyecto **"Lipoout"**
3. Ve a **Databases** → **Lipoout** (ID: `68b1d7530028045d94d3`)

---

## 📦 Paso 2: Crear Colecciones

### Colección 1: `bonos_cliente`

**ID de la colección:** `bonos_cliente`

**Atributos a crear:**

| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| cliente_id | String | 100 | ✅ | - | ❌ |
| bono_articulo_id | String | 100 | ✅ | - | ❌ |
| bono_nombre | String | 200 | ✅ | - | ❌ |
| fecha_compra | String | 30 | ✅ | - | ❌ |
| fecha_vencimiento | String | 30 | ❌ | - | ❌ |
| composicion_comprada | String | 10000 | ✅ | - | ❌ |
| composicion_restante | String | 10000 | ✅ | - | ❌ |
| factura_id | String | 100 | ❌ | - | ❌ |
| activo | Boolean | - | ✅ | - | ❌ |
| precio_pagado | Double | - | ✅ | - | ❌ |
| usos_restantes | Integer | - | ✅ | - | ❌ |
| notas | String | 2000 | ❌ | - | ❌ |
| creado_por | String | 100 | ❌ | - | ❌ |

**Configuración adicional:**
- `precio_pagado`: Min: 0, Max: 100000
- `usos_restantes`: Min: 0, Max: 10000

**Permisos de la colección:**
- ✅ Create: `users`
- ✅ Read: `users`
- ✅ Update: `users`
- ✅ Delete: `users`

---

### Colección 2: `sesiones_clinicas`

**ID de la colección:** `sesiones_clinicas`

**Atributos a crear:**

| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| cliente_id | String | 100 | ✅ | - | ❌ |
| cita_id | String | 100 | ❌ | - | ❌ |
| empleado_id | String | 100 | ✅ | - | ❌ |
| fecha_sesion | String | 30 | ✅ | - | ❌ |
| edad_en_sesion | Integer | - | ✅ | - | ❌ |
| antecedentes_personales | String | 5000 | ✅ | - | ❌ |
| motivo_consulta | String | 2000 | ✅ | - | ❌ |
| tratamiento | String | 5000 | ✅ | - | ❌ |
| proxima_cita | String | 1000 | ❌ | - | ❌ |
| articulos_aplicados | String | 10000 | ✅ | - | ❌ |
| documentos_firmados | String | 10000 | ✅ | - | ❌ |
| fotos | String | 10000 | ✅ | - | ❌ |
| notas_adicionales | String | 5000 | ❌ | - | ❌ |
| visible_para_cliente | Boolean | - | ✅ | - | ❌ |

**Configuración adicional:**
- `edad_en_sesion`: Min: 0, Max: 150

**Permisos de la colección:**
- ✅ Create: `users`
- ✅ Read: `users`
- ✅ Update: `users`
- ✅ Delete: `users`

---

### Colección 3: `notificaciones`

**ID de la colección:** `notificaciones`

**Atributos a crear:**

| Key | Type | Size | Required | Enum | Array |
|-----|------|------|----------|------|-------|
| tipo | String | 50 | ✅ | Ver abajo* | ❌ |
| titulo | String | 200 | ✅ | - | ❌ |
| mensaje | String | 1000 | ✅ | - | ❌ |
| prioridad | String | 20 | ✅ | Ver abajo** | ❌ |
| destinatarios | String | 5000 | ✅ | - | ❌ |
| referencia_tipo | String | 50 | ❌ | Ver abajo*** | ❌ |
| referencia_id | String | 100 | ❌ | - | ❌ |
| leida_por | String | 10000 | ✅ | - | ❌ |
| fecha_creacion | String | 30 | ✅ | - | ❌ |
| fecha_vencimiento | String | 30 | ❌ | - | ❌ |
| accionable | Boolean | - | ✅ | - | ❌ |
| url_accion | String | 500 | ❌ | - | ❌ |
| activa | Boolean | - | ✅ | - | ❌ |

**Valores Enum:**

\* **tipo** (selecciona todos):
- `bono_por_vencer`
- `bono_vencido`
- `cita_hoy`
- `cita_manana`
- `cliente_sin_actividad`
- `stock_bajo`
- `nueva_sesion_clinica`
- `documento_pendiente`
- `otro`

\*\* **prioridad** (selecciona todos):
- `alta`
- `media`
- `baja`

\*\*\* **referencia_tipo** (selecciona todos):
- `bono`
- `cita`
- `cliente`
- `articulo`
- `sesion`

**Permisos de la colección:**
- ✅ Create: `users`
- ✅ Read: `users`
- ✅ Update: `users`
- ✅ Delete: `users`

---

### Colección 4: `permisos`

**ID de la colección:** `permisos`

**Atributos a crear:**

| Key | Type | Size | Required | Enum | Array |
|-----|------|------|----------|------|-------|
| empleado_id | String | 100 | ✅ | - | ❌ |
| rol | String | 50 | ✅ | Ver abajo* | ❌ |
| ver_datos_clinicos | Boolean | - | ✅ | - | ❌ |
| editar_datos_clinicos | Boolean | - | ✅ | - | ❌ |
| ver_bonos | Boolean | - | ✅ | - | ❌ |
| gestionar_bonos | Boolean | - | ✅ | - | ❌ |
| ver_facturas | Boolean | - | ✅ | - | ❌ |
| editar_facturas | Boolean | - | ✅ | - | ❌ |
| ver_agenda | Boolean | - | ✅ | - | ❌ |
| gestionar_agenda | Boolean | - | ✅ | - | ❌ |
| ver_clientes | Boolean | - | ✅ | - | ❌ |
| editar_clientes | Boolean | - | ✅ | - | ❌ |
| ver_articulos | Boolean | - | ✅ | - | ❌ |
| editar_articulos | Boolean | - | ✅ | - | ❌ |
| acceso_configuracion | Boolean | - | ✅ | - | ❌ |
| acceso_reportes | Boolean | - | ✅ | - | ❌ |

**Valores Enum:**

\* **rol** (selecciona todos):
- `Admin`
- `Médico`
- `Recepción`
- `Lectura`
- `Esteticista`

**Permisos de la colección:**
- ✅ Create: `users`
- ✅ Read: `users`
- ✅ Update: `users`
- ✅ Delete: `users`

---

### Colección 5: `plantillas_documentos`

**ID de la colección:** `plantillas_documentos`

**Atributos a crear:**

| Key | Type | Size | Required | Enum | Array |
|-----|------|------|----------|------|-------|
| nombre | String | 200 | ✅ | - | ❌ |
| tipo | String | 50 | ✅ | Ver abajo* | ❌ |
| descripcion | String | 1000 | ❌ | - | ❌ |
| contenido | String | 50000 | ✅ | - | ❌ |
| campos | String | 10000 | ✅ | - | ❌ |
| archivo_base_id | String | 100 | ❌ | - | ❌ |
| archivo_base_url | String | 500 | ❌ | - | ❌ |
| activa | Boolean | - | ✅ | - | ❌ |
| requiere_firma | Boolean | - | ✅ | - | ❌ |
| version | String | 20 | ✅ | - | ❌ |
| fecha_creacion | String | 30 | ✅ | - | ❌ |
| creado_por | String | 100 | ✅ | - | ❌ |
| ultima_modificacion | String | 30 | ✅ | - | ❌ |
| modificado_por | String | 100 | ✅ | - | ❌ |
| veces_utilizada | Integer | - | ✅ | - | ❌ |

**Valores Enum:**

\* **tipo** (selecciona todos):
- `consentimiento_informado`
- `autorizacion_tratamiento`
- `politica_privacidad`
- `contrato_servicio`
- `prescripcion_medica`
- `plan_tratamiento`
- `otro`

**Configuración adicional:**
- `veces_utilizada`: Min: 0, Max: 1000000

**Permisos de la colección:**
- ✅ Create: `users`
- ✅ Read: `users`
- ✅ Update: `users`
- ✅ Delete: `users`

---

## 🗂️ Paso 3: Crear Buckets de Storage

Ve a la sección **Storage** en tu consola de Appwrite.

### Bucket 1: `documentos_firmados`

**Configuración:**
- **Bucket ID:** `documentos_firmados`
- **Name:** Documentos Firmados
- **Permissions:**
  - ✅ Create: `users`
  - ✅ Read: `users`
  - ✅ Update: `users`
  - ✅ Delete: `users`
- **Maximum File Size:** 10 MB (10485760 bytes)
- **Allowed File Extensions:** `pdf`
- **Compression:** ❌ Disabled
- **Encryption:** ✅ Enabled
- **Antivirus:** ✅ Enabled

### Bucket 2: `fotos_sesiones`

**Configuración:**
- **Bucket ID:** `fotos_sesiones`
- **Name:** Fotos de Sesiones
- **Permissions:**
  - ✅ Create: `users`
  - ✅ Read: `users`
  - ✅ Update: `users`
  - ✅ Delete: `users`
- **Maximum File Size:** 25 MB (26214400 bytes)
- **Allowed File Extensions:** `jpg`, `jpeg`, `png`, `heic`, `webp`
- **Compression:** ✅ Enabled
- **Encryption:** ✅ Enabled
- **Antivirus:** ✅ Enabled

---

## 🔧 Paso 4: Modificar Colecciones Existentes

**IMPORTANTE:** Debes agregar nuevos atributos a 3 colecciones existentes.

### Colección Existente: `articulos`

**Atributos NUEVOS a agregar:**

| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| composicion_bono | String | 10000 | ❌ | - | ❌ |
| sesiones_bono | Integer | - | ❌ | - | ❌ |
| duracion | Integer | - | ❌ | - | ❌ |

**Descripción de los campos:**
- `composicion_bono`: JSON con array de ComposicionBono[] (servicios y productos que incluye el bono)
- `sesiones_bono`: Número de sesiones del bono (usado solo para bonos)
- `duracion`: Duración en minutos del servicio o bono

**Configuración adicional:**
- `sesiones_bono`: Min: 1, Max: 1000
- `duracion`: Min: 1, Max: 1440 (minutos en un día)

**Instrucciones:**
1. Ve a la colección `articulos` existente
2. Click en **"Add Attribute"**
3. Agrega los 3 campos nuevos según la tabla

---

### Colección Existente: `clientes`

**Atributos NUEVOS a agregar:**

| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| antecedentes_personales | String | 5000 | ❌ | - | ❌ |

**Descripción del campo:**
- `antecedentes_personales`: Antecedentes médicos/personales del cliente (usado en sesiones clínicas)

**Instrucciones:**
1. Ve a la colección `clientes` existente
2. Click en **"Add Attribute"**
3. Agrega el campo según la tabla

---

### Colección Existente: `empleados`

**Atributos NUEVOS a agregar:**

| Key | Type | Size | Required | Default | Array |
|-----|------|------|----------|---------|-------|
| color | String | 20 | ❌ | - | ❌ |
| notificaciones_habilitadas | Boolean | - | ✅ | true | ❌ |

**Descripción de los campos:**
- `color`: Color hexadecimal (#RRGGBB) para identificar visualmente al empleado en la agenda
- `notificaciones_habilitadas`: Si el empleado recibe notificaciones del sistema

**Configuración adicional:**
- `notificaciones_habilitadas`: Default value: `true`

**Instrucciones:**
1. Ve a la colección `empleados` existente
2. Click en **"Add Attribute"**
3. Agrega los 2 campos nuevos según la tabla

---

## 🔄 Paso 5: Sincronizar Configuración Local

Una vez que hayas creado todas las colecciones y buckets en Appwrite, ejecuta:

```powershell
npx appwrite pull
```

Este comando sincronizará automáticamente tu archivo `appwrite.config.json` local con la configuración del servidor.

---

## ⚠️ Notas Importantes

### ❌ NO Borrar Nada

**NO borres ninguna colección existente.** Solo AGREGA las nuevas. Las colecciones existentes deben mantenerse:
- `clientes`
- `empleados`
- `citas`
- `recursos`
- `articulos`
- `proveedores`
- `familias`
- `subfamilias`
- `aparatos`
- `configuracion`
- `facturas`
- Etc.

### 📝 Campos JSON

Los siguientes campos contienen datos JSON y por eso tienen tamaños grandes:
- `composicion_comprada` / `composicion_restante` (10000): Array de servicios/productos del bono
- `articulos_aplicados` (10000): Array de artículos aplicados en la sesión
- `documentos_firmados` (10000): Array de documentos firmados con metadata
- `fotos` (10000): Array de fotos con anotaciones y metadata
- `destinatarios` (5000): Array de IDs de empleados
- `leida_por` (10000): Array de IDs de empleados que leyeron la notificación
- `campos` (10000): Array de campos dinámicos de la plantilla
- `contenido` (50000): HTML/Markdown del documento

### 🔐 Permisos

Todas las colecciones y buckets usan los mismos permisos:
- `users` - Solo usuarios autenticados pueden crear, leer, actualizar y borrar

### 📱 Script de Ayuda

Puedes ejecutar el script `create_collections_clinicos.ps1` para ver un resumen de todas las especificaciones:

```powershell
.\create_collections_clinicos.ps1
```

---

## 📊 Resumen Visual

```
📦 5 Colecciones Nuevas
├─ bonos_cliente (13 atributos)
├─ sesiones_clinicas (13 atributos)
├─ notificaciones (13 atributos)
├─ permisos (17 atributos)
└─ plantillas_documentos (15 atributos)

🔧 3 Colecciones a Modificar
├─ articulos (+3 atributos: composicion_bono, sesiones_bono, duracion)
├─ clientes (+1 atributo: antecedentes_personales)
└─ empleados (+2 atributos: color, notificaciones_habilitadas)

🗂️ 2 Buckets Nuevos
├─ documentos_firmados (PDFs hasta 10MB)
└─ fotos_sesiones (Imágenes hasta 25MB)
```

---

## ✅ Checklist de Verificación

Antes de sincronizar, verifica que:

**Colecciones Nuevas:**
- [ ] Las 5 colecciones nuevas están creadas con todos sus atributos
- [ ] Todos los campos enum tienen sus valores configurados
- [ ] Todos los campos numéricos tienen sus rangos min/max
- [ ] Los permisos de cada colección están configurados (create, read, update, delete)

**Colecciones Modificadas:**
- [ ] Colección `articulos`: 3 atributos nuevos agregados (composicion_bono, sesiones_bono, duracion)
- [ ] Colección `clientes`: 1 atributo nuevo agregado (antecedentes_personales)
- [ ] Colección `empleados`: 2 atributos nuevos agregados (color, notificaciones_habilitadas)

**Storage:**
- [ ] Los 2 buckets de storage están creados
- [ ] Los buckets tienen las extensiones de archivo permitidas
- [ ] Los buckets tienen los tamaños máximos configurados
- [ ] Los buckets tienen sus permisos configurados
- [ ] Los buckets tienen encryption y antivirus habilitados

Una vez verificado todo, ejecuta `npx appwrite pull` para sincronizar.

---

## 🎉 ¡Listo!

Después de completar estos pasos y sincronizar, tu aplicación tendrá acceso a:

✅ **Sistema de Bonos** - Gestión completa de bonos con composición y vencimientos
✅ **Sistema de Datos Clínicos** - Formularios de sesión con documentos y fotos
✅ **Sistema de Notificaciones** - Alertas dirigidas a empleados específicos
✅ **Sistema de Permisos** - Control de acceso granular por empleado
✅ **Plantillas de Documentos** - Documentos reutilizables con campos dinámicos

Todo el código TypeScript ya está implementado y listo para usar. 🚀
