import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MigrationLog extends Models.Document {
  migration_type: string;
  status2: 'running' | 'completed' | 'failed';
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const MIGRATION_LOGS_COLLECTION_ID = 'migration_logs';
const REFRESH_INTERVAL = 3000; // 3 segundos

export const MigrationLogsViewer = () => {
  const [logs, setLogs] = useState<MigrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await databases.listDocuments<MigrationLog>(
        DATABASE_ID,
        MIGRATION_LOGS_COLLECTION_ID,
        [Query.orderDesc('started_at'), Query.limit(20)]
      );
      setLogs(response.documents);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    // Verificar si hay migraciones en progreso
    const hasRunning = logs.some(log => log.status2 === 'running');
    
    if (!hasRunning) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, logs]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />En progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completada</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Fallida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgress = (log: MigrationLog) => {
    if (log.total_records === 0) return 0;
    return Math.round((log.processed_records / log.total_records) * 100);
  };

  const getDuration = (log: MigrationLog) => {
    const start = new Date(log.started_at);
    const end = log.completed_at ? new Date(log.completed_at) : new Date();
    
    // FIX para RangeError: Invalid time value - Asegura que las fechas son válidas antes de calcular
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';

    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const getMigrationTypeLabel = (type: string) => {
    switch (type) {
      case 'search_unified':
        return '🔍 Búsqueda Unificada';
      case 'cliente_nombre':
        return '📅 Cliente en Citas';
      case 'all':
        return '⚡ Todas';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Logs de Migraciones
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay logs de migración disponibles
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Exitosos</TableHead>
                  <TableHead>Errores</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Iniciado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  // FIX para RangeError: Invalid time value - Pre-validación de la fecha de inicio
                  const startedAtDate = new Date(log.started_at);
                  const isStartedAtValid = !isNaN(startedAtDate.getTime());

                  return (
                    <TableRow key={log.$id} className={log.status2 === 'running' ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                      <TableCell className="font-medium">
                        {getMigrationTypeLabel(log.migration_type)}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status2)}</TableCell>
                      <TableCell>
                        {log.status2 === 'running' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgress(log)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[45px]">
                              {log.processed_records}/{log.total_records}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {log.processed_records}/{log.total_records}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {log.successful_records}
                      </TableCell>
                      <TableCell className={log.failed_records > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                        {log.failed_records}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getDuration(log)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {isStartedAtValid
                          ? formatDistanceToNow(startedAtDate, { 
                              addSuffix: true,
                              locale: es 
                            })
                          : 'Fecha inválida'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {logs.some(log => log.status2 === 'running') && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⏳ Hay migraciones en progreso. Esta tabla se actualiza automáticamente cada 3 segundos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};