import { ColorCodeMarkerVariant } from './mortgage.model';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface ChartSlice extends DonutSlice {
  variant: ColorCodeMarkerVariant;
}
