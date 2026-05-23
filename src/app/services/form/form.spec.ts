import { TestBed } from '@angular/core/testing';

import { FormService } from './form';

describe('FormService', () => {
  let service: FormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('crossFieldValidator — capitalBeforeLastTranche', () => {
    function enableTranches(): void {
      service.form.controls.tranches.controls.enabled.setValue(true);
      service.form.updateValueAndValidity();
    }

    function setCapitalStartDate(dateYm: string): void {
      service.form.controls.basicData.controls.capitalStartDate.setValue(dateYm);
      service.form.updateValueAndValidity();
    }

    function addTrancheWithDate(dateYm: string): void {
      service.addTranche();
      const lastIndex = service.tranchesArray.length - 1;
      service.tranchesArray.at(lastIndex).controls.date.setValue(dateYm);
      service.form.updateValueAndValidity();
    }

    it('should not emit capitalBeforeLastTranche when tranches are disabled', () => {
      service.form.controls.tranches.controls.enabled.setValue(false);
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-05');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should not emit capitalBeforeLastTranche when there is only one tranche (no extra tranches added)', () => {
      enableTranches();
      // Only first tranche exists — tranchesArray.length === 1
      setCapitalStartDate('2026-01');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should emit capitalBeforeLastTranche when capitalStartDate equals the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-06');
    });

    it('should emit capitalBeforeLastTranche when capitalStartDate is before the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-08');
      setCapitalStartDate('2026-07');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-08');
    });

    it('should not emit capitalBeforeLastTranche when capitalStartDate is strictly after the last tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-07');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should use the maximum date across all extra tranches as lastTrancheDate', () => {
      enableTranches();
      addTrancheWithDate('2026-04');
      addTrancheWithDate('2026-09');
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-08');

      const error = service.form.errors?.['capitalBeforeLastTranche'];
      expect(error).toBeTruthy();
      expect(error['lastTrancheDate']).toBe('2026-09');
    });

    it('should not emit capitalBeforeLastTranche when capitalStartDate is after the maximum tranche date', () => {
      enableTranches();
      addTrancheWithDate('2026-04');
      addTrancheWithDate('2026-09');
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-10');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should clear capitalBeforeLastTranche error after tranche is removed leaving only first tranche', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeTruthy();

      service.removeTranche(1);

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });

    it('should clear capitalBeforeLastTranche error after tranches are disabled', () => {
      enableTranches();
      addTrancheWithDate('2026-06');
      setCapitalStartDate('2026-06');

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeTruthy();

      service.form.controls.tranches.controls.enabled.setValue(false);
      service.form.updateValueAndValidity();

      expect(service.form.errors?.['capitalBeforeLastTranche']).toBeUndefined();
    });
  });
});
