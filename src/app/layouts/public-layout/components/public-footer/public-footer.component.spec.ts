import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicFooterComponent } from './public-footer.component';

describe('PublicFooterComponent', () => {
  let fixture: ComponentFixture<PublicFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PublicFooterComponent] }).compileComponents();
    fixture = TestBed.createComponent(PublicFooterComponent);
    fixture.detectChanges();
  });

  it('should render ORMAN and the 2026 copyright', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('ORMAN');
    expect(text).toContain('© 2026 ORMAN');
  });

  it('should render the internal links', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#inicio',
      '#propiedades',
      '#como-funciona',
      '#contacto',
    ]);
  });
});
