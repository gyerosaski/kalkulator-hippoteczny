import { inject, Injectable, signal } from '@angular/core';

import { InstallmentType, RateType } from '../../model';
import { SavedCalculation, SavedCalculationRecord } from '../../model';
import { CalculationsStoreService } from '../calculations-store/calculations-store.service';

export function toSavedCalculation(record: SavedCalculationRecord): SavedCalculation {
  const rawData = record.data as Record<string, unknown>;
  const basicData = (rawData?.['basicData'] ?? {}) as Record<string, unknown>;
  const ratePeriods = (basicData?.['ratePeriods'] as unknown[]) ?? [];
  const firstRate = (ratePeriods[0] ?? {}) as Record<string, unknown>;

  const loanPeriodMonths = Number(basicData?.['loanPeriod'] ?? 0);
  const rateType = (firstRate?.['rateType'] as RateType) ?? RateType.VARIABLE;
  const wibor = Number(firstRate?.['wibor'] ?? 0);
  const margin = Number(firstRate?.['margin'] ?? 0);
  const nominalRate =
    rateType === RateType.VARIABLE ? wibor + margin : Number(firstRate?.['nominalRate'] ?? 0);

  const createdAt = new Date(record.createdAt);
  const updatedAt = record.updatedAt ? new Date(record.updatedAt) : createdAt;

  return {
    name: record.name,
    loanAmount: Number(basicData?.['loanAmount'] ?? 0),
    propertyValue: Number(basicData?.['propertyValue'] ?? 0),
    loanPeriodMonths,
    loanPeriodYears: Math.floor(loanPeriodMonths / 12),
    loanPeriodExtraMonths: loanPeriodMonths % 12,
    installmentType: (basicData?.['installmentType'] as InstallmentType) ?? InstallmentType.EQUAL,
    rateType,
    wibor,
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

  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    try {
      const records = await this.calculationsStore.listCalculations();
      this.recordsSignal.set(records);
    } finally {
      this.isLoading.set(false);
    }
  }

  async rename(oldName: string, newName: string): Promise<void> {
    const records = await this.calculationsStore.listCalculations();
    const existing = records.find((record) => record.name === oldName);
    if (!existing) return;

    const renamed: SavedCalculationRecord = {
      ...existing,
      name: newName,
      updatedAt: new Date().toISOString(),
    };
    await this.calculationsStore.saveCalculation(renamed);
    await this.calculationsStore.deleteCalculation(oldName);
    await this.refreshRecords();
  }

  async duplicate(sourceName: string): Promise<string | null> {
    const records = await this.calculationsStore.listCalculations();
    const source = records.find((record) => record.name === sourceName);
    if (!source) return null;

    const now = new Date().toISOString();
    const copyName = `${sourceName} — kopia`;
    const copy: SavedCalculationRecord = {
      ...source,
      name: copyName,
      createdAt: now,
      updatedAt: now,
    };
    await this.calculationsStore.saveCalculation(copy);
    await this.refreshRecords();
    return copyName;
  }

  async remove(name: string): Promise<void> {
    await this.calculationsStore.deleteCalculation(name);
    await this.refreshRecords();
  }

  async importFromFile(): Promise<void> {
    const result = await this.calculationsStore.importFromFile();
    if (!result?.record) return;

    const now = new Date().toISOString();
    const record: SavedCalculationRecord = {
      ...result.record,
      updatedAt: now,
    };
    await this.calculationsStore.saveCalculation(record);
    await this.refreshRecords();
  }

  public async refreshRecords(): Promise<void> {
    const records = await this.calculationsStore.listCalculations();
    this.recordsSignal.set(records);
  }
}
