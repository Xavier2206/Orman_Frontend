import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { PersonaDetailModalComponent } from './persona-detail-modal.component';
const p = {
  codper: 1,
  ci: '1',
  nombre: 'Ana',
  ap: 'Paz',
  am: null,
  genero: 'F' as const,
  estado: 1 as const,
  correo: 'a@test.com',
  telefono: '7',
  tipoPersona: 'A' as const,
  foto: null,
  fechaRegistro: '2026-01-01',
  usuario: null,
  acciones: {
    puedeEditar: true,
    puedeDesactivar: true,
    puedeActivar: false,
    puedeEliminar: false,
    puedeCrearUsuario: false,
    puedeCambiarPassword: false,
  },
};
describe('PersonaDetailModalComponent', () => {
  let f: ComponentFixture<PersonaDetailModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaDetailModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaDetailModalComponent);
    f.componentRef.setInput('persona', p);
  });
  it('renders person data', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana Paz');
  });
  it('renders no linked user', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sin usuario vinculado');
  });
  it('renders initials when the person has no protected photo', () => {
    f.detectChanges();

    expect(f.nativeElement.querySelector('.profile-avatar img')).toBeNull();
    expect(f.nativeElement.querySelector('.profile-avatar')?.textContent).toContain('AP');
  });
  it('renders the protected photo URL supplied by the list', () => {
    f.componentRef.setInput('imageUrl', 'blob:persona-photo');
    f.detectChanges();

    const photo = f.nativeElement.querySelector('.profile-avatar img') as HTMLImageElement;
    expect(photo.src).toContain('blob:persona-photo');
    expect(photo.alt).toBe('Fotografía de Ana Paz');
  });
  it('renders organized sections and visual status', () => {
    f.detectChanges();

    expect(f.nativeElement.textContent).toContain('Información personal');
    expect(f.nativeElement.textContent).toContain('Información de contacto');
    expect(f.nativeElement.textContent).toContain('Información del sistema');
    expect(f.nativeElement.textContent).toContain('Administrativo');
    expect(f.nativeElement.textContent).toContain('Activa');
    expect(f.nativeElement.querySelector('.status-active')).toBeTruthy();
  });
  it('avoids repeating profile fields inside the screen detail sections', () => {
    f.detectChanges();

    const modalBody = f.nativeElement.querySelector('.modal-body') as HTMLElement;

    expect(modalBody.textContent).not.toContain('Nombre completo');
    expect(modalBody.textContent).not.toContain('Tipo de Persona');
    expect(modalBody.textContent).toContain('Fecha de registro');
  });
  it('keeps the approved information cards as separate sections', () => {
    f.detectChanges();

    expect(f.nativeElement.querySelectorAll('.modal-body > .details-section')).toHaveLength(3);
    expect(f.nativeElement.querySelector('.details-layout')).toBeNull();
  });
  it('uses the print action to request the browser print dialog', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    f.detectChanges();

    (f.nativeElement.querySelector('.print-button') as HTMLButtonElement).click();

    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });
  it('renders the administrative print sheet with the existing person fields', () => {
    f.detectChanges();

    const printSheet = f.nativeElement.querySelector('.print-sheet') as HTMLElement;
    const printLogo = printSheet.querySelector('.print-brand') as HTMLImageElement;

    expect(printLogo.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(printLogo.getAttribute('alt')).toBe('Logotipo oficial de ORMAN');
    expect(printSheet.textContent).toContain('ORMAN');
    expect(printSheet.textContent).toContain('FICHA DE PERSONA');
    expect(printSheet.textContent).toContain('Datos personales');
    expect(printSheet.textContent).toContain('Información del sistema');
    expect(printSheet.textContent).toContain('Código de persona');
    const systemSection = printSheet.querySelectorAll('.print-section')[2] as HTMLElement;
    expect(systemSection.querySelector('dd')?.textContent?.trim()).toBe('1');
    expect(printSheet.textContent).toContain('ORMAN · Gestión de Personas');
    const generationLabel = printSheet.querySelector('.print-footer span:last-child');
    expect(generationLabel?.textContent).toMatch(/Ficha generada el \d{2}\/\d{2}\/\d{4}/);
    expect(printSheet.textContent).toContain('01/01/2026');
  });
});
