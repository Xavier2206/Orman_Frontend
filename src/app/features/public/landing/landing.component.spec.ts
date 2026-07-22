import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the temporary public content', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('ORMAN');
    expect(element.querySelector('p')?.textContent).toContain('Frontend público en construcción.');
  });

  it('should render the theme selector and active theme', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-theme-selector')).toBeTruthy();
    expect(element.textContent).toContain('Tema activo');
    expect(element.textContent).toContain('ORMAN');
  });
});
