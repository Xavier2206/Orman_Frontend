import { ParamMap } from '@angular/router';

export type UnidadStatusFilter = 'all' | 'operational' | 'non-operational';

export interface UnidadListContext {
  readonly codprop: number | null;
  readonly statusFilter: UnidadStatusFilter;
  readonly page: number;
}

export type UnidadListQueryParams = Readonly<Record<string, number | string>>;

export const EMPTY_UNIDAD_LIST_CONTEXT: UnidadListContext = {
  codprop: null,
  statusFilter: 'all',
  page: 0,
};

export function parseUnidadListContext(params: ParamMap): UnidadListContext {
  return {
    codprop: parsePositiveInteger(params.get('codprop')),
    statusFilter: parseStatusFilter(params.get('estadoOperativo')),
    page: parsePage(params.get('page')),
  };
}

export function serializeUnidadListContext(context: UnidadListContext): UnidadListQueryParams {
  const queryParams: Record<string, number | string> = {};
  const serializedStatus = serializeStatusFilter(context.statusFilter);

  if (context.codprop !== null) {
    queryParams['codprop'] = context.codprop;
  }

  if (serializedStatus !== null) {
    queryParams['estadoOperativo'] = serializedStatus;
  }

  if (context.page > 0) {
    queryParams['page'] = context.page;
  }

  return queryParams;
}

function parseStatusFilter(value: string | null): UnidadStatusFilter {
  if (value === '1') {
    return 'operational';
  }

  if (value === '0') {
    return 'non-operational';
  }

  return 'all';
}

function serializeStatusFilter(statusFilter: UnidadStatusFilter): '0' | '1' | null {
  if (statusFilter === 'operational') {
    return '1';
  }

  if (statusFilter === 'non-operational') {
    return '0';
  }

  return null;
}

function parsePositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parsePage(value: string | null): number {
  if (value === null || !/^\d+$/.test(value)) {
    return 0;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) ? parsedValue : 0;
}
