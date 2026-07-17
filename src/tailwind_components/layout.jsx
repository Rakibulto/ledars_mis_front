import * as ReactRouter from 'react-router';

import { Topbar } from './topbar';
import { Sidebar } from './sidebar';

const Outlet = ReactRouter.Outlet || ReactRouter.default?.Outlet;
const useLocation = ReactRouter.useLocation || ReactRouter.default?.useLocation;
const pageTitles = {
  '/': { title: 'Dashboard', breadcrumbs: ['Home', 'Dashboard'] },
  '/dashboard': { title: 'Dashboard', breadcrumbs: ['Home', 'Dashboard'] },
  '/sitemap': { title: 'System Architecture', breadcrumbs: ['Home', 'System Architecture'] },
  '/requisitions': {
    title: 'Material Requisitions',
    breadcrumbs: ['Home', 'Material Requisitions'],
  },
  '/requisitions/list': {
    title: 'Requisition List',
    breadcrumbs: ['Home', 'Material Requisitions', 'List'],
  },
  '/requisitions/create': {
    title: 'Create Requisition',
    breadcrumbs: ['Home', 'Material Requisitions', 'Create'],
  },
  '/rfq': { title: 'RFQ Management', breadcrumbs: ['Home', 'RFQ Management'] },
  '/rfq/list': { title: 'RFQ List', breadcrumbs: ['Home', 'RFQ Management', 'List'] },
  '/rfq/create': { title: 'Create RFQ', breadcrumbs: ['Home', 'RFQ Management', 'Create'] },
  '/rfq/distribution': {
    title: 'Vendor Distribution',
    breadcrumbs: ['Home', 'RFQ Management', 'Distribution'],
  },
  '/rfq/monitoring': {
    title: 'Submission Monitoring',
    breadcrumbs: ['Home', 'RFQ Management', 'Monitoring'],
  },
  '/quotations': { title: 'Quotations', breadcrumbs: ['Home', 'Quotations'] },
  '/comparative': {
    title: 'Comparative Statements',
    breadcrumbs: ['Home', 'Comparative Statements'],
  },
  '/awards': { title: 'Awards', breadcrumbs: ['Home', 'Awards'] },
  '/work-orders': { title: 'Work Orders', breadcrumbs: ['Home', 'Work Orders'] },
  '/grn': { title: 'Goods Receive Notes', breadcrumbs: ['Home', 'Goods Receive Notes'] },
  '/inventory': { title: 'Inventory', breadcrumbs: ['Home', 'Inventory'] },
  '/payment-requisitions': {
    title: 'Payment Requisitions',
    breadcrumbs: ['Home', 'Payment Requisitions'],
  },
  '/treasury': { title: 'Treasury Tracking', breadcrumbs: ['Home', 'Treasury Tracking'] },
  '/vendors': { title: 'Vendors', breadcrumbs: ['Home', 'Vendors'] },
  '/vendors/list': { title: 'Vendor Directory', breadcrumbs: ['Home', 'Vendors', 'Directory'] },
  '/vendors/create': { title: 'Add New Vendor', breadcrumbs: ['Home', 'Vendors', 'Add New'] },
  '/vendors/categories': {
    title: 'Vendor Categories',
    breadcrumbs: ['Home', 'Vendors', 'Categories'],
  },
  '/vendors/performance': {
    title: 'Performance Tracking',
    breadcrumbs: ['Home', 'Vendors', 'Performance'],
  },
  '/vendors/evaluation': {
    title: 'Vendor Evaluation',
    breadcrumbs: ['Home', 'Vendors', 'Evaluation'],
  },
  '/reports': { title: 'Reports', breadcrumbs: ['Home', 'Reports'] },
  '/notifications': { title: 'Notifications', breadcrumbs: ['Home', 'Notifications'] },
  '/settings': { title: 'Settings', breadcrumbs: ['Home', 'Settings'] },
};
export function Layout() {
  const location = useLocation();
  // Handle dynamic routes
  let pageInfo = pageTitles[location.pathname];
  if (!pageInfo) {
    // Check for dynamic requisition detail routes
    if (location.pathname.match(/^\/requisitions\/REQ-\d{4}-\d{3}$/)) {
      const reqId = location.pathname.split('/').pop();
      pageInfo = {
        title: `Requisition ${reqId}`,
        breadcrumbs: ['Home', 'Material Requisitions', 'Detail'],
      };
    } else if (location.pathname.match(/^\/requisitions\/REQ-\d{4}-\d{3}\/timeline$/)) {
      const reqId = location.pathname.split('/')[2];
      pageInfo = {
        title: `Timeline - ${reqId}`,
        breadcrumbs: ['Home', 'Material Requisitions', 'Timeline'],
      };
    } else if (location.pathname.match(/^\/rfq\/RFQ-\d{4}-\d{3}$/)) {
      const rfqId = location.pathname.split('/').pop();
      pageInfo = {
        title: `RFQ ${rfqId}`,
        breadcrumbs: ['Home', 'RFQ Management', 'Detail'],
      };
    } else {
      pageInfo = { title: 'Dashboard', breadcrumbs: ['Home'] };
    }
  }
  return (
    <div className="size-full flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={pageInfo.title} breadcrumbs={pageInfo.breadcrumbs} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
