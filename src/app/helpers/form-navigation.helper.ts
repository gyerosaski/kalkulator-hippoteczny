import {
  FormSectionId,
  FormSectionNavigationTarget,
  InterestComponentKind,
  OverheadCostKind,
} from '../model';

/** Klucze podsekcji odpowiadają wartościom porównywanym z `openSubsection()` w szablonach formularzy. */
const OVERHEAD_COST_NAVIGATION_TARGETS: Record<OverheadCostKind, FormSectionNavigationTarget> = {
  [OverheadCostKind.LOAN_COMMISSION]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'commission',
  },
  [OverheadCostKind.APPRAISAL_FEE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'appraisal',
  },
  [OverheadCostKind.PROPERTY_INSURANCE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'propertyInsurance',
  },
  [OverheadCostKind.LIFE_INSURANCE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'lifeInsurance',
  },
  [OverheadCostKind.JOB_LOSS_INSURANCE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'jobLossInsurance',
  },
  [OverheadCostKind.ADDITIONAL_COST]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'additionalCosts',
  },
  [OverheadCostKind.EARLY_REPAYMENT_COMMISSION]: {
    sectionId: FormSectionId.PREPAYMENTS,
    subsectionKey: 'prowizjaWczesniejszaSplata',
  },
  [OverheadCostKind.TRANCHE_DISBURSEMENT_FEE]: {
    sectionId: FormSectionId.TRANCHES,
  },
};

/** Klucze podsekcji odpowiadają wartościom porównywanym z `openSubsection()` w szablonie kosztów. */
const INTEREST_COMPONENT_NAVIGATION_TARGETS: Record<
  InterestComponentKind,
  FormSectionNavigationTarget
> = {
  [InterestComponentKind.BASE]: {
    sectionId: FormSectionId.RATE_PERIODS,
  },
  [InterestComponentKind.BRIDGE_INSURANCE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'bridge',
  },
  [InterestComponentKind.LOW_EQUITY_INSURANCE]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'lowEquityInsurance',
  },
  [InterestComponentKind.PROMOTIONAL_DISCOUNT]: {
    sectionId: FormSectionId.OVERHEAD_COSTS,
    subsectionKey: 'promoRate',
  },
};

export const PREPAYMENTS_NAVIGATION_TARGET: FormSectionNavigationTarget = {
  sectionId: FormSectionId.PREPAYMENTS,
};

export function overheadCostNavigationTarget(kind: OverheadCostKind): FormSectionNavigationTarget {
  return OVERHEAD_COST_NAVIGATION_TARGETS[kind];
}

export function interestComponentNavigationTarget(
  kind: InterestComponentKind,
): FormSectionNavigationTarget {
  return INTEREST_COMPONENT_NAVIGATION_TARGETS[kind];
}

export function formSectionAnchorId(sectionId: FormSectionId): string {
  return `form-section-${sectionId.toLowerCase()}`;
}
