import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

const EP = endpoints.storeInventory;

export const REORDER_RULE_MODULE_CONFIGS = {
  reorderRules: {
    title: 'Reorder Rules',
    singularTitle: 'Reorder Rule',
    pageDescription:
      'Manage stock replenishment policies with backend filters, detail pages, and full create, update, and delete support.',
    listEndpoint: EP.reorder_rules,
    detailEndpoint: EP.reorder_rule_by_id,
    listPath: paths.dashboard.storeInventory.reorderRules,
    detailPath: paths.dashboard.storeInventory.reorderRule_detail,
    paramKeys: ['ruleId'],
    loadError:
      'Failed to load reorder rules. Check the backend response or active filters and try again.',
    listInfo:
      'This page now uses the real reorder-rules API contract with server-side search, product and warehouse filters, pagination, and full CRUD support.',
    emptyTitle: 'No reorder rules found',
    emptyDescription: 'Adjust the filters or add a new replenishment rule.',
    detailError:
      'This reorder rule could not be loaded. The record may have been removed or the backend returned an error.',
    detailInfo:
      'This detail view reads and updates the live reorder-rules endpoint, including server-side product and warehouse relations.',
    backToListLabel: 'Back to Reorder Rules',
    returnToListLabel: 'Return to Reorder Rules',
    createdToast: 'Reorder rule created successfully.',
    updatedToast: 'Reorder rule updated successfully.',
    deletedToast: 'Reorder rule deleted successfully.',
  },
  replenishment: {
    title: 'Replenishment',
    singularTitle: 'Replenishment Rule',
    pageDescription:
      'Manage replenishment policies with backend filters, detail pages, and full create, update, and delete support.',
    listEndpoint: EP.replenishments,
    detailEndpoint: EP.replenishment_by_id,
    listPath: paths.dashboard.storeInventory.replenishment,
    detailPath: paths.dashboard.storeInventory.replenishment_detail,
    paramKeys: ['replenishmentId', 'ruleId'],
    loadError:
      'Failed to load replenishment rules. Check the backend response or active filters and try again.',
    listInfo:
      'This page now uses the live replenishments API alias with server-side search, product and warehouse filters, pagination, and full CRUD support.',
    emptyTitle: 'No replenishment rules found',
    emptyDescription: 'Adjust the filters or add a new replenishment rule.',
    detailError:
      'This replenishment rule could not be loaded. The record may have been removed or the backend returned an error.',
    detailInfo:
      'This detail view reads and updates the live replenishments endpoint, including server-side product and warehouse relations.',
    backToListLabel: 'Back to Replenishment',
    returnToListLabel: 'Return to Replenishment',
    createdToast: 'Replenishment rule created successfully.',
    updatedToast: 'Replenishment rule updated successfully.',
    deletedToast: 'Replenishment rule deleted successfully.',
  },
};

export function getReorderRuleModuleConfig(moduleKey = 'reorderRules') {
  return REORDER_RULE_MODULE_CONFIGS[moduleKey] || REORDER_RULE_MODULE_CONFIGS.reorderRules;
}
