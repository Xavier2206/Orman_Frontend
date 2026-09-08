import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { RolStatusConfirmModalComponent } from './rol-status-confirm-modal.component';

describe('RolStatusConfirmModalComponent', () => {
  let fixture: ComponentFixture<RolStatusConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolStatusConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RolStatusConfirmModalComponent);
    fixture.componentRef.setInput('roleName', 'ADMINISTRADOR');
  });

  it('renders the deactivate confirmation', () => {
    fixture.componentRef.setInput('operation', 'deactivate');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Desactivar Rol');
    expect(fixture.nativeElement.textContent).toContain('ADMINISTRADOR');
    expect(fixture.nativeElement.textContent).toContain('dejará de otorgar autorización');
    expect(fixture.nativeElement.textContent).toContain('Desactivar Rol');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('mat-icon')).map((icon) =>
        (icon as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(['delete_outline', 'delete_outline']);
  });

  it('renders the reactivate confirmation and ProblemDetail feedback', () => {
    fixture.componentRef.setInput('operation', 'activate');
    fixture.componentRef.setInput('feedback', 'El Rol ya se encuentra activo.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reactivar Rol');
    expect(fixture.nativeElement.textContent).toContain('Reactivar Rol');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('mat-icon')).map((icon) =>
        (icon as HTMLElement).textContent?.trim(),
      ),
    ).toEqual(['restore', 'restore']);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'El Rol ya se encuentra activo.',
    );
  });
});
