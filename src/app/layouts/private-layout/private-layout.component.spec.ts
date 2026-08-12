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
  });

  it('should expose an accessible mobile sidebar control', () => {
    const trigger = fixture.nativeElement.querySelector('[aria-controls="private-sidebar"]');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    fixture.detectChanges();
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
  });
});
