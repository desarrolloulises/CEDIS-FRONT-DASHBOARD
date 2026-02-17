import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inventario2Component } from './inventario2.component';

describe('Inventario2Component', () => {
  let component: Inventario2Component;
  let fixture: ComponentFixture<Inventario2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventario2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inventario2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
