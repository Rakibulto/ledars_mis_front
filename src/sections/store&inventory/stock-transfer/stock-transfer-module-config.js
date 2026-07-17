import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

const EP = endpoints.storeInventory;

export const STOCK_TRANSFER_MODULE_CONFIGS = {
  stockTransfer: {
    title: 'Internal Transfer',
    singularTitle: 'Internal Transfer',
    entityLabel: 'Internal Transfer',
    recordSingular: 'internal transfer',
    recordPlural: 'internal transfers',
    filteredSummaryTitle: 'Active Transfer Records',
    pageDescription:
      'Move products from one warehouse to another with clear route ownership, live warehouse filters, and movement visibility from dispatch to receipt.',
    listInfo:
      'Track source warehouse, destination warehouse, dispatch staff, receiving staff, and movement status from one command surface. Click any transfer row to open its full route details.',
    searchPlaceholder:
      'Search transfer number, source warehouse, destination warehouse, vehicle, driver, or staff...',
    loadError: 'Stock transfer records could not be loaded from the backend.',
    emptyTitle: 'No stock transfers found',
    emptyDescription: 'Adjust the search or filters to widen the result set.',
    deleteTitle: 'Delete Internal Transfer',
    deleteContent: 'Deleting this stock transfer will also remove its generated stock movements.',
    createdToast: 'Internal transfer created successfully.',
    updatedToast: 'Internal transfer updated successfully.',
    deletedToast: 'Internal transfer deleted successfully.',
    deleteError: 'Failed to delete the selected stock transfer.',
    detailLoadError: 'Failed to load the selected stock transfer. Please try again.',
    detailHeadingFallback: 'Internal Transfer Details',
    detailDescription:
      'Review the transfer route, warehouse ownership, dispatch and receiving team, and the products moved between locations.',
    backToListLabel: 'Back to Internal Transfers',
    createLabel: 'Create Internal Transfer',
    editLabel: 'Edit Transfer',
    deleteLabel: 'Delete Transfer',
    lineItemsTitle: 'Transfer Line Items',
    lineItemsDescription:
      'Products, quantities, and valuation posted while moving stock from one warehouse to another.',
    noLineItemsDescription: 'No line items were attached to this stock transfer.',
    listEndpoint: EP.stock_transfers,
    detailEndpoint: EP.stock_transfer_by_id,
    listPath: paths.dashboard.storeInventory.stock_transfer,
    detailPath: paths.dashboard.storeInventory.stock_transfer_detail,
    paramKeys: ['transferId'],
  },
  crossDocking: {
    title: 'Cross-Docking',
    singularTitle: 'Cross-Docking Transfer',
    entityLabel: 'Cross-Docking Transfer',
    recordSingular: 'cross-docking transfer',
    recordPlural: 'cross-docking transfers',
    filteredSummaryTitle: 'Filtered Cross-Docks',
    pageDescription:
      'Manage inbound-to-outbound cross-docking movements with server-side search, route filters, pagination, row drilldown, and inline create, edit, and delete actions.',
    listInfo:
      'Search, status, source warehouse, destination warehouse, and pagination now run against the server. Click any cross-docking row to open its full movement details.',
    searchPlaceholder: 'Search cross-dock number, route, vehicle, driver, or staff...',
    loadError: 'Cross-docking records could not be loaded from the backend.',
    emptyTitle: 'No cross-docking transfers found',
    emptyDescription: 'Adjust the search or filters to widen the result set.',
    deleteTitle: 'Delete Cross-Docking Transfer',
    deleteContent:
      'Deleting this cross-docking transfer will also remove its generated stock movements.',
    createdToast: 'Cross-docking transfer created successfully.',
    updatedToast: 'Cross-docking transfer updated successfully.',
    deletedToast: 'Cross-docking transfer deleted successfully.',
    deleteError: 'Failed to delete the selected cross-docking transfer.',
    detailLoadError: 'Failed to load the selected cross-docking transfer. Please try again.',
    detailHeadingFallback: 'Cross-Docking Details',
    detailDescription:
      'Review the cross-docking route, logistics ownership, and the line items moved through the dock.',
    backToListLabel: 'Back to Cross-Docking',
    createLabel: 'Create Cross-Docking Transfer',
    editLabel: 'Edit',
    deleteLabel: 'Delete',
    lineItemsTitle: 'Cross-Docking Line Items',
    lineItemsDescription: 'Quantities and valuation posted for this cross-docking movement.',
    noLineItemsDescription: 'No line items were attached to this cross-docking transfer.',
    listEndpoint: EP.cross_docking,
    detailEndpoint: EP.cross_docking_by_id,
    listPath: paths.dashboard.storeInventory.crossDocking,
    detailPath: paths.dashboard.storeInventory.crossDocking_detail,
    paramKeys: ['crossDockingId', 'transferId'],
  },
};

export function getStockTransferModuleConfig(moduleKey = 'stockTransfer') {
  return STOCK_TRANSFER_MODULE_CONFIGS[moduleKey] || STOCK_TRANSFER_MODULE_CONFIGS.stockTransfer;
}
