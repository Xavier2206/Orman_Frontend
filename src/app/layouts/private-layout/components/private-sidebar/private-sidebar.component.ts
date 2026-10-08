import { DOCUMENT } from '@angular/common';
import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthContextMenu } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';

interface FlyoutPosition {
  readonly top: number;
  readonly left: number;
  readonly maxHeight: number;
}

const DASHBOARD_MENU_NAME = 'dashboard';
const DASHBOARD_PROCESS_LINK = 'dashboard/resumen-financiero';

const MENU_DISPLAY_ORDER = new Map(
  [
    'DASHBOARD',
    'GESTIÓN PROPIEDADES',
    'GESTIÓN CONTRATOS',
    'GESTIÓN DE PAGOS',
    'GESTIONAR PERSONAS',
    'CONTROL DE ACCESO',
  ].map((name, index): [string, number] => [normalizeMenuName(name), index]),
);

const PROCESS_DISPLAY_ORDER = new Map(
  [
    'dashboard/resumen-financiero',
    'propiedades/listar',
    'unidades/listar',
    'contratos/listar',
    'pagos/listar',
    'pagos/qr-cobro',
    'personas/listar',
    'asignar-menus/listar',
    'asignar-procesos/listar',
    'asignar-roles/listar',
    'menus/listar',
    'roles/listar',
  ].map((path, index): [string, number] => [normalizeProcessLink(path), index]),
);

function normalizeMenuName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function normalizeProcessLink(link: string): string {
  return link
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLocaleLowerCase('es');
}

