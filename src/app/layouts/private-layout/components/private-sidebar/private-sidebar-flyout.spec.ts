import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { AuthContextRol } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PrivateSidebarComponent } from './private-sidebar.component';

@Component({ template: '' })
class TestRouteComponent {}

describe('PrivateSidebarComponent compact flyout', () => {
  let fixture: ComponentFixture<PrivateSidebarComponent>;
  let auth: AuthService;
  let context: AuthContextService;
  let http: HttpTestingController;
  let router: Router;
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerHeight: number;
  let originalInnerWidth: number;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    originalInnerHeight = window.innerHeight;
    originalInnerWidth = window.innerWidth;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;

    await TestBed.configureTestingModule({
      imports: [PrivateSidebarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'app/personas/listar', component: TestRouteComponent },
          { path: 'app/personas/listar-detalle', component: TestRouteComponent },
        ]),
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    context = TestBed.inject(AuthContextService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
    auth.clearSession();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
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

  function collapseSidebar(): void {
    (fixture.nativeElement.querySelector('.sidebar-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function twoMenuContext(): readonly AuthContextRol[] {
    return [
      {
        codr: 1,
        nombre: 'PROPIETARIO',
        menus: [
          {
            codm: 1,
            nombre: 'GESTIONAR PERSONAS',
            icono: 'group',
            procesos: [
              { codp: 1, nombre: 'LISTAR PERSONAS', enlace: 'personas/listar' },
              { codp: 2, nombre: 'DETALLE PERSONAS', enlace: 'personas/listar-detalle' },
            ],
          },
          {
            codm: 2,
            nombre: 'GESTIÓN DE PAGOS',
            icono: 'payments',
            procesos: [{ codp: 3, nombre: 'GESTIONAR PAGOS', enlace: 'pagos/listar' }],
          },
        ],
      },
    ];
  }

  it('keeps the popup open when the pointer moves from its trigger into the panel', () => {
    vi.useFakeTimers();
    renderContext(twoMenuContext());
    collapseSidebar();

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="GESTIONAR PERSONAS"]',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('#sidebar-flyout-1') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    panel.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(120);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#sidebar-flyout-1')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('does not close after the close timer while a process in the panel has focus', () => {
    vi.useFakeTimers();
    renderContext(twoMenuContext());
    collapseSidebar();

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="GESTIONAR PERSONAS"]',
    ) as HTMLButtonElement;
    trigger.focus();
    fixture.detectChanges();
    const processLink = fixture.nativeElement.querySelector(
      '#sidebar-flyout-1 .sidebar-process',
    ) as HTMLAnchorElement;
    processLink.focus();
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();

    vi.advanceTimersByTime(120);
    fixture.detectChanges();

    expect(document.activeElement).toBe(processLink);
    expect(fixture.nativeElement.querySelector('#sidebar-flyout-1')).toBeTruthy();
  });

  it('moves keyboard focus from trigger to processes, between menus, and restores it on Escape', async () => {
    renderContext(twoMenuContext());
    collapseSidebar();

    const paymentsTrigger = fixture.nativeElement.querySelector(
      '[aria-label="GESTIÓN DE PAGOS"]',
    ) as HTMLButtonElement;
    paymentsTrigger.focus();
    fixture.detectChanges();
    paymentsTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();
    const processLinks = fixture.nativeElement.querySelectorAll(
      '#sidebar-flyout-2 .sidebar-process',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(document.activeElement).toBe(processLinks[0]);

    processLinks[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(paymentsTrigger);

    processLinks[processLinks.length - 1].focus();
    processLinks[processLinks.length - 1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    fixture.detectChanges();
    const peopleTrigger = fixture.nativeElement.querySelector(
      '[aria-label="GESTIONAR PERSONAS"]',
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(peopleTrigger);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-flyout')).toBeNull();
    expect(document.activeElement).toBe(peopleTrigger);
  });

  it('places a popup above and inside the viewport when its trigger is near the bottom-right edge', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    renderContext(twoMenuContext());
    collapseSidebar();

    const trigger = fixture.nativeElement.querySelector(
      '[aria-label="GESTIONAR PERSONAS"]',
    ) as HTMLButtonElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(860, 700, 48, 44));
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('#sidebar-flyout-1') as HTMLElement;
    const top = Number.parseFloat(panel.style.top);
    const left = Number.parseFloat(panel.style.left);
    const maxHeight = Number.parseFloat(panel.style.maxHeight);

    expect(top).toBeGreaterThan(16);
    expect(top).toBeLessThan(700);
    expect(left).toBeLessThan(860);
    expect(left + 240).toBeLessThanOrEqual(1008);
    expect(maxHeight).toBe(736);
  });

  it('highlights only the menu whose process matches the current route exactly', async () => {
    renderContext(twoMenuContext());
    await router.navigateByUrl('/app/personas/listar-detalle');
    fixture.detectChanges();

    const activeMenus = fixture.nativeElement.querySelectorAll(
      '.sidebar-menu-has-active-process',
    ) as NodeListOf<HTMLElement>;
    expect(activeMenus).toHaveLength(1);
    expect(activeMenus[0].querySelector('.sidebar-menu-trigger')).toBeNull();

    collapseSidebar();
    expect(
      (
        fixture.nativeElement.querySelector('[aria-label="GESTIONAR PERSONAS"]') as HTMLElement
      ).parentElement?.classList.contains('sidebar-menu-has-active-process'),
    ).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector('[aria-label="GESTIÓN DE PAGOS"]') as HTMLElement
      ).parentElement?.classList.contains('sidebar-menu-has-active-process'),
    ).toBe(false);
  });
});
