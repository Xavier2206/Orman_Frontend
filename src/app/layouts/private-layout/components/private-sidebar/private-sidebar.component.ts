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
import { Router, RouterLink, RouterLinkActive, type IsActiveMatchOptions } from '@angular/router';

import { AuthContextMenu } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';

interface FlyoutPosition {
  readonly top: number;
  readonly left: number;
  readonly maxHeight: number;
}

const PROCESS_ROUTE_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

const FLYOUT_VIEWPORT_PADDING = 16;
const FLYOUT_WIDTH = 240;
const FLYOUT_ROW_HEIGHT = 40;
const FLYOUT_ROW_GAP = 4;

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
  private readonly router = inject(Router);
  private closeFlyoutTimeout: ReturnType<typeof setTimeout> | null = null;
  private activeFlyoutTrigger: HTMLButtonElement | null = null;
  private ignoreNextTriggerFocus = false;
  private pointerWithinFlyout = false;

  protected readonly context = this.authContext.context;
  protected readonly selectedRole = this.authContext.selectedRole;
  protected readonly selectedMenus = computed(() =>
    this.orderAuthorizedMenus(this.authContext.selectedMenus()),
  );
  protected readonly isLoading = this.authContext.loading;
  protected readonly contextError = this.authContext.error;
  protected readonly isCollapsed = signal(false);
  protected readonly expandedMenuId = signal<number | null>(null);
  protected readonly activeFlyoutMenuId = signal<number | null>(null);
  protected readonly flyoutPosition = signal<FlyoutPosition | null>(null);
  readonly open = input(false);
  readonly closed = output<void>();

  constructor() {
    effect(() => {
      this.selectedRole();
      this.selectedMenus();
      this.expandedMenuId.set(null);
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
      this.closeFlyout();
      return;
    }

    const activeMenuId = this.activeFlyoutMenuId();
    const trigger = this.activeFlyoutTrigger;
    const menu = this.selectedMenus().find((item) => item.codm === activeMenuId);

    if (activeMenuId !== null && trigger && menu) {
      this.flyoutPosition.set(this.calculateFlyoutPosition(trigger, menu));
    }
  }

  protected toggleCollapsed(): void {
    this.isCollapsed.update((isCollapsed) => !isCollapsed);
    this.closeFlyout();
  }

  protected toggleExpandedMenu(menuId: number): void {
    this.expandedMenuId.update((currentMenuId) => (currentMenuId === menuId ? null : menuId));
  }

  protected isMenuActive(menu: AuthContextMenu): boolean {
    return menu.procesos.some((process) => {
      const processLink = process.enlace?.trim();
      if (!processLink) {
        return false;
      }

      const processRoute = this.router.createUrlTree(this.processCommands(processLink));
      return this.router.isActive(processRoute, PROCESS_ROUTE_MATCH_OPTIONS);
    });
  }

  protected openFlyout(menuId: number, trigger: HTMLButtonElement): void {
    if (!this.isCollapsed() || !this.isDesktop()) {
      return;
    }

    const menu = this.selectedMenus().find((item) => item.codm === menuId);
    if (!menu) {
      return;
    }

    if (this.activeFlyoutMenuId() !== menuId) {
      this.pointerWithinFlyout = false;
    }

    this.cancelScheduledFlyoutClose();
    this.activeFlyoutTrigger = trigger;
    this.activeFlyoutMenuId.set(menuId);
    this.flyoutPosition.set(this.calculateFlyoutPosition(trigger, menu));
  }

  protected handleFlyoutTriggerPointerEnter(menuId: number, trigger: HTMLButtonElement): void {
    if (this.activeFlyoutMenuId() !== menuId && this.isFocusWithinFlyout()) {
      this.pointerWithinFlyout = false;
      this.scheduleFlyoutClose();
      return;
    }

    this.openFlyout(menuId, trigger);
    this.pointerWithinFlyout = true;
    this.cancelScheduledFlyoutClose();
  }

  protected handleFlyoutPanelPointerEnter(): void {
    this.pointerWithinFlyout = true;
    this.cancelScheduledFlyoutClose();
  }

  protected handleFlyoutPointerLeave(): void {
    this.pointerWithinFlyout = false;
    this.scheduleFlyoutClose();
  }

  protected openFlyoutFromFocus(menuId: number, trigger: HTMLButtonElement): void {
    if (this.ignoreNextTriggerFocus) {
      this.ignoreNextTriggerFocus = false;
      return;
    }

    if (this.activeFlyoutMenuId() !== menuId) {
      this.pointerWithinFlyout = false;
    }

    this.openFlyout(menuId, trigger);
  }

  protected handleFlyoutTriggerKeydown(event: KeyboardEvent, menuId: number): void {
    if (event.key !== 'Tab' || event.shiftKey) {
      return;
    }

    const firstProcessLink = this.flyoutProcessLinks(menuId)[0];
    if (!firstProcessLink) {
      return;
    }

    event.preventDefault();
    firstProcessLink.focus();
  }

  protected handleFlyoutProcessKeydown(
    event: KeyboardEvent,
    menuId: number,
    processLink: HTMLAnchorElement,
  ): void {
    if (event.key !== 'Tab') {
      return;
    }

    const processLinks = this.flyoutProcessLinks(menuId);
    const processIndex = processLinks.indexOf(processLink);
    const trigger = this.activeFlyoutTrigger;

    if (!trigger) {
      return;
    }

    if (event.shiftKey && processIndex === 0) {
      event.preventDefault();
      trigger.focus();
      return;
    }

    if (!event.shiftKey && processIndex === processLinks.length - 1) {
      const nextTrigger =
        trigger
          .closest('li')
          ?.nextElementSibling?.querySelector<HTMLButtonElement>('.sidebar-menu-trigger') ?? null;

      if (!nextTrigger) {
        return;
      }

      event.preventDefault();
      nextTrigger.focus();
    }
  }

  protected scheduleFlyoutClose(): void {
    this.cancelScheduledFlyoutClose();
    this.closeFlyoutTimeout = setTimeout(() => {
      this.closeFlyoutTimeout = null;
      this.closeFlyoutIfUnoccupied();
    }, 120);
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
      this.closeFlyoutIfUnoccupied();
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

  protected processesId(menuId: number): string {
    return `sidebar-processes-${menuId}`;
  }

  private flyoutProcessLinks(menuId: number): HTMLAnchorElement[] {
    const flyout = this.document.getElementById(this.flyoutId(menuId));
    return flyout ? [...flyout.querySelectorAll<HTMLAnchorElement>('.sidebar-process')] : [];
  }

  private closeFlyoutIfUnoccupied(): void {
    if (this.pointerWithinFlyout || this.isFocusWithinFlyout()) {
      return;
    }

    this.closeFlyout();
  }

  private closeFlyout(restoreFocus = false): void {
    this.cancelScheduledFlyoutClose();
    const trigger = this.activeFlyoutTrigger;

    this.activeFlyoutMenuId.set(null);
    this.flyoutPosition.set(null);
    this.activeFlyoutTrigger = null;
    this.pointerWithinFlyout = false;

    if (restoreFocus) {
      this.ignoreNextTriggerFocus = true;
      queueMicrotask(() => {
        trigger?.focus();
        this.ignoreNextTriggerFocus = false;
      });
    }
  }

  private calculateFlyoutPosition(
    trigger: HTMLButtonElement,
    menu: AuthContextMenu,
  ): FlyoutPosition {
    const triggerBounds = trigger.getBoundingClientRect();
    const viewportHeight = this.document.defaultView?.innerHeight ?? 0;
    const viewportWidth = this.document.defaultView?.innerWidth ?? 0;
    const maximumHeight = Math.max(viewportHeight - FLYOUT_VIEWPORT_PADDING * 2, 0);
    const estimatedHeight = this.estimateFlyoutHeight(menu);
    const panelHeight = Math.min(estimatedHeight, maximumHeight);
    const availableBelow = viewportHeight - triggerBounds.top - FLYOUT_VIEWPORT_PADDING;
    const preferredTop =
      estimatedHeight <= availableBelow ? triggerBounds.top : triggerBounds.bottom - panelHeight;
    const maximumTop = Math.max(
      FLYOUT_VIEWPORT_PADDING,
      viewportHeight - FLYOUT_VIEWPORT_PADDING - panelHeight,
    );
    const top = Math.min(Math.max(preferredTop, FLYOUT_VIEWPORT_PADDING), maximumTop);
    const maximumLeft = Math.max(
      FLYOUT_VIEWPORT_PADDING,
      viewportWidth - FLYOUT_VIEWPORT_PADDING - FLYOUT_WIDTH,
    );
    const preferredLeft =
      triggerBounds.right + FLYOUT_WIDTH <= viewportWidth - FLYOUT_VIEWPORT_PADDING
        ? triggerBounds.right
        : triggerBounds.left - FLYOUT_WIDTH;
    const left = Math.min(Math.max(preferredLeft, FLYOUT_VIEWPORT_PADDING), maximumLeft);

    return {
      left,
      top,
      maxHeight: maximumHeight,
    };
  }

  private estimateFlyoutHeight(menu: AuthContextMenu): number {
    const panelAndHeadingHeight = 52;
    if (menu.procesos.length === 0) {
      return panelAndHeadingHeight;
    }

    const rowGapsHeight = Math.max(menu.procesos.length - 1, 0) * FLYOUT_ROW_GAP;
    const processListHeight =
      menu.procesos.length * FLYOUT_ROW_HEIGHT + rowGapsHeight + FLYOUT_ROW_GAP * 2;

    return panelAndHeadingHeight + processListHeight;
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
