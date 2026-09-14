import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

const pdfMock = vi.hoisted(() => ({
  addImage: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  text: vi.fn(),
}));

vi.mock('jspdf', () => {
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

    roundedRect(): this {
      return this;
    }

    splitTextToSize(value: string): string[] {
      return [value];
    }

    addImage(): this {
      pdfMock.addImage();
      return this;
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

  return { default: MockJsPDF, jsPDF: MockJsPDF };
});

import { PropiedadDetailPdfService } from './propiedad-detail-pdf.service';

describe('PropiedadDetailPdfService', () => {
  let service: PropiedadDetailPdfService;

  const property = {
    codprop: 476,
    nombre: 'Casa Camargo',
    tipo: 'CASA' as const,
    direccion: 'Calle Arenales',
    ciudad: 'Camargo',
    referencia: 'Frente la Terminal',
    latitud: -20.638372,
    longitud: -65.209254,
    portadaUrl: null,
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 250000,
    estado: 1 as const,
    cantidadUnidades: 0,
    unidadesHabilitadas: 0,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PropiedadDetailPdfService] });
    service = TestBed.inject(PropiedadDetailPdfService);
    pdfMock.addImage.mockClear();
    pdfMock.addPage.mockClear();
    pdfMock.save.mockClear();
    pdfMock.text.mockClear();
  });

  it('renders the confirmed property data in the print-like composition', async () => {
    await service.download(property, null);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).toEqual(
      expect.arrayContaining([
        'Casa Camargo',
        'Casa',
        'ACTIVA',
        'Calle Arenales, Camargo',
        'Frente la Terminal',
        'Bs 250.000',
        '#476',
        '-20,638372',
        '-65,209254',
        '0 unidades registradas',
      ]),
    );
    expect(renderedText).not.toContain('ocupación');
    expect(pdfMock.save).toHaveBeenCalledWith('ORMAN-Propiedad-Casa-Camargo.pdf');
  });

  it('includes a supplied cover Blob without making another request', async () => {
    const cover = new Blob(['cover'], { type: 'image/jpeg' });

    await service.download({ ...property, tienePortada: true }, cover);

    expect(pdfMock.addImage).toHaveBeenCalledTimes(1);
  });

  it('renders a stable placeholder when there is no cover or coordinates', async () => {
    const propertyWithoutOptionalData = {
      ...property,
      referencia: null,
      latitud: null,
      longitud: null,
    };

    await service.download(propertyWithoutOptionalData, null);

    const renderedText = pdfMock.text.mock.calls.flatMap(([value]) =>
      Array.isArray(value) ? value : [value],
    );

    expect(renderedText).toContain('SIN PORTADA REGISTRADA');
    expect(renderedText).toContain('No registrada');
    expect(renderedText).toContain('No registradas');
  });

  it('propagates generation errors so the page can notify the user', async () => {
    pdfMock.save.mockImplementationOnce(() => {
      throw new Error('PDF generation failed');
    });

    await expect(service.download(property, null)).rejects.toThrow('PDF generation failed');
  });
});
