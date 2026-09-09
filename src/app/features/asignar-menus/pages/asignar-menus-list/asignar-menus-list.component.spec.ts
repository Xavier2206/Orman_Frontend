import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AsignarMenusListComponent } from './asignar-menus-list.component';

describe('AsignarMenusListComponent', () => {
  let fixture: ComponentFixture<AsignarMenusListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarMenusListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarMenusListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
