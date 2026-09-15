import { convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';

import {
  EMPTY_UNIDAD_LIST_CONTEXT,
  parseUnidadListContext,
  serializeUnidadListContext,
} from './unidad-list-context';

describe('unidad-list-context', () => {
  it('serializes the supported context without adding defaults to the URL', () => {
    expect(
      serializeUnidadListContext({
        codprop: 161,
        statusFilter: 'operational',
        page: 2,
      }),
    ).toEqual({ codprop: 161, estadoOperativo: '1', page: 2 });

    expect(serializeUnidadListContext(EMPTY_UNIDAD_LIST_CONTEXT)).toEqual({});
  });

  it('parses a backend-compatible context and safely defaults invalid values', () => {
    expect(
      parseUnidadListContext(
        convertToParamMap({ codprop: '161', estadoOperativo: '0', page: '2' }),
      ),
    ).toEqual({ codprop: 161, statusFilter: 'non-operational', page: 2 });

    expect(
      parseUnidadListContext(
        convertToParamMap({ codprop: 'missing', estadoOperativo: '9', page: '-1' }),
      ),
    ).toEqual(EMPTY_UNIDAD_LIST_CONTEXT);
  });
});
