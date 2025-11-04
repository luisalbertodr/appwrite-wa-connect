# Script para generar appwrite.config.json completo con las colecciones del sistema de gestión clínica
# Uso: .\create_collections_clinicos.ps1

Write-Host "=== Generando appwrite.config.json completo ===" -ForegroundColor Cyan

# Este script genera las nuevas colecciones necesarias para el sistema de gestión clínica
# Las colecciones nuevas son:
# 1. bonos_cliente
# 2. sesiones_clinicas
# 3. notificaciones
# 4. permisos
# 5. plantillas_documentos

Write-Host "`nCOLECCIONES NUEVAS A CREAR EN APPWRITE:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Write-Host "`n1. Colección: bonos_cliente" -ForegroundColor Green
Write-Host "   ID: bonos_cliente"
Write-Host "   Attributes:"
Write-Host "   - cliente_id (string, 100, required)"
Write-Host "   - bono_articulo_id (string, 100, required)"
Write-Host "   - bono_nombre (string, 200, required)"
Write-Host "   - fecha_compra (string, 30, required)"
Write-Host "   - fecha_vencimiento (string, 30, optional)"
Write-Host "   - composicion_comprada (string, 10000, required) - JSON"
Write-Host "   - composicion_restante (string, 10000, required) - JSON"
Write-Host "   - factura_id (string, 100, optional)"
Write-Host "   - activo (boolean, required)"
Write-Host "   - precio_pagado (double, required, min: 0, max: 100000)"
Write-Host "   - usos_restantes (integer, required, min: 0, max: 10000)"
Write-Host "   - notas (string, 2000, optional)"
Write-Host "   - creado_por (string, 100, optional)"

Write-Host "`n2. Colección: sesiones_clinicas" -ForegroundColor Green
Write-Host "   ID: sesiones_clinicas"
Write-Host "   Attributes:"
Write-Host "   - cliente_id (string, 100, required)"
Write-Host "   - cita_id (string, 100, optional)"
Write-Host "   - empleado_id (string, 100, required)"
Write-Host "   - fecha_sesion (string, 30, required)"
Write-Host "   - edad_en_sesion (integer, required, min: 0, max: 150)"
Write-Host "   - antecedentes_personales (string, 5000, required)"
Write-Host "   - motivo_consulta (string, 2000, required)"
Write-Host "   - tratamiento (string, 5000, required)"
Write-Host "   - proxima_cita (string, 1000, optional)"
Write-Host "   - articulos_aplicados (string, 10000, required) - JSON"
Write-Host "   - documentos_firmados (string, 10000, required) - JSON"
Write-Host "   - fotos (string, 10000, required) - JSON"
Write-Host "   - notas_adicionales (string, 5000, optional)"
Write-Host "   - visible_para_cliente (boolean, required)"

Write-Host "`n3. Colección: notificaciones" -ForegroundColor Green
Write-Host "   ID: notificaciones"
Write-Host "   Attributes:"
Write-Host "   - tipo (string, 50, required, enum: ['bono_por_vencer','bono_vencido','cita_hoy','cita_manana','cliente_sin_actividad','stock_bajo','nueva_sesion_clinica','documento_pendiente','otro'])"
Write-Host "   - titulo (string, 200, required)"
Write-Host "   - mensaje (string, 1000, required)"
Write-Host "   - prioridad (string, 20, required, enum: ['alta','media','baja'])"
Write-Host "   - destinatarios (string, 5000, required) - JSON array de empleado_ids"
Write-Host "   - referencia_tipo (string, 50, optional, enum: ['bono','cita','cliente','articulo','sesion'])"
Write-Host "   - referencia_id (string, 100, optional)"
Write-Host "   - leida_por (string, 10000, required) - JSON array"
Write-Host "   - fecha_creacion (string, 30, required)"
Write-Host "   - fecha_vencimiento (string, 30, optional)"
Write-Host "   - accionable (boolean, required)"
Write-Host "   - url_accion (string, 500, optional)"
Write-Host "   - activa (boolean, required)"

Write-Host "`n4. Colección: permisos" -ForegroundColor Green
Write-Host "   ID: permisos"
Write-Host "   Attributes:"
Write-Host "   - empleado_id (string, 100, required)"
Write-Host "   - rol (string, 50, required, enum: ['Admin','Médico','Recepción','Lectura'])"
Write-Host "   - ver_datos_clinicos (boolean, required)"
Write-Host "   - editar_datos_clinicos (boolean, required)"
Write-Host "   - ver_bonos (boolean, required)"
Write-Host "   - gestionar_bonos (boolean, required)"
Write-Host "   - ver_facturas (boolean, required)"
Write-Host "   - editar_facturas (boolean, required)"
Write-Host "   - ver_agenda (boolean, required)"
Write-Host "   - gestionar_agenda (boolean, required)"
Write-Host "   - ver_clientes (boolean, required)"
Write-Host "   - editar_clientes (boolean, required)"
Write-Host "   - ver_articulos (boolean, required)"
Write-Host "   - editar_articulos (boolean, required)"
Write-Host "   - acceso_configuracion (boolean, required)"
Write-Host "   - acceso_reportes (boolean, required)"

