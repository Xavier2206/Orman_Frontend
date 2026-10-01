import { environment } from '../../../environments/environment';

export const API_BASE_PATH = environment.apiBaseUrl;

export function apiPath(path: string): string {
  return `${API_BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
