import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FotoVisorComponent } from './foto-visor.component';

describe('FotoVisorComponent', () => {
  let component: FotoVisorComponent;
  let fixture: ComponentFixture<FotoVisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FotoVisorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FotoVisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
