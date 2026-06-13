import { Pipe, PipeTransform } from '@angular/core';
import { InterestComponentKind } from '../../model';

const LABELS: Record<InterestComponentKind, string> = {
  [InterestComponentKind.BASE]: 'Odsetki bazowe',
  [InterestComponentKind.BRIDGE_INSURANCE]: 'Ubezpieczenie pomostowe',
  [InterestComponentKind.LOW_EQUITY_INSURANCE]: 'Ubezpieczenie niskiego wkładu',
  [InterestComponentKind.PROMOTIONAL_DISCOUNT]: 'Promocja oprocentowania',
};

@Pipe({ name: 'interestComponentKindLabel', standalone: true })
export class InterestComponentKindLabelPipe implements PipeTransform {
  transform(kind: InterestComponentKind): string {
    return LABELS[kind];
  }
}
