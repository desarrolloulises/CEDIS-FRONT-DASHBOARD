import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inventario3Component } from './inventario3.component';

describe('Inventario3Component', () => {
  let component: Inventario3Component;
  let fixture: ComponentFixture<Inventario3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventario3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inventario3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
