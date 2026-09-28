import { inject, Injectable, signal } from '@angular/core';

import { InstallmentType, RateType } from '../../model';
import {
  CalculationImportResult,
  CalculationImportStatus,
  SavedCalculation,
  SavedCalculationRecord,
} from '../../model';
import { CalculationsStoreService } from '../calculations-store/calculations-store.service';
import { buildUniqueCalculationName } from '../../helpers/saved-calculation-import.helper';
import { createCalculationId } from '../../helpers/saved-calculation-identity.helper';

export function toSavedCalculation(record: SavedCalculationRecord): SavedCalculation {
  const basicData = record.data.basicData;
  const firstRatePeriod = record.data.ratePeriods.items[0];

  const loanPeriodMonths = Number(basicData.loanPeriod ?? 0);
  const rateType = firstRatePeriod?.rateType ?? RateType.VARIABLE;
  const referenceIndex = Number(firstRatePeriod?.referenceIndex ?? 0);
  const margin = Number(firstRatePeriod?.margin ?? 0);
  const nominalRate =
    rateType === RateType.VARIABLE
      ? referenceIndex + margin
      : Number(firstRatePeriod?.nominalRate ?? 0);

  const createdAt = new Date(record.createdAt);
  const updatedAt = record.updatedAt ? new Date(record.updatedAt) : createdAt;

  return {
    id: record.id,
    name: record.name,
    loanAmount: Number(basicData.loanAmount ?? 0),
    propertyValue: Number(basicData.propertyValue ?? 0),
    loanPeriodMonths,
    loanPeriodYears: Math.floor(loanPeriodMonths / 12),
    loanPeriodExtraMonths: loanPeriodMonths % 12,
    installmentType: basicData.installmentType ?? InstallmentType.EQUAL,
    rateType,
    referenceIndex,
    margin,
    nominalRate,
    firstInstallment: record.metadata?.firstInstallment ?? 0,
    totalInterest: record.metadata?.totalInterest ?? 0,
    totalCosts: record.metadata?.totalCosts ?? 0,
    commission: record.metadata?.commission ?? 0,
    appraisalFee: record.metadata?.appraisalFee ?? 0,
    totalOverpayments: record.metadata?.totalOverpayments ?? 0,
    totalPayments: record.metadata?.totalPayments ?? 0,
    overpaymentsEnabled: record.metadata?.overpaymentsEnabled ?? false,
    trancheCount: record.metadata?.trancheCount ?? 1,
    hasErrors: record.metadata?.hasErrors ?? false,
    createdAt,
    updatedAt,
  };
}

@Injectable({ providedIn: 'root' })
export class SavedCalculationsStateService {
  private readonly calculationsStore = inject(CalculationsStoreService);

  private readonly recordsSignal = signal<SavedCalculationRecord[]>([]);
  readonly records = this.recordsSignal.asReadonly();
  readonly isLoading = signal(false);
  /** Liczba kalkulacji w kopii zapasowej, gdy lista jest pusta (0 — brak czego przywracać). */
  readonly backupRecordCount = signal(0);

  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    try {
      const records = await this.calculationsStore.listCalculations();
      this.recordsSignal.set(records);
      await this.refreshBackupRecordCount(records);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Czy nazwa jest zajęta przez inną zapisaną kalkulację niż wskazana (`exceptId`). */
  isNameTaken(name: string, exceptId?: string): boolean {
    return this.recordsSignal().some((record) => record.name === name && record.id !== exceptId);
  }

  /**
   * Zmienia nazwę kalkulacji jednym zapisem.
   * @returns `false`, gdy nazwa jest zajęta przez inną kalkulację lub rekord nie istnieje.
   */
  async rename(id: string, newName: string): Promise<boolean> {
    await this.refreshRecords();
    if (this.isNameTaken(newName, id)) return false;

    const renamed = await this.calculationsStore.updateCalculation(id, {
      name: newName,
      updatedAt: new Date().toISOString(),
    });
    await this.refreshRecords();
    return renamed;
  }

  /** Tworzy kopię kalkulacji pod unikalną nazwą („ — kopia”, „ — kopia (2)”…). */
  async duplicate(sourceId: string): Promise<string | null> {
    const records = await this.calculationsStore.listCalculations();
    const source = records.find((record) => record.id === sourceId);
    if (!source) return null;

    const now = new Date().toISOString();
    const copyName = buildUniqueCalculationName(
      source.name,
      records.map((record) => record.name),
    );
    const copy: SavedCalculationRecord = {
      ...source,
      id: createCalculationId(),
      name: copyName,
      createdAt: now,
      updatedAt: now,
    };
    await this.calculationsStore.saveCalculation(copy);
    await this.refreshRecords();
    return copyName;
  }

  async remove(id: string): Promise<void> {
    await this.calculationsStore.deleteCalculation(id);
    await this.refreshRecords();
  }

  /** Przywraca kalkulacje z kopii zapasowej. @returns liczba przywróconych kalkulacji. */
  async restoreBackup(): Promise<number> {
    const restoredCount = await this.calculationsStore.restoreFromBackup();
    await this.refreshRecords();
    this.backupRecordCount.set(0);
    return restoredCount;
  }

  /** Odrzuca kopię zapasową — baner przywracania przestaje się pojawiać. */
  async discardBackup(): Promise<void> {
    await this.calculationsStore.discardBackup();
    this.backupRecordCount.set(0);
  }

  async importFromFile(): Promise<CalculationImportResult> {
    const importedRecords = await this.calculationsStore.importFromFile();
    if (importedRecords === null) {
      return { status: CalculationImportStatus.CANCELED, importedCount: 0 };
    }
    if (importedRecords.length === 0) {
      return { status: CalculationImportStatus.INVALID_FILE, importedCount: 0 };
    }

    // zapis każdego rekordu z rozwiązaniem kolizji nazw (import jako kopia)
    const now = new Date().toISOString();
    const takenNames = new Set(this.recordsSignal().map((record) => record.name));
    for (const importedRecord of importedRecords) {
      const uniqueName = buildUniqueCalculationName(importedRecord.name, takenNames);
      takenNames.add(uniqueName);
      // importowany rekord zawsze dostaje nowy identyfikator — plik może pochodzić z eksportu
      // tej samej kalkulacji, która nadal jest na liście
      const record: SavedCalculationRecord = {
        ...importedRecord,
        id: createCalculationId(),
        name: uniqueName,
        updatedAt: now,
      };
      await this.calculationsStore.saveCalculation(record);
    }

    await this.refreshRecords();
    return { status: CalculationImportStatus.SUCCESS, importedCount: importedRecords.length };
  }

  public async refreshRecords(): Promise<void> {
    const records = await this.calculationsStore.listCalculations();
    this.recordsSignal.set(records);
  }

  /** baner przywracania ma sens tylko przy pustej liście i niepustej kopii zapasowej */
  private async refreshBackupRecordCount(records: SavedCalculationRecord[]): Promise<void> {
    if (records.length) {
      this.backupRecordCount.set(0);
      return;
    }
    const backupRecords = await this.calculationsStore.listBackupCalculations();
    this.backupRecordCount.set(backupRecords.length);
  }
}
