import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { UnidadResponse } from '../../models/unidad.model';
import { UnidadCardComponent } from './unidad-card.component';

describe('UnidadCardComponent', () => {
  let fixture: ComponentFixture<UnidadCardComponent>;

  const unit: UnidadResponse = {
    coduni: 501,
    codprop: 161,
    nombre: 'Unidad 101',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: 'Unidad con balcón y buena iluminación.',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UnidadCardComponent);
    fixture.componentRef.setInput('unidad', unit);
    fixture.detectChanges();
  });

  it('renders confirmed fields, actions, and the operational badge without description', () => {
    const card = fixture.nativeElement as HTMLElement;
    const text = card.textContent ?? '';

    expect(text).toContain('Unidad 101');
    expect(text).toContain('DEPARTAMENTO');
    expect(text).toContain('OPERATIVA');
    expect(text).toContain('45,5 m²');
    expect(text).toContain('Dormitorios');
    expect(text).toContain('Baños');
    expect(text).toContain('Piso');
    expect(text).toContain('Torre A');
    expect(text).toContain('Bs 2.500');
    expect(text).not.toContain('Unidad con balcón y buena iluminación.');
    expect(text).not.toMatch(/ocupaci|ocupad|disponib/i);
    expect(card.querySelector('.unit-status-operational')).toBeTruthy();
    expect(card.querySelector('.unit-card-top .unit-price')).toBeTruthy();
    expect(card.querySelector('button[aria-label="Editar Unidad 101"]')).toBeTruthy();
    expect(card.querySelector('button[aria-label="Ver detalle de Unidad 101"]')).toBeTruthy();
  });

  it('renders the non-operational badge and omits nullable content without empty space', () => {
    fixture.componentRef.setInput('unidad', {
      ...unit,
      descripcion: null,
      ubicacionInterna: null,
      estadoOperativo: 0,
    });
    fixture.detectChanges();

    const card = fixture.nativeElement as HTMLElement;

    expect(card.textContent).toContain('NO OPERATIVA');
    expect(card.querySelector('.unit-status-non-operational')).toBeTruthy();
    expect(card.querySelector('.unit-location')).toBeNull();
  });

  it('emits prepared actions without creating navigation', () => {
    const editRequested = vi.fn();
    const detailRequested = vi.fn();
    fixture.componentInstance.editRequested.subscribe(editRequested);
    fixture.componentInstance.detailRequested.subscribe(detailRequested);

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[0]?.click();
    buttons[1]?.click();

    expect(editRequested).toHaveBeenCalledOnce();
    expect(detailRequested).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(0);
  });

  it('shows and emits the state action that matches the current status', () => {
    const statusChangeRequested = vi.fn();
    fixture.componentInstance.statusChangeRequested.subscribe(statusChangeRequested);

    const deactivateButton = fixture.nativeElement.querySelector(
      'button[aria-label="Desactivar Unidad 101"]',
    ) as HTMLButtonElement;
    deactivateButton.click();

    expect(statusChangeRequested).toHaveBeenCalledWith('deactivate');

    fixture.componentRef.setInput('unidad', { ...unit, estadoOperativo: 0 });
    fixture.detectChanges();

    const activateButton = fixture.nativeElement.querySelector(
      'button[aria-label="Activar Unidad 101"]',
    ) as HTMLButtonElement;
    activateButton.click();

    expect(statusChangeRequested).toHaveBeenCalledWith('activate');
  });
});