Write-Host "`n5. Colección: plantillas_documentos" -ForegroundColor Green
Write-Host "   ID: plantillas_documentos"
Write-Host "   Attributes:"
Write-Host "   - nombre (string, 200, required)"
Write-Host "   - tipo (string, 50, required, enum: ['consentimiento_informado','autorizacion_tratamiento','politica_privacidad','contrato_servicio','prescripcion_medica','plan_tratamiento','otro'])"
Write-Host "   - descripcion (string, 1000, optional)"
Write-Host "   - contenido (string, 50000, required) - HTML/Markdown"
Write-Host "   - campos (string, 10000, required) - JSON de CampoPlantilla[]"
Write-Host "   - archivo_base_id (string, 100, optional)"
Write-Host "   - archivo_base_url (string, 500, optional)"
Write-Host "   - activa (boolean, required)"
Write-Host "   - requiere_firma (boolean, required)"
Write-Host "   - version (string, 20, required)"
Write-Host "   - fecha_creacion (string, 30, required)"
Write-Host "   - creado_por (string, 100, required)"
Write-Host "   - ultima_modificacion (string, 30, required)"
Write-Host "   - modificado_por (string, 100, required)"
Write-Host "   - veces_utilizada (integer, required, min: 0, max: 1000000)"

Write-Host "`n`nBUCKETS DE STORAGE A CREAR:" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow

Write-Host "`n1. Bucket: documentos_firmados" -ForegroundColor Green
Write-Host "   ID: documentos_firmados"
Write-Host "   Permisos: read(\"users\"), write(\"users\"), delete(\"users\")"
Write-Host "   Max file size: 10MB"
Write-Host "   Allowed extensions: ['pdf']"
Write-Host "   Encryption: Enabled"
Write-Host "   Antivirus: Enabled"

Write-Host "`n2. Bucket: fotos_sesiones" -ForegroundColor Green
Write-Host "   ID: fotos_sesiones"
Write-Host "   Permisos: read(\"users\"), write(\"users\"), delete(\"users\")"
Write-Host "   Max file size: 25MB"
Write-Host "   Allowed extensions: ['jpg','jpeg','png','heic','webp']"
Write-Host "   Compression: Enabled"
Write-Host "   Antivirus: Enabled"

Write-Host "`n`n=== INSTRUCCIONES PARA ACTUALIZAR APPWRITE ===" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "`n1. Ve a la consola de Appwrite"
Write-Host "2. Selecciona tu proyecto 'Lipoout'"
Write-Host "3. Ve a Databases > Lipoout (ID: 68b1d7530028045d94d3)"
Write-Host "4. Crea cada una de las 5 colecciones nuevas con sus atributos"
Write-Host "5. Ve a Storage y crea los 2 buckets nuevos"
Write-Host "6. Configura los permisos de cada colección:"
Write-Host "   - create(`"users`")"
Write-Host "   - read(`"users`")"
Write-Host "   - update(`"users`")"
Write-Host "   - delete(`"users`")"
Write-Host "`n7. IMPORTANTE: Los campos marcados como JSON deben tener size suficiente"
Write-Host "   - composicion_comprada/restante: 10000"
Write-Host "   - articulos_aplicados: 10000"
Write-Host "   - documentos_firmados: 10000"
Write-Host "   - fotos: 10000"
Write-Host "   - destinatarios: 5000"
Write-Host "   - leida_por: 10000"
Write-Host "   - campos (plantillas): 10000"
Write-Host "   - contenido (plantillas): 50000"

Write-Host "`n`n=== QUÉ NO BORRAR ===" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host "NO borres ninguna colección existente."
Write-Host "Solo AGREGA las 5 colecciones nuevas y 2 buckets nuevos."
Write-Host "`nTodas las colecciones actuales deben mantenerse intactas:"
Write-Host "- clientes"
Write-Host "- empleados"
Write-Host "- citas"
Write-Host "- recursos"
Write-Host "- articulos"
Write-Host "- etc."

Write-Host "`n`n=== NOTAS IMPORTANTES ===" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "1. NO necesitas actualizar appwrite.config.json manualmente"
Write-Host "2. El archivo appwrite.config.json se actualiza automáticamente cuando creas las colecciones"
Write-Host "3. Después de crear todo en Appwrite, ejecuta: npx appwrite pull"
Write-Host "4. Esto sincronizará tu appwrite.config.json local con la configuración del servidor"

Write-Host "`n`n✅ Script completado. Revisa las instrucciones arriba." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
