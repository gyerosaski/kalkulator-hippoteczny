import { InstallmentTypeLabelPipe } from '../pipes/installment-type-label/installment-type-label.pipe';
import { RateTypeLabelPipe } from '../pipes/rate-type-label/rate-type-label.pipe';
import { SavedCalculation, ScheduleRow } from '../model';

/**
 * Buduje pliki CSV w wariancie zgodnym z polskim Excelem:
 * separator kolumn to średnik, separator dziesiętny to przecinek,
 * a plik jest poprzedzony znacznikiem BOM UTF-8 (poprawne polskie znaki).
 */

const COLUMN_SEPARATOR = ';';
const ROW_SEPARATOR = '\r\n';
const UTF8_BOM = '﻿';

const installmentTypeLabel = new InstallmentTypeLabelPipe();
const rateTypeLabel = new RateTypeLabelPipe();

/** Formatuje liczbę z dwoma miejscami po przecinku i przecinkiem dziesiętnym. */
export function formatCsvNumber(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2).replace('.', ',');
}

/** Otacza pole cudzysłowami, gdy zawiera separator, cudzysłów lub znak nowej linii. */
function escapeCsvField(value: string): string {
  if (/[;"\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/** Składa wiersze CSV z nagłówka i danych, dodając BOM oraz końce linii CRLF. */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((cells) => cells.map(escapeCsvField).join(COLUMN_SEPARATOR));
  return UTF8_BOM + lines.join(ROW_SEPARATOR);
}

/** Buduje CSV z tabelą podsumowań — jeden wiersz na zapisaną kalkulację. */
export function buildSummaryCsv(calculations: SavedCalculation[]): string {
  const headers = [
    'Nazwa',
    'Kwota kredytu',
    'Wartość nieruchomości',
    'Okres (miesiące)',
    'Typ rat',
    'Typ oprocentowania',
    'Oprocentowanie (%)',
    'Pierwsza rata',
    'Suma odsetek',
    'Koszty okołokredytowe',
    'Prowizja',
    'Opłata za operat',
    'Suma nadpłat',
    'Suma wpłat',
    'Nadpłaty włączone',
    'Liczba transz',
    'Data utworzenia',
    'Data modyfikacji',
  ];

  const rows = calculations.map((calculation) => [
    calculation.name,
    formatCsvNumber(calculation.loanAmount),
    formatCsvNumber(calculation.propertyValue),
    String(calculation.loanPeriodMonths),
    installmentTypeLabel.transform(calculation.installmentType),
    rateTypeLabel.transform(calculation.rateType),
    formatCsvNumber(calculation.nominalRate),
    formatCsvNumber(calculation.firstInstallment),
    formatCsvNumber(calculation.totalInterest),
    formatCsvNumber(calculation.totalCosts),
    formatCsvNumber(calculation.commission),
    formatCsvNumber(calculation.appraisalFee),
    formatCsvNumber(calculation.totalOverpayments),
    formatCsvNumber(calculation.totalPayments),
    calculation.overpaymentsEnabled ? 'Tak' : 'Nie',
    String(calculation.trancheCount),
    formatCsvDate(calculation.createdAt),
    formatCsvDate(calculation.updatedAt),
  ]);

  return toCsv(headers, rows);
}

/** Buduje CSV z pełnym harmonogramem spłaty — jeden wiersz na miesiąc. */
export function buildScheduleCsv(schedule: ScheduleRow[]): string {
  const headers = [
    'Nr',
    'Miesiąc',
    'Rata',
    'Kapitał',
    'Odsetki',
    'Oprocentowanie (%)',
    'Nadpłata',
    'Prowizja',
    'Pozostało',
    'Koszty dodatkowe',
  ];

  const rows = schedule.map((row) => [
    String(row.index),
    row.date,
    formatCsvNumber(row.rate),
    formatCsvNumber(row.capital),
    formatCsvNumber(row.interest),
    formatCsvNumber(row.interestRate),
    formatCsvNumber(row.prepayment),
    formatCsvNumber(row.commission),
    formatCsvNumber(row.remaining),
    formatCsvNumber(row.insuranceCost),
  ]);

  return toCsv(headers, rows);
}

/** Formatuje datę do postaci RRRR-MM-DD. */
function formatCsvDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}