@Component({
  selector: 'app-private-sidebar',
  imports: [MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './private-sidebar.component.html',
  styleUrl: './private-sidebar.component.css',
})
export class PrivateSidebarComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly authContext = inject(AuthContextService);
  private closeFlyoutTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeFlyoutTrigger: HTMLButtonElement | null = null;
  private ignoreNextTriggerFocus = false;

  protected readonly context = this.authContext.context;
  protected readonly selectedRole = this.authContext.selectedRole;
  protected readonly selectedMenus = computed(() =>
    this.orderAuthorizedMenus(this.authContext.selectedMenus()),
  );
  protected readonly isLoading = this.authContext.loading;
  protected readonly contextError = this.authContext.error;
  protected readonly isCollapsed = signal(false);
  protected readonly activeFlyoutMenuId = signal<number | null>(null);
  protected readonly flyoutPosition = signal<FlyoutPosition | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();

  constructor() {
    effect(() => {
      this.selectedRole();
      this.selectedMenus();
      this.closeFlyout();
    });
  }

  ngOnDestroy(): void {
    this.cancelScheduledFlyoutClose();
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.activeFlyoutMenuId() === null) {
      return;
    }

    event.preventDefault();
    this.closeFlyout(true);
  }

  @HostListener('window:resize')
  protected handleWindowResize(): void {
    if (!this.isDesktop()) {
      this.isCollapsed.set(false);
    }

    this.closeFlyout();
  }

  protected toggleCollapsed(): void {
    this.isCollapsed.update((isCollapsed) => !isCollapsed);
    this.closeFlyout();
  }

  protected openFlyout(menuId: number, trigger: HTMLButtonElement): void {
    if (!this.isCollapsed() || !this.isDesktop()) {
      return;
    }

    this.cancelScheduledFlyoutClose();
    this.activeFlyoutTrigger = trigger;
    this.activeFlyoutMenuId.set(menuId);
    this.flyoutPosition.set(this.calculateFlyoutPosition(trigger));
  }

  protected openFlyoutFromFocus(menuId: number, trigger: HTMLButtonElement): void {
    if (this.ignoreNextTriggerFocus) {
      this.ignoreNextTriggerFocus = false;
      return;
    }

    this.openFlyout(menuId, trigger);
  }

  protected scheduleFlyoutClose(): void {
    this.cancelScheduledFlyoutClose();
    this.closeFlyoutTimeout = setTimeout(() => this.closeFlyout(), 120);
  }

  protected closeFlyoutOnScroll(): void {
    this.closeFlyout();
  }

  protected cancelScheduledFlyoutClose(): void {
    if (this.closeFlyoutTimeout === null) {
      return;
    }

    clearTimeout(this.closeFlyoutTimeout);
    this.closeFlyoutTimeout = null;
  }

  protected handleFlyoutFocusOut(): void {
    queueMicrotask(() => {
      if (!this.isFocusWithinFlyout()) {
        this.closeFlyout();
      }
    });
  }

  protected closeAfterNavigation(): void {
    this.closeFlyout();
    this.closed.emit();
  }

  protected processCommands(enlace: string): readonly string[] {
    const normalized = enlace.trim().replace(/^\/+/, '');
    return ['/app', ...normalized.split('/')];
  }

  private orderAuthorizedMenus(menus: readonly AuthContextMenu[]): readonly AuthContextMenu[] {
    return menus
      .map((menu, originalIndex) => ({ menu, originalIndex }))
      .filter(({ menu }) => {
        if (normalizeMenuName(menu.nombre) !== DASHBOARD_MENU_NAME) {
          return true;
        }

        return menu.procesos.some(
          (process) => normalizeProcessLink(process.enlace) === DASHBOARD_PROCESS_LINK,
        );
      })
      .map(({ menu, originalIndex }) => ({
        menu: {
          ...menu,
          procesos: menu.procesos
            .map((process, processIndex) => ({ process, processIndex }))
            .sort((left, right) => {
              const leftOrder =
                PROCESS_DISPLAY_ORDER.get(normalizeProcessLink(left.process.enlace)) ??
                Number.MAX_SAFE_INTEGER;
              const rightOrder =
                PROCESS_DISPLAY_ORDER.get(normalizeProcessLink(right.process.enlace)) ??
                Number.MAX_SAFE_INTEGER;

              return leftOrder - rightOrder || left.processIndex - right.processIndex;
            })
            .map(({ process }) => process),
        },
        originalIndex,
      }))
      .sort((left, right) => {
        const leftOrder =
          MENU_DISPLAY_ORDER.get(normalizeMenuName(left.menu.nombre)) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder =
          MENU_DISPLAY_ORDER.get(normalizeMenuName(right.menu.nombre)) ?? Number.MAX_SAFE_INTEGER;

        return leftOrder - rightOrder || left.originalIndex - right.originalIndex;
      })
      .map(({ menu }) => menu);
  }

  protected flyoutId(menuId: number): string {
    return `sidebar-flyout-${menuId}`;
  }

  private closeFlyout(restoreFocus = false): void {
    this.cancelScheduledFlyoutClose();
    const trigger = this.activeFlyoutTrigger;

    this.activeFlyoutMenuId.set(null);
    this.flyoutPosition.set(null);
    this.activeFlyoutTrigger = null;

    if (restoreFocus) {
      this.ignoreNextTriggerFocus = true;
      queueMicrotask(() => {
        trigger?.focus();
        this.ignoreNextTriggerFocus = false;
      });
    }
  }

  private calculateFlyoutPosition(trigger: HTMLButtonElement): FlyoutPosition {
    const triggerBounds = trigger.getBoundingClientRect();
    const viewportHeight = this.document.defaultView?.innerHeight ?? 0;
    const viewportPadding = 16;

    return {
      left: triggerBounds.right,
      top: triggerBounds.top,
      maxHeight: Math.max(viewportHeight - triggerBounds.top - viewportPadding, 0),
    };
  }

  private isFocusWithinFlyout(): boolean {
    const activeElement = this.document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return false;
    }

    const flyoutId = this.activeFlyoutMenuId();
    const flyout = flyoutId === null ? null : this.document.getElementById(this.flyoutId(flyoutId));

    return Boolean(
      this.activeFlyoutTrigger?.contains(activeElement) || flyout?.contains(activeElement),
    );
  }

  private isDesktop(): boolean {
    const matchMedia = this.document.defaultView?.matchMedia;
    return (
      typeof matchMedia === 'function' &&
      matchMedia.call(this.document.defaultView, '(min-width: 1024px)').matches
    );
  }
}
