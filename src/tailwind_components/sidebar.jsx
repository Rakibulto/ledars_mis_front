import { useState } from 'react';
import * as ReactRouter from 'react-router';
import {
  Eye,
  Box,
  Ban,
  Bell,
  List,
  Send,
  Mail,
  Hash,
  Grid,
  Lock,
  Award,
  Boxes,
  Users,
  Globe,
  Wallet,
  Shield,
  LogOut,
  Package,
  History,
  FileText,
  Settings,
  UserPlus,
  Calendar,
  PieChart,
  Activity,
  FileCheck,
  Clipboard,
  BarChart3,
  Building2,
  BarChart2,
  GitBranch,
  Warehouse,
  HardDrive,
  PlusCircle,
  TrendingUp,
  DollarSign,
  ScrollText,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  FileSignature,
  AlertTriangle,
  ArrowLeftRight,
  LayoutDashboard,
} from 'lucide-react';

import { useAuth } from '../contexts/auth-context';

const Link = ReactRouter.Link || ReactRouter.default?.Link;
const useLocation = ReactRouter.useLocation || ReactRouter.default?.useLocation;
const useNavigate = ReactRouter.useNavigate || ReactRouter.default?.useNavigate;
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    id: 'requisitions',
    label: 'Material Requisitions',
    icon: FileText,
    subItems: [
      { id: 'req-list', label: 'Requisition List', path: '/requisitions/list', icon: List },
      {
        id: 'req-create',
        label: 'Create Requisition',
        path: '/requisitions/create',
        icon: PlusCircle,
      },
      {
        id: 'req-workflow',
        label: 'Workflow Approval',
        path: '/requisitions/workflow-approval',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'rfq',
    label: 'RFQ Management',
    icon: MessageSquare,
    subItems: [
      { id: 'rfq-list', label: 'RFQ List', path: '/rfq/list', icon: List },
      { id: 'rfq-create', label: 'Create RFQ', path: '/rfq/create', icon: PlusCircle },
      {
        id: 'rfq-distribution',
        label: 'Vendor Distribution',
        path: '/rfq/distribution',
        icon: Send,
      },
      {
        id: 'rfq-monitoring',
        label: 'Submission Monitoring',
        path: '/rfq/monitoring',
        icon: BarChart2,
      },
    ],
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: FileCheck,
    subItems: [
      { id: 'quotation-list', label: 'Quotation Dashboard', path: '/quotations/list', icon: List },
      {
        id: 'quotation-opening',
        label: 'Opening & Evaluation',
        path: '/quotations/list',
        icon: Eye,
      },
    ],
  },
  {
    id: 'comparative',
    label: 'Comparative Statements',
    icon: BarChart3,
    subItems: [
      { id: 'cs-list', label: 'CS List', path: '/comparative/list', icon: List },
      {
        id: 'cs-approval',
        label: 'Pending Approvals',
        path: '/comparative/list',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'awards',
    label: 'Awards',
    icon: Award,
    subItems: [
      { id: 'award-summary', label: 'Award Summary', path: '/awards/summary', icon: List },
      { id: 'award-notifications', label: 'Notifications', path: '/awards/summary', icon: Mail },
      { id: 'award-history', label: 'Award History', path: '/awards/history', icon: History },
    ],
  },
  {
    id: 'work-orders',
    label: 'Work Orders',
    icon: Clipboard,
    subItems: [
      { id: 'wo-list', label: 'WO List', path: '/work-orders/list', icon: List },
      { id: 'wo-create', label: 'Create WO', path: '/work-orders/create', icon: PlusCircle },
      {
        id: 'wo-approval',
        label: 'Pending Approvals',
        path: '/work-orders/list',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'grn',
    label: 'Goods Receive Notes',
    icon: Package,
    subItems: [
      { id: 'grn-list', label: 'GRN List', path: '/grn/list', icon: List },
      { id: 'grn-create', label: 'Create GRN', path: '/grn/create', icon: PlusCircle },
      {
        id: 'grn-verification',
        label: 'Pending Verification',
        path: '/grn/pending',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    subItems: [
      {
        id: 'inventory-dashboard',
        label: 'Dashboard',
        path: '/inventory/dashboard',
        icon: LayoutDashboard,
      },
      { id: 'inventory-items', label: 'All Items', path: '/inventory/items', icon: List },
      {
        id: 'inventory-assets',
        label: 'Fixed Assets',
        path: '/inventory/items?type=asset',
        icon: Box,
      },
      {
        id: 'inventory-consumables',
        label: 'Consumables',
        path: '/inventory/items?type=consumable',
        icon: Package,
      },
      {
        id: 'stock-movement',
        label: 'Stock Movement',
        path: '/inventory/movement',
        icon: ArrowLeftRight,
      },
      { id: 'stock-issue', label: 'Issue/Transfer', path: '/inventory/issue', icon: Send },
      {
        id: 'inventory-warehouses',
        label: 'Warehouses',
        path: '/inventory/warehouses',
        icon: Warehouse,
      },
      {
        id: 'inventory-transfer',
        label: 'Inter-Warehouse Transfer',
        path: '/inventory/inter-warehouse-transfer',
        icon: ArrowLeftRight,
      },
      {
        id: 'material-requisition',
        label: 'Material Requisition',
        path: '/inventory/material-requisition',
        icon: FileText,
      },
      {
        id: 'material-release',
        label: 'Material Release',
        path: '/inventory/material-release',
        icon: FileSignature,
      },
      {
        id: 'inventory-reports',
        label: 'Inventory Reports',
        path: '/inventory/reports',
        icon: BarChart2,
      },
    ],
  },
  {
    id: 'payment-requisitions',
    label: 'Payment Requisitions',
    icon: DollarSign,
    subItems: [
      {
        id: 'prf-list',
        label: 'PRF List',
        path: '/payment-requisitions/list?status=Approved',
        icon: List,
      },
      {
        id: 'prf-create',
        label: 'Create PRF',
        path: '/payment-requisitions/create',
        icon: PlusCircle,
      },
      {
        id: 'prf-approval',
        label: 'Pending Approvals',
        path: '/payment-requisitions/list?status=Pending%20Approval',
        icon: CheckCircle2,
      },
      {
        id: 'payment-schedule',
        label: 'Payment Schedule',
        path: '/payment-requisitions/list?view=schedule',
        icon: Calendar,
      },
    ],
  },
  {
    id: 'treasury-tracking',
    label: 'Treasury & Finance',
    icon: Wallet,
    subItems: [
      {
        id: 'finance-review',
        label: 'Finance Review Queue',
        path: '/treasury/finance-review',
        icon: FileText,
      },
      {
        id: 'treasury-processing',
        label: 'Treasury Processing',
        path: '/treasury/processing',
        icon: DollarSign,
      },
      {
        id: 'payment-timeline',
        label: 'Payment Status',
        path: '/treasury/timeline',
        icon: TrendingUp,
      },
      {
        id: 'payment-analytics',
        label: 'Payment Analytics',
        path: '/treasury/analytics',
        icon: BarChart3,
      },
      {
        id: 'bank-reconciliation',
        label: 'Bank Reconciliation',
        path: '/treasury/bank-reconciliation',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'vendors',
    label: 'Vendors',
    icon: Users,
    subItems: [
      { id: 'vendor-list', label: 'Vendor List', path: '/vendors/list', icon: List },
      {
        id: 'vendor-onboarding',
        label: 'Vendor Onboarding',
        path: '/vendors/onboarding',
        icon: UserPlus,
      },
      {
        id: 'vendor-verification',
        label: 'Vendor Verification',
        path: '/vendors/verification',
        icon: CheckCircle2,
      },
      {
        id: 'vendor-categories',
        label: 'Category Mapping',
        path: '/vendors/categories',
        icon: Grid,
      },
      {
        id: 'vendor-performance',
        label: 'Performance Tracking',
        path: '/vendors/performance',
        icon: TrendingUp,
      },
      {
        id: 'vendor-enlistment',
        label: 'Vendor Enlistment',
        path: '/vendors/enlistment',
        icon: UserPlus,
      },
      { id: 'vendor-blacklist', label: 'Vendor Blacklist', path: '/vendors/blacklist', icon: Ban },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    subItems: [
      {
        id: 'requisition-report',
        label: 'Requisition Report',
        path: '/reports/requisitions',
        icon: FileText,
      },
      { id: 'rfq-report', label: 'RFQ Report', path: '/reports/rfq', icon: MessageSquare },
      {
        id: 'vendor-participation',
        label: 'Vendor Participation',
        path: '/reports/vendor-participation',
        icon: Users,
      },
      { id: 'vendor-award', label: 'Vendor Awards', path: '/reports/vendor-awards', icon: Award },
      {
        id: 'work-order-report',
        label: 'Work Order Report',
        path: '/reports/work-orders',
        icon: Clipboard,
      },
      {
        id: 'inventory-received',
        label: 'Inventory Received',
        path: '/reports/inventory-received',
        icon: Package,
      },
      {
        id: 'fixed-asset-register',
        label: 'Fixed Asset Register',
        path: '/reports/fixed-assets',
        icon: Box,
      },
      {
        id: 'consumable-stock',
        label: 'Consumable Stock',
        path: '/reports/consumables',
        icon: Boxes,
      },
      {
        id: 'payment-status',
        label: 'Payment Status',
        path: '/reports/payments',
        icon: DollarSign,
      },
      {
        id: 'budget-utilization',
        label: 'Budget vs Procurement',
        path: '/reports/budget',
        icon: TrendingUp,
      },
      {
        id: 'cs-summary',
        label: 'CS Summary',
        path: '/reports/comparative-statements',
        icon: FileText,
      },
      { id: 'audit-logs-report', label: 'Audit Logs', path: '/reports/audit-logs', icon: Shield },
      {
        id: 'project-procurement',
        label: 'Project Procurement',
        path: '/reports/project-procurement',
        icon: FolderOpen,
      },
    ],
  },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  {
    id: 'audit',
    label: 'Audit & Compliance',
    icon: ScrollText,
    subItems: [
      { id: 'audit-log', label: 'Audit Trail', path: '/audit/log', icon: List },
      {
        id: 'audit-compliance',
        label: 'Compliance Dashboard',
        path: '/audit/compliance',
        icon: Shield,
      },
      { id: 'audit-export', label: 'Export & Reports', path: '/audit/export', icon: BarChart3 },
    ],
  },
  {
    id: 'documents',
    label: 'Document Repository',
    icon: FolderOpen,
    subItems: [
      { id: 'doc-repository', label: 'All Documents', path: '/documents/repository', icon: List },
      { id: 'doc-categories', label: 'Categories', path: '/documents/categories', icon: Grid },
      { id: 'doc-access', label: 'Access Control', path: '/documents/access-control', icon: Lock },
    ],
  },
  {
    id: 'contracts',
    label: 'Contract Management',
    icon: FileSignature,
    subItems: [
      { id: 'contract-list', label: 'Contract List', path: '/contracts/list', icon: List },
      {
        id: 'contract-create',
        label: 'Create Contract',
        path: '/contracts/create',
        icon: PlusCircle,
      },
    ],
  },
  {
    id: 'budget',
    label: 'Budget Management',
    icon: PieChart,
    subItems: [
      {
        id: 'budget-planning',
        label: 'Budget Planning',
        path: '/budget/planning',
        icon: LayoutDashboard,
      },
      {
        id: 'budget-utilization',
        label: 'Utilization Report',
        path: '/budget/utilization',
        icon: BarChart3,
      },
      {
        id: 'budget-transfer',
        label: 'Budget Transfer',
        path: '/budget/transfer',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    subItems: [
      { id: 'user-management', label: 'User Management', path: '/settings/users', icon: Users },
      {
        id: 'roles-permissions',
        label: 'Roles & Permissions',
        path: '/settings/roles',
        icon: Shield,
      },
      {
        id: 'approval-matrix',
        label: 'Approval Matrix',
        path: '/settings/approval-matrix',
        icon: GitBranch,
      },
      {
        id: 'budget-codes',
        label: 'Budget Codes',
        path: '/settings/budget-codes',
        icon: DollarSign,
      },
      { id: 'account-codes', label: 'Account Codes', path: '/settings/account-codes', icon: Hash },
      { id: 'categories', label: 'Category Setup', path: '/settings/categories', icon: Grid },
      { id: 'item-master', label: 'Item Master', path: '/settings/items', icon: Package },
      {
        id: 'email-templates',
        label: 'Email Templates',
        path: '/settings/email-templates',
        icon: Mail,
      },
      {
        id: 'notifications-settings',
        label: 'Notification Settings',
        path: '/settings/notifications',
        icon: Bell,
      },
      { id: 'offices', label: 'Office Management', path: '/settings/offices', icon: Building2 },
      {
        id: 'delegation',
        label: 'Authority Delegation',
        path: '/settings/delegation',
        icon: Users,
      },
      {
        id: 'escalation',
        label: 'Escalation Rules',
        path: '/settings/escalation',
        icon: AlertTriangle,
      },
      { id: 'fiscal-year', label: 'Fiscal Year', path: '/settings/fiscal-year', icon: Calendar },
      { id: 'currency', label: 'Currency & Rates', path: '/settings/currency', icon: Globe },
      { id: 'system-logs', label: 'System Logs', path: '/settings/system-logs', icon: Activity },
      { id: 'backup', label: 'Backup & Recovery', path: '/settings/backup', icon: HardDrive },
    ],
  },
];
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState(['requisitions']);
  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };
  const isPathActive = (path) => {
    const [targetPath, targetQuery = ''] = path.split('?');

    if (
      location.pathname !== targetPath &&
      !(location.pathname === '/' && targetPath === '/dashboard')
    ) {
      return false;
    }

    if (!targetQuery) {
      return true;
    }

    const requiredParams = new URLSearchParams(targetQuery);
    const currentParams = new URLSearchParams(location.search || '');

    for (const [key, value] of requiredParams.entries()) {
      if ((currentParams.get(key) || '') !== value) {
        return false;
      }
    }

    return true;
  };
  const isParentActive = (item) => {
    if (item.path && isPathActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some((subItem) => location.pathname.startsWith(subItem.path));
    }
    return false;
  };
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-semibold text-primary">ProcureMax</h1>
        <p className="text-xs text-muted-foreground mt-1">Procurement Management</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const isActive = isParentActive(item);
            return (
              <li key={item.id}>
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = isPathActive(subItem.path);
                          return (
                            <li key={subItem.id}>
                              <Link
                                to={subItem.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isSubActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
            {user?.avatar || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.designation || 'Procurement Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/auth/internal-login');
          }}
          className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
