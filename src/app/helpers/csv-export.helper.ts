import { ScheduleRow } from '../model';

/**
 * Buduje pliki CSV w wariancie zgodnym z polskim Excelem:
 * separator kolumn to średnik, separator dziesiętny to przecinek,
 * a plik jest poprzedzony znacznikiem BOM UTF-8 (poprawne polskie znaki).
 */

const COLUMN_SEPARATOR = ';';
const ROW_SEPARATOR = '\r\n';
const UTF8_BOM = '﻿';

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
