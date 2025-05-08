import { TestBed } from '@angular/core/testing';

import { KiadasService } from './kiadas.service';

describe('KiadasService', () => {
  let service: KiadasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KiadasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
