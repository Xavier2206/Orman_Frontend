import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateSidebarComponent } from './private-sidebar.component';

describe('PrivateSidebarComponent', () => {
  let fixture: ComponentFixture<PrivateSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrivateSidebarComponent] }).compileComponents();
    fixture = TestBed.createComponent(PrivateSidebarComponent);
    fixture.detectChanges();
  });

  it('should render only the structural construction state', () => {
    const content = fixture.nativeElement.textContent;
    expect(content).toContain('Menú');
    expect(content).toContain('En construcción');
    expect(content).not.toContain('Propiedades');
    expect(content).not.toContain('Personas');
  });
});
