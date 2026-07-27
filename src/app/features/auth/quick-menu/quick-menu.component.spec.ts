import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickMenuComponent } from './quick-menu.component';

describe('QuickMenuComponent', () => {
  let fixture: ComponentFixture<QuickMenuComponent>;

  beforeEach(async () => {
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({ imports: [QuickMenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(QuickMenuComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.body.style.overflow = '';
  });

  function clickButton(label: string): void {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement | undefined;

    button?.click();
    fixture.detectChanges();
  }

  it('should create and render the access content', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Acceso a ORMAN');
    expect(fixture.nativeElement.textContent).toContain(
      'Continúa para ingresar tus credenciales.',
    );
  });

  it('should emit close from Cancel', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    clickButton('Cancelar');

    expect(close).toHaveBeenCalledOnce();
  });

  it('should emit close from the close button', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    const closeButton = fixture.nativeElement.querySelector(
      '[aria-label="Cerrar acceso a ORMAN"]',
    ) as HTMLButtonElement;
    closeButton.click();

    expect(close).toHaveBeenCalledOnce();
  });

  it('should emit connect from Connect', () => {
    const connect = vi.fn();
    fixture.componentInstance.connect.subscribe(connect);

    clickButton('Conectar');

    expect(connect).toHaveBeenCalledOnce();
  });

  it('should emit close with Escape', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(close).toHaveBeenCalledOnce();
  });

  it('should close from an outside click but not from an inside click', () => {
    const close = vi.fn();
    fixture.componentInstance.close.subscribe(close);
    const panel = fixture.nativeElement.querySelector('#orman-quick-menu') as HTMLElement;

    panel.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(close).not.toHaveBeenCalled();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(close).toHaveBeenCalledOnce();
  });

  it('should use non-modal semantics without an overlay', () => {
    const panel = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(panel.hasAttribute('aria-modal')).toBe(false);
    expect(panel.getAttribute('aria-labelledby')).toBe('quick-menu-title');
    expect(panel.getAttribute('aria-describedby')).toBe('quick-menu-description');
    expect(fixture.nativeElement.querySelector('.login-modal-overlay')).toBeNull();
  });

  it('should not lock document scrolling', () => {
    expect(document.body.style.overflow).toBe('');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });

  it('should focus Connect as the first flow action', async () => {
    await fixture.whenStable();
    const connectButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (candidate: HTMLButtonElement) => candidate.textContent?.trim() === 'Conectar',
    ) as HTMLButtonElement;

    expect(document.activeElement).toBe(connectButton);
  });

  it('should expose keyboard-operable native buttons', () => {
    const buttons = [
      ...fixture.nativeElement.querySelectorAll('button'),
    ] as HTMLButtonElement[];

    expect(buttons).toHaveLength(3);
    expect(buttons.every((button) => button.type === 'button')).toBe(true);
  });

  it('should apply the independent mobile variant', () => {
    fixture.componentRef.setInput('origin', 'mobile');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.quick-menu-panel-mobile')).toBeTruthy();
  });
});
