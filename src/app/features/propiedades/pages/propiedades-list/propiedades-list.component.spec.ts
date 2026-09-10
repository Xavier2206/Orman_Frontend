import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropiedadesListComponent } from './propiedades-list.component';

describe('PropiedadesListComponent', () => {
  let fixture: ComponentFixture<PropiedadesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadesListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropiedadesListComponent);
  });

  it('should create the initial feature structure', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
