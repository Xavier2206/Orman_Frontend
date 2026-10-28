import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthContextRol } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PrivateSidebarComponent } from './private-sidebar.component';

@Component({ template: '' })
class TestRouteComponent {}

describe('PrivateSidebarComponent accordion', () => {
  let fixture: ComponentFixture<PrivateSidebarComponent>;
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;

    await TestBed.configureTestingModule({
      imports: [PrivateSidebarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'app/personas/listar', component: TestRouteComponent }]),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    auth.clearSession();
    window.matchMedia = originalMatchMedia;
  });

  function renderContext(roles: readonly AuthContextRol[]): void {
    context.loadContext().subscribe();
    http.expectOne('/api/v1/auth/context').flush({
      usuario: { login: 'Xavier_Ortega', codper: 1 },
      persona: { nombre: 'Xavier', ap: 'Ortega', am: null, foto: null },
      roles,
    });
    fixture.detectChanges();
  }

  it('starts closed and returns to that state when the component is recreated', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
        ],
      },
    ]);

    let groupButton = fixture.nativeElement.querySelector(
      '[aria-controls="sidebar-processes-1"]',
    ) as HTMLButtonElement;
    let processList = fixture.nativeElement.querySelector(
      '#sidebar-processes-1',
    ) as HTMLUListElement;
    expect(processList.hidden).toBe(true);
    expect(groupButton.getAttribute('aria-expanded')).toBe('false');
    expect(groupButton.getAttribute('aria-controls')).toBe('sidebar-processes-1');

    groupButton.click();
    fixture.detectChanges();
    expect(processList.hidden).toBe(false);

    fixture.destroy();
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();

    groupButton = fixture.nativeElement.querySelector(
      '[aria-controls="sidebar-processes-1"]',
    ) as HTMLButtonElement;
    processList = fixture.nativeElement.querySelector('#sidebar-processes-1') as HTMLUListElement;
    expect(processList.hidden).toBe(true);
    expect(groupButton.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens one menu at a time and closes it when its button is pressed again', () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
          {
            codm: 2,
            nombre: 'GESTIÓN DE PAGOS',
            icono: 'payments',
            procesos: [{ codp: 2, nombre: 'GESTIONAR PAGOS', enlace: 'pagos/listar' }],
          },
        ],
      },
    ]);

    const peopleButton = fixture.nativeElement.querySelector(
      '[aria-controls="sidebar-processes-1"]',
    ) as HTMLButtonElement;
    const paymentsButton = fixture.nativeElement.querySelector(
      '[aria-controls="sidebar-processes-2"]',
    ) as HTMLButtonElement;
    const peopleProcesses = fixture.nativeElement.querySelector(
      '#sidebar-processes-1',
    ) as HTMLUListElement;
    const paymentsProcesses = fixture.nativeElement.querySelector(
      '#sidebar-processes-2',
    ) as HTMLUListElement;

    expect(peopleButton.tagName).toBe('BUTTON');
    expect(peopleButton.classList.contains('focus-visible:outline-focus')).toBe(true);

    peopleButton.click();
    fixture.detectChanges();
    expect(peopleButton.getAttribute('aria-expanded')).toBe('true');
    expect(peopleProcesses.hidden).toBe(false);
    expect(paymentsProcesses.hidden).toBe(true);

    paymentsButton.click();
    fixture.detectChanges();
    expect(peopleButton.getAttribute('aria-expanded')).toBe('false');
    expect(peopleProcesses.hidden).toBe(true);
    expect(paymentsButton.getAttribute('aria-expanded')).toBe('true');
    expect(paymentsProcesses.hidden).toBe(false);

    paymentsButton.click();
    fixture.detectChanges();
    expect(paymentsButton.getAttribute('aria-expanded')).toBe('false');
    expect(paymentsProcesses.hidden).toBe(true);
  });

  it('closes the previous role menu when the selected role changes', async () => {
    renderContext([
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [{ codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' }],
          },
        ],
      },
      {
        codr: 2,
        nombre: 'ADMINISTRADOR',
        menus: [
          {
            codm: 2,
            nombre: 'CONFIGURACIÓN',
            icono: 'settings',
            procesos: [{ codp: 2, nombre: 'REPORTES', enlace: 'reportes/listar' }],
          },
        ],
      },
    ]);

    (fixture.nativeElement.querySelector('.sidebar-item') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('#sidebar-processes-1') as HTMLUListElement).hidden,
    ).toBe(false);

    context.selectRole(2);
    await fixture.whenStable();
    fixture.detectChanges();

    const newGroupButton = fixture.nativeElement.querySelector(
      '[aria-controls="sidebar-processes-2"]',
    ) as HTMLButtonElement;
    const newProcessList = fixture.nativeElement.querySelector(
      '#sidebar-processes-2',
    ) as HTMLUListElement;
    expect(newGroupButton.getAttribute('aria-expanded')).toBe('false');
    expect(newProcessList.hidden).toBe(true);
  });
});
