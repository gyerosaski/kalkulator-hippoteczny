import { FormSectionId, FormSectionNavigationTarget, OverheadCostKind } from '../model';

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

export const PREPAYMENTS_NAVIGATION_TARGET: FormSectionNavigationTarget = {
  sectionId: FormSectionId.PREPAYMENTS,
};

export function overheadCostNavigationTarget(kind: OverheadCostKind): FormSectionNavigationTarget {
  return OVERHEAD_COST_NAVIGATION_TARGETS[kind];
}

export function formSectionAnchorId(sectionId: FormSectionId): string {
  return `form-section-${sectionId.toLowerCase()}`;
}
