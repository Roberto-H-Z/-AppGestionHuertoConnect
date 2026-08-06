/**
 * Barrel exports para los servicios del módulo principal.
 * Importa desde aquí para mantener imports limpios en los screens.
 */

export { huertoService } from './huertoService';
export type { HuertoCreate, HuertoUpdate } from '../../main/types/cropTypes';

export { chatbotService } from './chatbotService';
export type { ConversacionOut, MensajeOut, ConversacionCreate, MensajeCreate } from './chatbotService';

export { agentService } from './agentService';
export type { AgentChatResponse, AgentChatRequest, AgentSession, AgentAction } from './agentService';

export { aiModelService } from './aiModelService';
export type { CultivoRecomendado, PlagaDetectada } from './aiModelService';

export { notificacionService } from './notificacionService';
export type { NotificacionResponse, NotificacionCreate } from './notificacionService';

export { reportesService } from './reportesService';
export type { ReporteResponse, ReporteGenerar } from './reportesService';

export { alertasService, prediccionesService } from './plagasService';
export type {
    AlertaResponse, AlertaCreate, AlertaUpdate,
    PrediccionResponse, PrediccionCreate,
} from './plagasService';
