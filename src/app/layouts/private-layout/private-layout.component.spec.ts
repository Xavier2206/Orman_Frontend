import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PrivateLayoutComponent } from './private-layout.component';

describe('PrivateLayoutComponent', () => {
  let fixture: ComponentFixture<PrivateLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivateLayoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(PrivateLayoutComponent);
    fixture.detectChanges();
  });

  it('should render the permanent private shell and its outlet', () => {
    expect(fixture.nativeElement.querySelector('app-private-topbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main router-outlet')).toBeTruthy();
    const shell = fixture.nativeElement.querySelector('div') as HTMLElement;
    const body = shell.querySelector(':scope > div') as HTMLElement;
    expect(shell.className).toContain('h-[100dvh]');
    expect(shell.className).toContain('overflow-hidden');
    expect(body.className).toContain('w-full');
    expect(body.className).not.toContain('max-w-[1800px]');
    expect(fixture.nativeElement.querySelector('app-private-sidebar')).toBeTruthy();
  });

  it('should expose the sidebar hamburger as the only sidebar toggle control', () => {
    const trigger = fixture.nativeElement.querySelector('app-private-sidebar [aria-controls="private-sidebar"]');
    expect(trigger).toBeTruthy();
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeTruthy();
  });

  it('should toggle the desktop collapsed state without restoring mock navigation items', () => {
    const collapse = fixture.nativeElement.querySelector('app-private-sidebar [aria-controls="private-sidebar"]') as HTMLButtonElement;
    expect(collapse).toBeTruthy();
    collapse.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-collapsed')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Dashboard');
  });

  it('should close the mobile drawer using backdrop and Escape', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
    const trigger = fixture.nativeElement.querySelector('app-private-sidebar [aria-controls="private-sidebar"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.private-sidebar-backdrop')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.private-sidebar-backdrop') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    window.matchMedia = originalMatchMedia;
  });
});
