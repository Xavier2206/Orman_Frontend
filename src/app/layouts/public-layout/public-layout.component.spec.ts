import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PublicLayoutComponent } from './public-layout.component';

describe('PublicLayoutComponent', () => {
  let fixture: ComponentFixture<PublicLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the public header', () => {
    expect(fixture.nativeElement.querySelector('app-public-header')).toBeTruthy();
  });

  it('should contain the router outlet inside main', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main?.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render the public footer', () => {
    expect(fixture.nativeElement.querySelector('app-public-footer')).toBeTruthy();
  });
});
