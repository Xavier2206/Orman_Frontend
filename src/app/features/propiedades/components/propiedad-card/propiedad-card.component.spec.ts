import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Propiedad } from '../../models/propiedad.model';
import { PropiedadCardComponent } from './propiedad-card.component';

describe('PropiedadCardComponent', () => {
  let fixture: ComponentFixture<PropiedadCardComponent>;
  let http: HttpTestingController;
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  const property: Propiedad = {
    codprop: 7,
    nombre: 'Edificio Tarija',
    tipo: 'EDIFICIO',
    direccion: 'Calle Sucre 123',
    ciudad: 'Tarija',
    referencia: 'Zona central',
    latitud: null,
    longitud: null,
    portadaUrl: null,
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 3500000,
    estado: 1,
    cantidadUnidades: 3,
    unidadesHabilitadas: 3,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    createObjectUrl = vi.fn(() => 'blob:property-cover');
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PropiedadCardComponent);
    fixture.componentRef.setInput('propiedad', property);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('renders the visual property information and status action control', () => {
    const card = fixture.nativeElement as HTMLElement;

    expect(card.textContent).toContain('Edificio Tarija');
    expect(card.textContent).toContain('EDIFICIO');
    expect(card.textContent).toContain('Tarija');
    expect(card.textContent).toContain('ACTIVA');
    expect(card.textContent).toContain('3 Unidades');
    expect(card.textContent).toContain('3 habilitadas');
    expect(card.textContent).toContain('0%');
    expect(card.textContent).toContain('0 de 3 ocupadas');
    expect(card.textContent).toContain('Bs 3.500.000');
    expect(card.textContent).toContain('Portada no disponible');
    expect(card.querySelector('.property-placeholder')).toBeTruthy();
    expect(card.querySelector('.property-placeholder-icon mat-icon')?.textContent?.trim()).toBe(
      'domain',
    );
    expect(card.querySelector('.property-type-badge')?.textContent).toContain('EDIFICIO');
    expect(card.querySelector('.property-status-active')).toBeTruthy();
    expect(card.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
    expect(card.querySelectorAll('button')).toHaveLength(3);
    expect(card.querySelector('[aria-label="Desactivar propiedad"]')).toBeTruthy();
    expect(
      card.querySelector('[aria-label="Desactivar propiedad"] mat-icon')?.textContent,
    ).toContain('delete_outline');
  });

  it('does not use the legacy portadaUrl when the property has no internal cover', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      portadaUrl: '/images/property.webp',
      tienePortada: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Portada no disponible');
  });

  it('loads a confirmed internal cover as a protected Blob', () => {
    fixture.componentRef.setInput('propiedad', { ...property, tienePortada: true });
    fixture.detectChanges();

    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');

    expect(coverRequest.request.method).toBe('GET');
    coverRequest.flush(new Blob(['cover'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.src).toContain('blob:property-cover');
    expect(image.alt).toBe('Portada de Edificio Tarija');
  });

  it('revokes the internal cover object URL on destroy', () => {
    fixture.componentRef.setInput('propiedad', { ...property, tienePortada: true });
    fixture.detectChanges();
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));
    fixture.detectChanges();

    fixture.destroy();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:property-cover');
  });

  it('clears the previous cover while loading a different property', () => {
    fixture.componentRef.setInput('propiedad', { ...property, tienePortada: true });
    fixture.detectChanges();
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));
    fixture.detectChanges();

    fixture.componentRef.setInput('propiedad', {
      ...property,
      codprop: 8,
      nombre: 'Casa Centro',
      tienePortada: true,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:property-cover');
    http.expectOne('/api/v1/propiedades/8/portada').flush(new Blob(['new-cover']));
  });

  it('emits future action intents without implementing navigation or forms', () => {
    const editRequested = vi.fn();
    const detailRequested = vi.fn();
    fixture.componentInstance.editRequested.subscribe(editRequested);
    fixture.componentInstance.detailRequested.subscribe(detailRequested);

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Editar Edificio Tarija"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Ver detalle de Edificio Tarija"]',
      ) as HTMLButtonElement
    ).click();

    expect(editRequested).toHaveBeenCalledOnce();
    expect(detailRequested).toHaveBeenCalledOnce();
  });

  it('shows the activation action for an inactive property and emits its intent', () => {
    const activateRequested = vi.fn();
    fixture.componentRef.setInput('propiedad', { ...property, estado: 0 });
    fixture.componentInstance.activateRequested.subscribe(activateRequested);
    fixture.detectChanges();

    const activateButton = fixture.nativeElement.querySelector(
      '[aria-label="Activar propiedad"]',
    ) as HTMLButtonElement;

    expect(activateButton).toBeTruthy();
    expect(activateButton.title).toBe('Activar propiedad');
    expect(activateButton.querySelector('mat-icon')?.textContent).toContain('restore');
    expect(fixture.nativeElement.querySelector('[aria-label="Desactivar propiedad"]')).toBeNull();

    activateButton.click();

    expect(activateRequested).toHaveBeenCalledOnce();
  });

  it('formats decimal investments using the Bolivian locale without changing the value', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      inversionInicial: 3500000.5,
      estado: 0,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bs 3.500.000,5');
    expect(fixture.nativeElement.textContent).toContain('INACTIVA');
  });

  it('renders zero units with the plural label', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      cantidadUnidades: 0,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0 Unidades');
  });

  it('renders one unit with the singular label', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      cantidadUnidades: 1,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 Unidad');
    expect(fixture.nativeElement.textContent).not.toContain('1 Unidades');
  });

  it('renders backend occupancy without recalculating it', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      cantidadUnidades: 9,
      unidadesHabilitadas: 8,
      unidadesOcupadas: 7,
      ocupacion: 87.5,
    });
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]');
    const progressValue = fixture.nativeElement.querySelector(
      '.property-occupancy-progress-value',
    ) as HTMLElement;

    expect(fixture.nativeElement.textContent).toContain('9 Unidades');
    expect(fixture.nativeElement.textContent).toContain('8 habilitadas');
    expect(fixture.nativeElement.textContent).toContain('87,5%');
    expect(fixture.nativeElement.textContent).toContain('7 de 8 ocupadas');
    expect(progress?.getAttribute('aria-valuenow')).toBe('87.5');
    expect(progressValue.style.width).toBe('87.5%');
  });

  it('renders zero enabled units and full occupancy accessibly', () => {
    fixture.componentRef.setInput('propiedad', {
      ...property,
      cantidadUnidades: 0,
      unidadesHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacion: 0,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0 Unidades');
    expect(fixture.nativeElement.textContent).toContain('0 habilitadas');
    expect(fixture.nativeElement.textContent).toContain('0 de 0 ocupadas');

    fixture.componentRef.setInput('propiedad', {
      ...property,
      cantidadUnidades: 1,
      unidadesHabilitadas: 1,
      unidadesOcupadas: 1,
      ocupacion: 100,
    });
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]');
    const progressValue = fixture.nativeElement.querySelector(
      '.property-occupancy-progress-value',
    ) as HTMLElement;

    expect(fixture.nativeElement.textContent).toContain('1 Unidad');
    expect(fixture.nativeElement.textContent).toContain('1 habilitada');
    expect(fixture.nativeElement.textContent).toContain('1 de 1 ocupada');
    expect(fixture.nativeElement.textContent).toContain('100%');
    expect(progress?.getAttribute('aria-valuenow')).toBe('100');
    expect(progressValue.style.width).toBe('100%');
  });
});
