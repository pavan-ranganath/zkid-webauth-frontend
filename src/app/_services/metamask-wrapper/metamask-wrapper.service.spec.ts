import { TestBed } from '@angular/core/testing';

import { MetamaskWrapperService } from './metamask-wrapper.service';

describe('MetamaskWrapperService', () => {
  let service: MetamaskWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetamaskWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
