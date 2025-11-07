const { Client, Databases, Storage, ID, Query, AppwriteException } = require('node-appwrite');
const Papa = require('papaparse');

// ============= UTILIDADES NECESARIAS =============
const generateSearchUnified = (cliente) => {
    const parts = [
        cliente.nombre_completo,
        cliente.nomcli,
        cliente.ape1cli,
        cliente.tel1cli,
        cliente.tel2cli,
        cliente.email,
        cliente.dnicli,
        cliente.codcli
    ].filter(Boolean);
    
    return parts.join(' ').toLowerCase().trim();
};
// =================================================

module.exports = async ({ req, res, log, error }) => {
    log('CSV Import Function started (Optimized: Inline Search Unified).');

    const client = new Client();
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://appwrite/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);

    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
    const CLIENTS_COLLECTION_ID = process.env.APPWRITE_CLIENTS_COLLECTION_ID;
    const IMPORT_LOGS_COLLECTION_ID = 'import_logs';
    const IMPORT_BUCKET_ID = 'lipoout';

    let successfulImports = 0;
    let totalProcessed = 0;
    const importErrors = [];
    const importWarnings = [];
    let errorSummary = {};
    const timestamp = new Date().toISOString();
    let fileName = 'unknown-file';
    let fileId = 'unknown'; 
    const importLogId = ID.unique();
    
    const detailedImportResults = []; 

    const addIssue = (issueList, message, rowNumber, codcli) => { 
        const detail = `Fila ${rowNumber} (Cod: ${codcli || 'N/A'}): ${message}`; 
        issueList.push(detail);
        try {
            const messageStr = String(message); 
            const errorType = messageStr.includes('Error') ? messageStr.split(':').shift().trim() : 'Advertencia'; 
            errorSummary[errorType] = (errorSummary[errorType] || 0) + 1;
        } catch (e) {
            errorSummary['Error no categorizado'] = (errorSummary['Error no categorizado'] || 0) + 1;
        }
    };
    
    const calculateAge = (dob) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validateDniNie = (dni) => {
        // CORRECCIÓN: Si no hay DNI, se omite la advertencia. Se considera válido con isWarning: false.
        if (!dni) return { isValid: true, message: 'DNI/NIE no proporcionado (omitido).', isWarning: false };
        dni = dni.toUpperCase().trim();
        const dniRegex = /^(\d{8})([A-Z])$/;
        const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
        const letterMap = 'TRWAGMYFPDXBNJZSQVHLCKE';

        if (dniRegex.test(dni)) {
            const [, num, letter] = dni.match(dniRegex);
            const expectedLetter = letterMap[parseInt(num) % 23];
            if (letter !== expectedLetter) {
                return { isValid: true, message: `DNI con letra incorrecta. Se esperaba ${expectedLetter} (advertencia).`, isWarning: true };
            }
            return { isValid: true, message: 'DNI válido.' };
        } else if (nieRegex.test(dni)) {
            const niePrefix = dni.charAt(0);
            const nieNum = (niePrefix === 'X' ? '0' : niePrefix === 'Y' ? '1' : '2') + dni.substring(1, 8);
            const letter = dni.charAt(8);
            const expectedLetter = letterMap[parseInt(nieNum) % 23];
            if (letter !== expectedLetter) {
                return { isValid: true, message: `NIE con letra incorrecta. Se esperaba ${expectedLetter} (advertencia).`, isWarning: true };
            }
            return { isValid: true, message: 'NIE válido.' };
        } else {
            return { isValid: false, message: 'Formato de DNI/NIE inválido.' };
        }
    };
    
    const validateMobilePhone = (phone) => {
        if (!phone || phone.trim() === '0' || phone.trim() === '') {
            return { isValid: true, message: 'Teléfono no proporcionado o es cero (omitido).', isWarning: true };
        }
        const mobileRegex = /^[67]\d{8}$/;
        return { isValid: mobileRegex.test(phone), message: mobileRegex.test(phone) ? 'Teléfono móvil válido.' : 'Teléfono principal inválido (debe empezar por 6 o 7 y tener 9 dígitos).' };
    };
    
    const validateClient = (clientData, isStrict = true) => {
        const errors = {};
        const warnings = {};
    
        if (!clientData.codcli || !/^\d{6}$/.test(clientData.codcli)) errors.codcli = 'El código de cliente es requerido y debe tener 6 dígitos.';
        if ((isStrict || clientData.nomcli) && !clientData.nomcli) warnings.nomcli = 'El nombre es requerido (advertencia).'; 
        
        if (clientData.email && !/\S+@\S+\.\S+/.test(clientData.email)) {
            errors.email = 'Email inválido.';
        } else if (isStrict && !clientData.email) {
            errors.email = 'Email requerido.';
        }
      
        const dniValidation = validateDniNie(clientData.dnicli);
        if (!dniValidation.isValid) {
            errors.dnicli = dniValidation.message;
        } else if (dniValidation.isWarning) {
            warnings.dnicli = dniValidation.message;
        }
    
        const tel2Validation = validateMobilePhone(clientData.tel2cli);
        if (!tel2Validation.isValid) {
            errors.tel2cli = tel2Validation.message;
        } else if (tel2Validation.isWarning) {
            warnings.tel2cli = tel2Validation.message;
        }
    
        if (clientData.fecnac && calculateAge(clientData.fecnac) < 0) errors.fecnac = 'La fecha de nacimiento no puede ser futura.';
    
        return { errors, warnings };
    };
    
    const convertDate = (dateStr) => {
        if (!dateStr) return undefined;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [day, monthStr, yearShort] = parts;
            const monthMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };
            const month = monthMap[monthStr];
            if (month) {
                let fullYear = parseInt(yearShort, 10);
                fullYear += (fullYear < 30) ? 2000 : 1900;
                return `${fullYear}-${month}-${day.padStart(2, '0')}`;
            }
        }
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj) && dateObj.getFullYear() > 1900) {
            return dateObj.toISOString().split('T')[0];
        }
        return undefined;
    };


    try {
        // 1. Obtener el archivo más reciente
        log('Searching for the latest file in the import bucket...');
        const fileList = await storage.listFiles(IMPORT_BUCKET_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(1)
        ]);

        if (fileList.total === 0 || fileList.files.length === 0) {
            throw new Error('No files found in the import bucket.');
        }

        const latestFile = fileList.files[0];
        fileId = latestFile.$id;
        fileName = latestFile.name;

        if (!fileName.toLowerCase().endsWith('.csv')) {
            log(`Ignoring non-CSV file: ${fileName}.`);
            return res.json({ ok: true, message: `Archivo ${fileName} ignorado por no ser CSV.` }, 200);
        }

        log(`Processing CSV file: ${fileName} (ID: ${fileId}) from bucket: ${IMPORT_BUCKET_ID}`);

        const fileBuffer = await storage.getFileDownload(IMPORT_BUCKET_ID, fileId);
        const fileContent = fileBuffer.toString('utf8');

        const results = Papa.parse(fileContent, { header: true, skipEmptyLines: true, delimiter: ',' });
        totalProcessed = results.data.length;

        if (results.errors.length > 0) {
            results.errors.forEach(err => error(`CSV Parsing Error: ${err.message}`));
            results.errors.forEach(e => addIssue(importErrors, `Error de parseo: ${e.message} en fila ${e.row}`, e.row, 'N/A'));
        }

        // 2. Procesar cada fila e importar/actualizar (incluyendo nombre_completo y search_unified)
        for (const [index, row] of results.data.entries()) {
            const clientData = row;
            const rowNumber = index + 2;

            const newClientRecord = {
                codcli: clientData.codcli || '',
                nomcli: clientData.nomcli || undefined,
                ape1cli: clientData.ape1cli || undefined,
                email: clientData.email || undefined,
                dnicli: clientData.dnicli || undefined,
                dircli: clientData.dircli || undefined,
                codposcli: clientData.codposcli || undefined,
                pobcli: clientData.pobcli || undefined,
                procli: clientData.procli || undefined,
                tel1cli: clientData.tel1cli || undefined,
                tel2cli: clientData.tel2cli || undefined,
                fecnac: convertDate(clientData.fecnac),
                enviar: clientData.enviar === '1' ? 1 : (clientData.enviar === '0' ? 0 : undefined),
                sexo: ['H', 'M', 'Otro'].includes(clientData.sexo) ? clientData.sexo : undefined,
                fecalta: convertDate(clientData.fecalta),
            };
            
            // Calculo de nombre_completo
            const nombreCompleto = `${newClientRecord.nomcli || ''} ${newClientRecord.ape1cli || ''}`.trim();
            const clientToSave = { 
                ...newClientRecord, 
                nombre_completo: nombreCompleto
            };

            const { errors: validationErrors, warnings } = validateClient(newClientRecord, false);

            if (Object.keys(validationErrors).length > 0) {
                const errorMsg = `Importación fallida: ${Object.values(validationErrors).join('; ')}`;
                Object.values(validationErrors).forEach(msg => addIssue(importErrors, msg, rowNumber, newClientRecord.codcli));
                detailedImportResults.push({ codcli: newClientRecord.codcli, nombre: nombreCompleto, status: 'ERROR', message: errorMsg });
                continue;
            }

            try {
                // Campos adicionales
                clientToSave.edad = newClientRecord.fecnac ? calculateAge(newClientRecord.fecnac) : undefined;
                clientToSave.importErrors = Object.values(warnings);
                // CÁLCULO Y ASIGNACIÓN DE search_unified INLINE
                clientToSave.search_unified = generateSearchUnified(clientToSave); 
                
                let clientId;
                const existing = await databases.listDocuments(DATABASE_ID, CLIENTS_COLLECTION_ID, [Query.equal('codcli', newClientRecord.codcli)]);

                if (existing.documents.length > 0) {
                    await databases.updateDocument(DATABASE_ID, CLIENTS_COLLECTION_ID, existing.documents[0].$id, clientToSave);
                    clientId = existing.documents[0].$id;
                    successfulImports++;
                } else {
                    // USO CORRECTO DE PERMISSIONS: [] como 5to argumento
                    const newDoc = await databases.createDocument(DATABASE_ID, CLIENTS_COLLECTION_ID, ID.unique(), clientToSave, []); 
                    clientId = newDoc.$id;
                    successfulImports++;
                }
                
                let statusMsg = `OK`;
                let finalStatus = 'OK';
                
                // Muestra solo otras advertencias que no sean la de DNI
                const otherWarnings = Object.values(warnings).filter(w => !w.includes('DNI/NIE no proporcionado (omitido).'));

                if (otherWarnings.length > 0) {
                    statusMsg = `Advertencias: ${otherWarnings.join('; ')}`;
                    finalStatus = 'WARNING';
                }
                
                addIssue(importWarnings, `Importado/Actualizado correctamente.`, rowNumber, newClientRecord.codcli);
                
                detailedImportResults.push({ 
                    codcli: newClientRecord.codcli, 
                    nombre: nombreCompleto, 
                    status: finalStatus, 
                    message: statusMsg
                });
                
            } catch (dbError) {
                const msg = (dbError instanceof AppwriteException) ? `${dbError.message} (Type: ${dbError.type})` : dbError.message;
                error(`DB Error for client ${newClientRecord.codcli}: ${msg}`);
                addIssue(importErrors, `Error de DB: ${msg}`, rowNumber, newClientRecord.codcli);
                detailedImportResults.push({ codcli: newClientRecord.codcli, nombre: nombreCompleto, status: 'ERROR', message: `Error de BD: ${msg}` });
            }
        }
        
        // 3. CONSOLIDACIÓN DE LOGS Y ESTRUCTURA DE MENSAJE FINAL (SIMPLIFICADA)
        let logStatus = 'completed';
        const totalFailed = totalProcessed - successfulImports;
        
        if (importErrors.length > 0) {
            logStatus = 'completed_with_errors';
        }
        if (importErrors.length > 0 && successfulImports === 0) {
            logStatus = 'failed';
        }

        const logHeader = `--- RESUMEN DE IMPORTACIÓN Y MIGRACIÓN INLINE ---
Clientes procesados: ${totalProcessed}
Clientes importados/actualizados con éxito (con Búsqueda Unificada): ${successfulImports}
Clientes fallidos: ${totalFailed}`;
        
        let newErrorMessage = logHeader;
        newErrorMessage += '\n\n--- DETALLE POR CLIENTE ---';
        newErrorMessage += '\nFormato: [ESTADO] [Cod: CODCLIENTE] Nombre Completo: Errores/Advertencias de Importación';
        newErrorMessage += '\n\n';
        
        const finalClientDetails = [];
        
        detailedImportResults.forEach(r => {
            // El formato de la salida de r.message ya está simplificado, solo se limpia ligeramente para el log final.
            const message = r.message.replace('Importación/Actualización OK.', 'OK'); 
            finalClientDetails.push(`[${r.status}] [Cod: ${r.codcli}] ${r.nombre}: ${message}`);
        });
        
        newErrorMessage += finalClientDetails.join('\n');
        
        // El resumen técnico ha sido eliminado por solicitud del usuario.

        // 4. Guardar el documento de log final (TRUNCADO A 100,000 CARACTERES)
        const MAX_LOG_LENGTH = 100000; 
        const finalMessage = newErrorMessage.substring(0, MAX_LOG_LENGTH); 
        
        await databases.createDocument(DATABASE_ID, IMPORT_LOGS_COLLECTION_ID, importLogId, {
            file_id: fileId,
            file_name: fileName,
            status: logStatus,
            total_rows: totalProcessed,
            processed_rows: totalProcessed,
            successful_rows: successfulImports,
            failed_rows: totalFailed,
            error_message: finalMessage, 
            started_at: timestamp,
            completed_at: new Date().toISOString()
        }, []); 

        
        log(`🎉 Importación y Búsqueda Unificada completadas INLINE. ID Log: ${importLogId}. Estado: ${logStatus}`);
        
        return res.json({ ok: true, message: `Importación y migración de Búsqueda Unificada finalizadas.`, successfulImports, totalProcessed, status: logStatus }, 200);

    } catch (err) {
        // 5. MANEJO DE ERROR CRÍTICO
        error(`Unhandled error during import/migration: ${err.message}`);
        const errorMessage = (err instanceof AppwriteException) ? `${err.message} (Type: ${err.type})` : err.message;
        
        try {
            const MAX_LOG_LENGTH = 100000;
            const finalCriticalMessage = `ERROR CRÍTICO (Importación/Migración): ${errorMessage}`.substring(0, MAX_LOG_LENGTH); 
            
            await databases.createDocument(DATABASE_ID, IMPORT_LOGS_COLLECTION_ID, ID.unique(), {
                file_id: fileId, 
                file_name: fileName, 
                status: 'failed',
                total_rows: totalProcessed,
                processed_rows: successfulImports,
                successful_rows: successfulImports,
                failed_rows: totalProcessed - successfulImports,
                error_message: finalCriticalMessage,
                started_at: timestamp,
                completed_at: new Date().toISOString()
            }, []);
        } catch (logError) {
            error(`Failed to save failure log: ${logError.message}`);
        }
        return res.json({ ok: false, message: `Error interno del servidor: ${errorMessage}` }, 500);
    }
};