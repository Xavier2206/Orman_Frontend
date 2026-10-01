import { environment } from '../../../../environments/environment';

export const NOTIFICACIONES_STOMP_URL = environment.notificacionesWebSocketUrl;
export const NOTIFICACIONES_STOMP_DESTINATION = '/user/queue/notificaciones';
