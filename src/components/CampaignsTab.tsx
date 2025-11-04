
import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { Client, Template, Campaign, MessageLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Download, Loader2, Search, Save, FileText, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { client, functions, Query, Models } from 'appwrite';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { calculateAge } from '@/lib/validators';
import { useTemplates } from '@/hooks/useTemplates';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClients } from '@/hooks/useClients';
import LoadingSpinner from './LoadingSpinner';

const FILTERS_STORAGE_KEY_CAMPAIGNS = 'campaign-filters';

const statusTranslations: { [key: string]: string } = {
    pending: 'Pendiente',
    sending: 'Enviando',
    scheduled: 'Programada',
    failed: 'Fallida',
    completed: 'Completada',
    sent: 'Completada',
    completed_with_errors: 'Completada con errores',
};

export function CampaignsTab() {
    const { toast } = useToast();

    const [filters, setFilters] = useState(() => {
        const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY_CAMPAIGNS);
        return savedFilters ? JSON.parse(savedFilters) : { nomcli: '', pobcli: '', edad: '', intereses: '' };
    });
    
    const { data: clients = [], total, isLoading: loadingClients, applyQueries } = useClients();
    const { data: templates = [], isLoading: loadingTemplates, createTemplate } = useTemplates();
    const { data: campaigns = [], isLoading: loadingCampaigns, createCampaign, getCampaignLogs } = useCampaigns();

    const [newTemplate, setNewTemplate] = useState<Omit<Template, '$id'>>({ name: '', messages: ['', '', '', ''], imageUrls: ['', '', '', ''] });
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [progress, setProgress] = useState({ sent: 0, failed: 0, skipped: 0, total: 0 });
    const [selectedClients, setSelectedClients] = useState<Map<string, Client>>(new Map());
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [showLogDialog, setShowLogDialog] = useState(false);
    const [logContent, setLogContent] = useState<MessageLog[]>([]);

    const buildQueriesFromFilters = useCallback(() => {
        const queries: string[] = [];
        if (filters.nomcli) queries.push(Query.search('nomcli', filters.nomcli));
        if (filters.pobcli) queries.push(Query.equal('pobcli', filters.pobcli));
        if (filters.edad) {
            const [min, max] = filters.edad.split('-').map(Number);
            if (!isNaN(min)) queries.push(Query.greaterThanEqual('edad', min));
            if (!isNaN(max)) queries.push(Query.lessThanEqual('edad', max));
        }
        if (filters.intereses) {
            filters.intereses.split(',').forEach((interest: string) => {
                if (interest.trim()) {
                    queries.push(Query.search('intereses', interest.trim()));
                }
            });
        }
        return queries;
    }, [filters]);

    useEffect(() => {
        const queries = buildQueriesFromFilters();
        applyQueries(queries);
        localStorage.setItem(FILTERS_STORAGE_KEY_CAMPAIGNS, JSON.stringify(filters));
    }, [filters, applyQueries, buildQueriesFromFilters]);

    const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleClientSelection = (client: Client & Models.Document) => {
        setSelectedClients(prev => {
            const newMap = new Map(prev);
            if (newMap.has(client.$id)) {
                newMap.delete(client.$id);
            } else {
                newMap.set(client.$id, client);
            }
            return newMap;
        });
    };

    const handleSelectAllClients = () => {
        if (selectedClients.size === clients.length) {
            setSelectedClients(new Map());
        } else {
            const newMap = new Map<string, Client>();
            clients.forEach((c: Client & Models.Document) => newMap.set(c.$id, c));
            setSelectedClients(newMap);
        }
    };

    const handleSaveTemplate = async () => {
        if (!newTemplate.name || newTemplate.messages.every(m => !m)) {
            toast({ title: 'Error', description: 'El nombre y al menos un mensaje son requeridos.', variant: 'destructive' });
            return;
        }
        try {
            await createTemplate(newTemplate);
            toast({ title: 'Éxito', description: 'Plantilla guardada correctamente.' });
            setNewTemplate({ name: '', messages: ['', '', '', ''], imageUrls: ['', '', '', ''] });
        } catch (error) {
            console.error('Error saving template:', error);
            toast({ title: 'Error', description: 'No se pudo guardar la plantilla.', variant: 'destructive' });
        }
    };

    const startCampaign = async (isScheduled: boolean) => {
        if (!selectedTemplateId) {
            toast({ title: 'Error', description: 'Por favor, selecciona una plantilla.', variant: 'destructive' });
            return;
        }
        if (selectedClients.size === 0) {
            toast({ title: 'Error', description: 'Por favor, selecciona al menos un cliente.', variant: 'destructive' });
            return;
        }

        let schedule: Date | null = null;
        if (isScheduled) {
            if (!scheduledDate || !scheduledTime) {
                toast({ title: 'Error', description: 'Por favor, especifica fecha y hora para la campaña programada.', variant: 'destructive' });
                return;
            }
            schedule = new Date(`${scheduledDate}T${scheduledTime}`);
            if (isNaN(schedule.getTime())) {
                toast({ title: 'Error', description: 'Fecha u hora inválida.', variant: 'destructive' });
                return;
            }
        }

        setIsSending(true);
        const campaignClients = Array.from(selectedClients.values());
        const campaignName = templates.find(t => t.$id === selectedTemplateId)?.name || 'Campaña sin nombre';

        const newCampaignData: Partial<Campaign> = {
            name: campaignName,
            templateId: selectedTemplateId,
            clients: JSON.stringify(campaignClients.map(c => ({ $id: c.$id, nomcli: c.nomcli, tel1cli: c.tel1cli }))),
            scheduledDate: schedule?.toISOString(),
            status: isScheduled ? 'scheduled' : 'pending',
            audienceCount: campaignClients.length,
        };
        
        try {
            const createdCampaign = await createCampaign(newCampaignData as LipooutUserInput<Campaign>);
            setActiveCampaignId(createdCampaign.$id);
            if (!isScheduled) {
                 await functions.createExecution('sendCampaign', createdCampaign.$id);
            }
            toast({ title: 'Éxito', description: `Campaña ${isScheduled ? 'programada' : 'iniciada'} correctamente.` });
        } catch (error) {
            console.error("Error starting campaign:", error);
            toast({ title: 'Error', description: 'No se pudo iniciar la campaña.', variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const viewLogs = async (campaignId: string) => {
        try {
            const logs = await getCampaignLogs(campaignId);
            setLogContent(logs);
            setShowLogDialog(true);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los logs.", variant: "destructive" });
        }
    };

    if (loadingClients || loadingTemplates || loadingCampaigns) {
        return <div className="flex items-center justify-center p-10"><LoadingSpinner /> <span className='ml-2'>Cargando datos...</span></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>1. Gestión de Plantillas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Nombre de la plantilla"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                         {newTemplate.messages.map((_, index) => (
                            <Textarea
                                key={index}
                                placeholder={`Mensaje ${index + 1}`}
                                value={newTemplate.messages[index]}
                                onChange={(e) => {
                                    const newMessages = [...newTemplate.messages];
                                    newMessages[index] = e.target.value;
                                    setNewTemplate({ ...newTemplate, messages: newMessages });
                                }}
                            />
                        ))}
                        <Button onClick={handleSaveTemplate} className="w-full"><Save className="mr-2 h-4 w-4" /> Guardar Plantilla</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>2. Panel de Envío</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar plantilla" /></SelectTrigger>
                            <SelectContent>
                                {templates.map(t => <SelectItem key={t.$id} value={t.$id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                            <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                            <Button onClick={() => startCampaign(true)} disabled={isSending} className="whitespace-nowrap">
                                Programar
                            </Button>
                        </div>
                        <Button onClick={() => startCampaign(false)} disabled={isSending} className="w-full bg-green-600 hover:bg-green-700">
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                             Enviar a {selectedClients.size} clientes
                        </Button>
                        {isSending && <Progress value={(progress.sent + progress.failed) / progress.total * 100} className="w-full" />}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>Historial de Campañas</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48">
                            <Table>
                                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Estado</TableHead><TableHead>Progreso</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {campaigns.map(c => (
                                        <TableRow key={c.$id}>
                                            <TableCell>{c.name}</TableCell>
                                            <TableCell><Badge>{statusTranslations[c.status] || c.status}</Badge></TableCell>
                                            <TableCell>{c.sentCount ?? 0} / {c.audienceCount}</TableCell>
                                            <TableCell><Button variant="outline" size="sm" onClick={() => viewLogs(c.$id)}><FileText className="h-4 w-4"/></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>3. Selección de Clientes ({selectedClients.size} / {total})</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <Input placeholder="Buscar por nombre..." name="nomcli" value={filters.nomcli} onChange={handleFilterChange} />
                        <Input placeholder="Ciudad..." name="pobcli" value={filters.pobcli} onChange={handleFilterChange} />
                        <Button onClick={() => applyQueries(buildQueriesFromFilters())}><Search className="mr-2 h-4 w-4" /> Filtrar</Button>
                    </div>
                    <ScrollArea className="h-[600px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Checkbox onCheckedChange={handleSelectAllClients} checked={selectedClients.size === clients.length && clients.length > 0} /></TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Edad</TableHead>
                                    <TableHead>Intereses</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client: Client & Models.Document) => (
                                    <TableRow key={client.$id} className={selectedClients.has(client.$id) ? 'bg-blue-100' : ''} onClick={() => handleClientSelection(client)}>
                                        <TableCell><Checkbox checked={selectedClients.has(client.$id)} /></TableCell>
                                        <TableCell>{client.nomcli}</TableCell>
                                        <TableCell>{client.tel1cli}</TableCell>
                                        <TableCell>{client.pobcli}</TableCell>
                                        <TableCell>{client.fecnac ? calculateAge(client.fecnac) : 'N/A'}</TableCell>
                                        <TableCell>{Array.isArray(client.intereses) ? client.intereses.join(', ') : ''}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>Logs de la Campaña</DialogTitle></DialogHeader>
                    <ScrollArea className="h-96">
                        <Table>
                            <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Estado</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {logContent.map(log => (
                                    <TableRow key={log.$id}>
                                        <TableCell>{log.clientName}</TableCell>
                                        <TableCell><Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge></TableCell>
                                        <TableCell className="text-xs text-red-600">{log.error}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
