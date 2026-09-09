import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AsignarProcesosListComponent } from './asignar-procesos-list.component';

describe('AsignarProcesosListComponent', () => {
  let fixture: ComponentFixture<AsignarProcesosListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarProcesosListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarProcesosListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
