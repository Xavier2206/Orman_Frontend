import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { Propiedad } from '../../propiedades/models/propiedad.model';
import { UnidadFotoView } from '../models/fotografia.model';
import { UnidadResponse } from '../models/unidad.model';

const pdfMock = {
  addImage: vi.fn(),
  addPage: vi.fn(),
  roundedRect: vi.fn(),
  save: vi.fn(),
  text: vi.fn(),
};

class MockJsPDF {
  setProperties(): this {
    return this;
  }

  setFont(): this {
    return this;
  }

  setFontSize(): this {
    return this;
  }

  setTextColor(): this {
    return this;
  }

  setDrawColor(): this {
    return this;
  }

  setFillColor(): this {
    return this;
  }

  setLineWidth(): this {
    return this;
  }

  text(...args: unknown[]): this {
    pdfMock.text(...args);
    return this;
  }

  line(): this {
    return this;
  }

  roundedRect(...args: unknown[]): this {
    pdfMock.roundedRect(...args);
    return this;
  }

  addImage(...args: unknown[]): this {
    pdfMock.addImage(...args);
    return this;
  }

  splitTextToSize(value: string): string[] {
    return [value];
  }

  addPage(): this {
    pdfMock.addPage();
    return this;
  }

  getNumberOfPages(): number {
    return 1;
  }

  setPage(): this {
    return this;
  }

  save(fileName: string): this {
    pdfMock.save(fileName);
    return this;
  }
}

describe('UnidadDetailPdfService', () => {
  let service: {
    download(
      unit: UnidadResponse,
      property: Propiedad | null,
      photos?: readonly UnidadFotoView[],
    ): Promise<void>;
  };

  const property: Propiedad = {
    codprop: 161,
    nombre: 'Edificio Central',
    tipo: 'EDIFICIO',
    direccion: 'Calle Sucre 123',
    ciudad: 'Tarija',
    referencia: null,
    latitud: null,
    longitud: null,
    portadaUrl: null,
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 3500000,
    estado: 1,
    cantidadUnidades: 2,
    unidadesHabilitadas: 2,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  const unit: UnidadResponse = {
    coduni: 501,
    codprop: 161,
    nombre: 'Departamento 1',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: 'Unidad con balcón y buena iluminación.',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('jspdf', () => ({ default: MockJsPDF, jsPDF: MockJsPDF }));

    const { UnidadDetailPdfService } = await import('./unidad-detail-pdf.service');

    TestBed.configureTestingModule({ providers: [UnidadDetailPdfService] });
    service = TestBed.inject(UnidadDetailPdfService);
    pdfMock.addPage.mockClear();
    pdfMock.addImage.mockClear();
    pdfMock.roundedRect.mockClear();
    pdfMock.save.mockClear();
    pdfMock.text.mockClear();
  });

  it('renders only confirmed unit and resolved property data', async () => {
    await service.download(unit, property);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).toEqual(
      expect.arrayContaining([
        'Departamento 1',
        'DEPARTAMENTO',
        'OPERATIVA',
        '#501',
        '#161',
        'Edificio Central',
        'Unidad con balcón y buena iluminación.',
        '45,5 m²',
        '1',
        'Torre A',
        'Bs 2.500',
      ]),
    );
    expect(renderedText.join(' ')).not.toMatch(/ocupaci|ocupad|disponib|contrato|inquilino|libre/i);
    expect(pdfMock.save).toHaveBeenCalledWith('ORMAN-Unidad-501-departamento-1.pdf');
  });

  it('uses neutral placeholders and only the property identifier without a resolved property', async () => {
    await service.download({ ...unit, descripcion: null, ubicacionInterna: null }, null);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).toContain('No registrada');
    expect(renderedText).toContain('#161');
    expect(renderedText).not.toContain('Edificio Central');
  });

  it('keeps the summary facts inside the dynamically sized hero card', async () => {
    await service.download(unit, property);

    const heroCard = pdfMock.roundedRect.mock.calls[0] as unknown[];
    const heroY = Number(heroCard[1]);
    const heroHeight = Number(heroCard[3]);
    const priceCall = pdfMock.text.mock.calls.find(
      ([value]) => Array.isArray(value) && value.includes('Bs 2.500'),
    ) as unknown[];
    const identifierCall = pdfMock.text.mock.calls.find(
      ([value]) => Array.isArray(value) && value.includes('#501'),
    ) as unknown[];

    expect(heroHeight).toBeGreaterThan(37);
    expect(Number(priceCall[2])).toBeLessThan(heroY + heroHeight);
    expect(Number(identifierCall[2])).toBeLessThan(heroY + heroHeight);
  });

  it('omits the photo section when the unit has no registered photos', async () => {
    await service.download(unit, property, []);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).not.toContain('Fotografías de la unidad');
    expect(pdfMock.addImage).not.toHaveBeenCalled();
  });

  it('renders ordered photos and identifies the cover photo', async () => {
    const photos: readonly UnidadFotoView[] = [
      {
        key: 'detail-20',
        id: 20,
        titulo: 'Sala',
        ambiente: 'Sala',
        orden: 0,
        portada: true,
        imageUrl: 'data:image/jpeg;base64,ZmFrZS1zYWxh',
        imageStatus: 'ready',
        pending: false,
        fileName: null,
      },
      {
        key: 'detail-21',
        id: 21,
        titulo: 'Cocina',
        ambiente: 'Cocina',
        orden: 1,
        portada: false,
        imageUrl: 'data:image/png;base64,ZmFrZS1jb2NpbmE=',
        imageStatus: 'ready',
        pending: false,
        fileName: null,
      },
    ];

    await service.download(unit, property, photos);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).toContain('Fotografías de la unidad');
    expect(renderedText).toContain('Sala');
    expect(renderedText).toContain('Cocina');
    expect(renderedText).toContain('PORTADA');
    expect(renderedText.indexOf('Sala')).toBeLessThan(renderedText.indexOf('Cocina'));
    expect(pdfMock.addImage).toHaveBeenCalledTimes(2);
  });

  it('propagates generation errors so the detail page can notify the user', async () => {
    pdfMock.save.mockImplementationOnce(() => {
      throw new Error('PDF generation failed');
    });

    await expect(service.download(unit, null)).rejects.toThrow('PDF generation failed');
  });
});
