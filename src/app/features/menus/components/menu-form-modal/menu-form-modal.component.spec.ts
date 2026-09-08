import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { MenuFormModalComponent } from './menu-form-modal.component';

describe('MenuFormModalComponent', () => {
  let fixture: ComponentFixture<MenuFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuFormModalComponent);
    fixture.componentRef.setInput('mode', 'create');
    fixture.detectChanges();
  });

  it('renders create mode with Active selected by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Crear Menú');
    expect(fixture.nativeElement.querySelector('#menu-initial-state-label')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[role="radio"][aria-checked="true"]')?.textContent,
    ).toContain('Activo');
  });

  it('renders edit mode with the menu code and without state controls', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('menu', {
      codm: 7,
      nombre: 'REPORTES',
      icono: 'assessment',
      estado: 1,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar Menú');
    expect(fixture.nativeElement.textContent).toContain('Código #7');
    expect(fixture.nativeElement.querySelector('#menu-initial-state-label')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('#menu-name').value).toBe('REPORTES');
  });

  it('rejects blank and whitespace-only names', () => {
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue('   ');
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El nombre del Menú es obligatorio.');
  });

  it('rejects names longer than 100 characters', () => {
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue('M'.repeat(101));
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'El nombre del Menú admite hasta 100 caracteres.',
    );
  });

  it('searches the local icon catalog and selects an icon visually', () => {
    const search = fixture.nativeElement.querySelector('#menu-icon-search');
    expect(search).toBeNull();

    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const iconSearch = fixture.nativeElement.querySelector('#menu-icon-search') as HTMLInputElement;
    iconSearch.value = 'setting';
    iconSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const iconOptions = fixture.nativeElement.querySelectorAll(
      '.icon-option',
    ) as NodeListOf<HTMLButtonElement>;
    const settingsOption = Array.from(iconOptions).find(
      (option) => option.getAttribute('title') === 'settings',
    ) as HTMLButtonElement;
    settingsOption.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#menu-icon-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selected-icon-label')?.textContent).toContain(
      'settings',
    );
  });

  it('supports categories and removing the selected icon', () => {
    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const categoryButtons = fixture.nativeElement.querySelectorAll(
      '.icon-categories button',
    ) as NodeListOf<HTMLButtonElement>;
    const security = Array.from(categoryButtons).find(
      (button) => button.textContent?.trim() === 'Seguridad',
    ) as HTMLButtonElement;
    security.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.icon-option').length).toBeGreaterThan(0);

    const iconOption = fixture.nativeElement.querySelector('.icon-option') as HTMLButtonElement;
    iconOption.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-icon-button')).toBeTruthy();

    (fixture.nativeElement.querySelector('.clear-icon-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-icon-button')).toBeNull();
  });

  it('emits a create request with the selected initial state and icon', () => {
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const component = fixture.componentInstance as never as {
      submit(): void;
      selectInitialState(state: 0 | 1): void;
      selectIcon(iconName: string): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue(' control de acceso ');
    component.selectIcon('settings');
    component.selectInitialState(0);
    component.submit();

    expect(saved).toHaveBeenCalledWith({
      mode: 'create',
      request: { nombre: 'control de acceso', icono: 'settings', estado: 0 },
    });
  });

  it('emits an edit request without estado and allows a null icon', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('menu', {
      codm: 4,
      nombre: 'REPORTES',
      icono: 'assessment',
      estado: 1,
    });
    fixture.detectChanges();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const component = fixture.componentInstance as never as {
      submit(): void;
      clearIcon(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue('reportes generales');
    component.clearIcon();
    component.submit();

    expect(saved).toHaveBeenCalledWith({
      mode: 'edit',
      request: { nombre: 'reportes generales', icono: null },
    });
    expect(saved.mock.calls[0][0].request).not.toHaveProperty('estado');
  });
});
