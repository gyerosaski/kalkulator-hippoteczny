import { TestBed } from '@angular/core/testing';

import { Form } from './form';

describe('Form', () => {
  let service: Form;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Form);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
