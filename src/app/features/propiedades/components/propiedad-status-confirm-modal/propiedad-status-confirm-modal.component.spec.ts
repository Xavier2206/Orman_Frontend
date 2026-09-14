import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PropiedadStatusConfirmModalComponent } from './propiedad-status-confirm-modal.component';

describe('PropiedadStatusConfirmModalComponent', () => {
  let fixture: ComponentFixture<PropiedadStatusConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadStatusConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropiedadStatusConfirmModalComponent);
    fixture.componentRef.setInput('propertyName', 'Edificio Tarija');
  });

  it('renders the deactivate confirmation with the property wording and icon', () => {
    fixture.componentRef.setInput('operation', 'deactivate');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Desactivar propiedad');
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija');
    expect(fixture.nativeElement.textContent).toContain('estado inactivo');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-modal')).toBe(
      'true',
    );
    expect(
      fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby'),
    ).toBe('property-status-title');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('mat-icon')).map((icon) =>
        (icon as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(['delete_outline', 'delete_outline']);
  });

  it('renders the activate confirmation and backend feedback', () => {
    fixture.componentRef.setInput('operation', 'activate');
    fixture.componentRef.setInput('feedback', 'La propiedad ya se encuentra activa.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Activar propiedad');
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('mat-icon')).map((icon) =>
        (icon as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(['restore', 'restore']);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'La propiedad ya se encuentra activa.',
    );
  });
});
