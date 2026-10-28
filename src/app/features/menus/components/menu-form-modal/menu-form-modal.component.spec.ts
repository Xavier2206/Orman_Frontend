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

  it('searches by technical name and displays its Spanish label', () => {
    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const iconSearch = fixture.nativeElement.querySelector('#menu-icon-search') as HTMLInputElement;
    iconSearch.value = 'setting';
    iconSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const settingsOption = fixture.nativeElement.querySelector(
      '[title="Configuración (settings)"]',
    ) as HTMLButtonElement;
    expect(settingsOption).toBeTruthy();
    settingsOption.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#menu-icon-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selected-icon-label')?.textContent).toContain(
      'Configuración',
    );
    expect(
      fixture.nativeElement.querySelector('.selected-icon-technical-name')?.textContent,
    ).toContain('settings');
  });

  it('searches labels and related words without accents or case sensitivity', () => {
    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const iconSearch = fixture.nativeElement.querySelector('#menu-icon-search') as HTMLInputElement;
    const setSearch = (query: string): string[] => {
      iconSearch.value = query;
      iconSearch.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      return Array.from(
        fixture.nativeElement.querySelectorAll('.icon-option'),
        (option: Element) => option.getAttribute('title') ?? '',
      );
    };

    expect(setSearch('PROPIEDAD')).toContain('Propiedad y departamento (apartment)');
    expect(setSearch('inmueble')).toContain('Edificio (domain)');
    expect(setSearch('inquilino')).toContain('Personas y grupos (groups)');
    expect(setSearch('configuracion')).toContain('Configuración (settings)');
    expect(setSearch('ASSESSMENT')).toContain('Reporte (assessment)');
    expect(setSearch('cobro')).toContain('Billetera financiera (account_balance_wallet)');
    expect(setSearch('cobrar')).toContain('Billetera financiera (account_balance_wallet)');
    expect(setSearch('pago')).toContain('Tarjeta de pago (credit_card)');
    expect(setSearch('contrato')).toContain('Contrato (contract)');
    expect(setSearch('reporte')).toContain('Reporte (assessment)');
  });

  it('filters icons by the ORMAN categories and retains Todos', () => {
    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const categoryButtons = fixture.nativeElement.querySelectorAll(
      '.icon-categories button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(
      Array.from(categoryButtons).some((button) => button.textContent?.trim() === 'Todos'),
    ).toBe(true);

    const properties = Array.from(categoryButtons).find(
      (button) => button.textContent?.trim() === 'Propiedades y unidades',
    ) as HTMLButtonElement;
    properties.click();
    fixture.detectChanges();

    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.icon-option'),
      (option: Element) => option.getAttribute('title') ?? '',
    );
    expect(titles).toContain('Propiedad y departamento (apartment)');
    expect(titles).toContain('Edificio (domain)');
    expect(titles).not.toContain('Contrato (contract)');
  });

  it('preserves an existing icon that is not in the catalog while editing', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('menu', {
      codm: 9,
      nombre: 'MENÚ ANTIGUO',
      icono: 'legacy_custom_icon',
      estado: 1,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.selected-icon-label')?.textContent).toContain(
      'Icono actual',
    );
    expect(
      fixture.nativeElement.querySelector('.selected-icon-technical-name')?.textContent,
    ).toContain('legacy_custom_icon');

    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'no está en este catálogo y se conservará si no eliges otro.',
    );

    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const component = fixture.componentInstance as never as {
      submit(): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };
    component.form.controls.nombre.setValue('MENÚ ANTIGUO');
    component.submit();

    expect(saved).toHaveBeenCalledWith({
      mode: 'edit',
      request: { nombre: 'MENÚ ANTIGUO', icono: 'legacy_custom_icon' },
    });
  });

  it('supports category selection and removing the selected icon', () => {
    (fixture.nativeElement.querySelector('#menu-icon-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const categoryButtons = fixture.nativeElement.querySelectorAll(
      '.icon-categories button',
    ) as NodeListOf<HTMLButtonElement>;
    const all = Array.from(categoryButtons).find(
      (button) => button.textContent?.trim() === 'Todos',
    ) as HTMLButtonElement;
    all.click();
    fixture.detectChanges();
    const allCount = fixture.nativeElement.querySelectorAll('.icon-option').length;

    const security = Array.from(categoryButtons).find(
      (button) => button.textContent?.trim() === 'Seguridad y administración',
    ) as HTMLButtonElement;
    security.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.icon-option').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelectorAll('.icon-option').length).toBeLessThan(allCount);

    const iconOption = fixture.nativeElement.querySelector('.icon-option') as HTMLButtonElement;
    iconOption.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-icon-button')).toBeTruthy();

    (fixture.nativeElement.querySelector('.clear-icon-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.clear-icon-button')).toBeNull();
  });

  it('emits a create request with the selected initial state and technical icon name', () => {
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

  it('sends the selected technical icon name when editing', () => {
    fixture.componentRef.setInput('mode', 'edit');
    fixture.componentRef.setInput('menu', {
      codm: 12,
      nombre: 'PROPIEDADES',
      icono: 'apartment',
      estado: 1,
    });
    fixture.detectChanges();

    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const component = fixture.componentInstance as never as {
      submit(): void;
      selectIcon(iconName: string): void;
      form: { controls: { nombre: { setValue(value: string): void } } };
    };

    component.form.controls.nombre.setValue('PROPIEDADES');
    component.selectIcon('contract');
    component.submit();

    expect(saved).toHaveBeenCalledWith({
      mode: 'edit',
      request: { nombre: 'PROPIEDADES', icono: 'contract' },
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
