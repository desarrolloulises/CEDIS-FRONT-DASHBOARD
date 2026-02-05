import { TestBed } from '@angular/core/testing';

import { ProcesosCedisService } from './procesos-cedis.service';

describe('ProcesosCedisService', () => {
  let service: ProcesosCedisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcesosCedisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
