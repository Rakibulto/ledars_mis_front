import {
  Bell,
  User,
  Award,
  Users,
  Upload,
  Shield,
  Package,
  FileText,
  Settings,
  FileCheck,
  BarChart3,
  Warehouse,
  Building2,
  ArrowDown,
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  ClipboardList,
  LayoutDashboard,
  FileSpreadsheet,
} from 'lucide-react';

import { Badge } from './ui/badge';
import { Card, CardBody, CardHeader } from './ui/card';
export function SitemapIA() {
  const internalPortalMenu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'KPIs, approvals, activity',
      subModules: ['Overview', 'Pending Actions', 'Recent Activity'],
    },
    {
      id: 'material-req',
      label: 'Material Requisitions',
      icon: FileText,
      description: 'Request materials & services',
      subModules: ['Create New', 'My Requests', 'Approvals', 'History'],
    },
    {
      id: 'rfq',
      label: 'RFQ Management',
      icon: MessageSquare,
      description: 'Request for quotations',
      subModules: ['Create RFQ', 'Active RFQs', 'Responses', 'Closed'],
    },
    {
      id: 'quotations',
      label: 'Quotations',
      icon: FileCheck,
      description: 'Vendor quotations received',
      subModules: ['All Quotations', 'Under Review', 'Accepted', 'Rejected'],
    },
    {
      id: 'comparative',
      label: 'Comparative Statements',
      icon: BarChart3,
      description: 'Compare vendor quotes',
      subModules: ['Create Statement', 'Active', 'Approved'],
    },
    {
      id: 'awards',
      label: 'Awards',
      icon: Award,
      description: 'Contract awards',
      subModules: ['Pending Awards', 'Issued', 'History'],
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      icon: ClipboardList,
      description: 'Purchase orders',
      subModules: ['Create PO', 'Active POs', 'Delivered', 'Closed'],
    },
    {
      id: 'grn',
      label: 'Goods Receive Notes',
      icon: Package,
      description: 'Receive & verify goods',
      subModules: ['Pending Receipt', 'Received', 'Verified'],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Warehouse,
      description: 'Stock management',
      subModules: ['Stock Levels', 'Movements', 'Alerts', 'Reports'],
    },
    {
      id: 'payment-req',
      label: 'Payment Requisitions',
      icon: DollarSign,
      description: 'Request payments',
      subModules: ['Create Request', 'Pending', 'Approved', 'Paid'],
    },
    {
      id: 'treasury',
      label: 'Treasury Tracking',
      icon: Building2,
      description: 'Financial tracking',
      subModules: ['Payments Queue', 'Scheduled', 'Completed', 'Reports'],
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Users,
      description: 'Vendor management',
      subModules: ['All Vendors', 'Registration', 'Performance', 'Blacklist'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileSpreadsheet,
      description: 'Analytics & reports',
      subModules: ['Procurement', 'Financial', 'Inventory', 'Vendor', 'Custom'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts & updates',
      subModules: ['All Notifications', 'Unread', 'Settings'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System configuration',
      subModules: ['Users', 'Roles', 'Workflows', 'Preferences', 'Integrations'],
    },
  ];
  const vendorPortalMenu = [
    {
      id: 'vendor-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
      subModules: ['Performance', 'Active Orders', 'Payments'],
    },
    {
      id: 'vendor-profile',
      label: 'Profile',
      icon: User,
      description: 'Company information',
      subModules: ['Company Details', 'Bank Info', 'Certifications'],
    },
    {
      id: 'vendor-docs',
      label: 'Documents',
      icon: FileText,
      description: 'Required documents',
      subModules: ['Upload Documents', 'Compliance', 'Verification'],
    },
    {
      id: 'vendor-rfqs',
      label: 'RFQs',
      icon: MessageSquare,
      description: 'Request for quotations',
      subModules: ['Open RFQs', 'In Progress', 'Submitted', 'Closed'],
    },
    {
      id: 'vendor-quotations',
      label: 'Submitted Quotations',
      icon: Upload,
      description: 'Your quotations',
      subModules: ['All Quotes', 'Under Review', 'Accepted', 'Rejected'],
    },
    {
      id: 'vendor-awards',
      label: 'Awards',
      icon: Award,
      description: 'Contracts awarded',
      subModules: ['Active Awards', 'History'],
    },
    {
      id: 'vendor-po',
      label: 'Work Orders',
      icon: ClipboardList,
      description: 'Purchase orders',
      subModules: ['Active POs', 'In Delivery', 'Completed'],
    },
    {
      id: 'vendor-delivery',
      label: 'Delivery Documents',
      icon: Package,
      description: 'Delivery notes',
      subModules: ['Upload DN', 'Pending', 'Verified'],
    },
    {
      id: 'vendor-payments',
      label: 'Payment Status',
      icon: DollarSign,
      description: 'Payment tracking',
      subModules: ['Pending Payments', 'Scheduled', 'Received'],
    },
    {
      id: 'vendor-notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts & messages',
      subModules: ['Unread', 'All', 'Settings'],
    },
    {
      id: 'vendor-settings',
      label: 'Account Settings',
      icon: Settings,
      description: 'Account preferences',
      subModules: ['Profile', 'Security', 'Notifications'],
    },
  ];
  const roles = [
    {
      id: 'requester',
      name: 'Requester',
      description: 'Creates material requisitions',
      access: ['Dashboard', 'Material Req (Create/View Own)', 'Notifications'],
    },
    {
      id: 'finance-checker',
      name: 'Finance Checker',
      description: 'Reviews budget availability',
      access: ['Dashboard', 'Material Req (Approve)', 'Payment Req (Review)', 'Reports'],
    },
    {
      id: 'budget-holder',
      name: 'Budget Holder',
      description: 'Approves budget allocation',
      access: ['Dashboard', 'Material Req (Approve)', 'Payment Req (Approve)', 'Reports'],
    },
    {
      id: 'procurement-admin',
      name: 'Procurement Admin',
      description: 'Manages procurement process',
      access: ['All Procurement Modules', 'Vendors', 'RFQ', 'Quotations', 'Comparative', 'Awards'],
    },
    {
      id: 'approver',
      name: 'Approver',
      description: 'Final approval authority',
      access: ['Dashboard', 'Approvals (All)', 'Reports'],
    },
    {
      id: 'inventory-officer',
      name: 'Inventory Officer',
      description: 'Manages inventory & GRN',
      access: ['Dashboard', 'GRN', 'Inventory', 'Work Orders (View)'],
    },
    {
      id: 'treasury-officer',
      name: 'Treasury Officer',
      description: 'Processes payments',
      access: ['Dashboard', 'Payment Req', 'Treasury', 'Reports (Financial)'],
    },
    {
      id: 'vendor',
      name: 'Vendor',
      description: 'External supplier',
      access: ['Vendor Portal Only'],
    },
    {
      id: 'system-admin',
      name: 'System Admin',
      description: 'System configuration',
      access: ['Full Access', 'Settings', 'User Management', 'System Config'],
    },
  ];
  const procurementFlow = [
    { step: 1, name: 'Material Requisition', icon: FileText },
    { step: 2, name: 'RFQ Creation', icon: MessageSquare },
    { step: 3, name: 'Vendor Quotations', icon: FileCheck },
    { step: 4, name: 'Comparative Statement', icon: BarChart3 },
    { step: 5, name: 'Award', icon: Award },
    { step: 6, name: 'Work Order/PO', icon: ClipboardList },
    { step: 7, name: 'Goods Receipt', icon: Package },
    { step: 8, name: 'Payment', icon: DollarSign },
  ];
  return (
    <div className="p-8 space-y-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground mb-3">
          System Information Architecture & Sitemap
        </h1>
        <p className="text-base text-muted-foreground max-w-3xl mx-auto">
          Complete system structure showing internal portal, vendor portal, procurement workflow,
          and role-based access control
        </p>
      </div>

      {/* Procurement Process Flow */}
      <Card>
        <CardHeader
          title="End-to-End Procurement Workflow"
          description="Complete procurement lifecycle from requisition to payment"
        />
        <CardBody>
          <div className="flex items-center justify-between">
            {procurementFlow.map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-2">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-primary mb-1">Step {item.step}</div>
                    <div className="text-xs font-medium text-foreground max-w-[90px]">
                      {item.name}
                    </div>
                  </div>
                </div>
                {index < procurementFlow.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground mx-3" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Portal Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Internal Portal */}
        <Card className="border-2 border-primary">
          <CardHeader
            title="Internal Portal"
            description="For organization staff members"
            action={<Badge variant="primary">15 Modules</Badge>}
          />
          <CardBody>
            <div className="space-y-3">
              {internalPortalMenu.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground mb-0.5">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                      {item.subModules && (
                        <div className="flex flex-wrap gap-1">
                          {item.subModules.map((sub, idx) => (
                            <Badge key={idx} variant="outline" size="sm">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Vendor Portal */}
        <Card className="border-2 border-success">
          <CardHeader
            title="Vendor Portal"
            description="For registered suppliers and vendors"
            action={<Badge variant="success">11 Modules</Badge>}
          />
          <CardBody>
            <div className="space-y-3">
              {vendorPortalMenu.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-success/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground mb-0.5">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{item.description}</p>
                      {item.subModules && (
                        <div className="flex flex-wrap gap-1">
                          {item.subModules.map((sub, idx) => (
                            <Badge key={idx} variant="outline" size="sm">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Role-Based Access Control Matrix */}
      <Card>
        <CardHeader
          title="Role-Based Access Control (RBAC)"
          description="User roles and their respective permissions across the system"
          action={<Badge variant="info">9 Roles</Badge>}
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase w-[200px]">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">
                    Key Access Rights
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase w-[100px]">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {role.access.map((access, idx) => (
                          <Badge key={idx} variant="outline" size="sm">
                            {access}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {role.id === 'vendor' ? (
                        <Badge variant="success" size="sm">
                          External
                        </Badge>
                      ) : (
                        <Badge variant="primary" size="sm">
                          Internal
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* System Architecture Overview */}
      <Card>
        <CardHeader
          title="System Architecture"
          description="High-level system components and integrations"
        />
        <CardBody>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-full h-32 rounded-lg bg-primary/10 border-2 border-primary flex items-center justify-center mb-3">
                <div>
                  <LayoutDashboard className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-primary">Internal Portal</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Web-based application for staff members with role-based dashboards
              </p>
            </div>

            <div className="text-center">
              <div className="w-full h-32 rounded-lg bg-success/10 border-2 border-success flex items-center justify-center mb-3">
                <div>
                  <Users className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="text-sm font-semibold text-success">Vendor Portal</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Self-service portal for vendors to manage RFQs, quotations, and orders
              </p>
            </div>

            <div className="text-center">
              <div className="w-full h-32 rounded-lg bg-info/10 border-2 border-info flex items-center justify-center mb-3">
                <div>
                  <Settings className="w-12 h-12 text-info mx-auto mb-2" />
                  <p className="text-sm font-semibold text-info">Admin Console</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                System configuration, user management, and workflow customization
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Key Features Across System
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: CheckCircle, label: 'Multi-level Approvals' },
                { icon: FileSpreadsheet, label: 'Advanced Reporting' },
                { icon: Bell, label: 'Real-time Notifications' },
                { icon: TrendingUp, label: 'Analytics Dashboard' },
                { icon: Shield, label: 'Audit Trail' },
                { icon: Upload, label: 'Document Management' },
                { icon: Award, label: 'Vendor Performance' },
                { icon: DollarSign, label: 'Financial Tracking' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Module Dependencies */}
      <Card>
        <CardHeader
          title="Module Dependencies & Data Flow"
          description="How modules interact and share data"
        />
        <CardBody>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Material Requisition</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">RFQ Creation</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-success/10 border border-success rounded-lg text-center">
                  <FileCheck className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-xs font-semibold">Vendor Quotations</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Comparative Analysis</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowDown className="w-6 h-6 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Award Decision</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <ClipboardList className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Work Order/PO</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">GRN & Inventory</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
              <div className="flex-1 max-w-[180px]">
                <div className="p-4 bg-primary/10 border border-primary rounded-lg text-center">
                  <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold">Payment Processing</p>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
