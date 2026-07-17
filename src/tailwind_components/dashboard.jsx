import { Link } from 'react-router';
import {
  Clock,
  Shield,
  Package,
  FileText,
  FileCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

import { StatCard } from './stat-card';
import { StatusBadge } from './status-badge';

export function Dashboard() {
  const kpiData = [
    { title: 'Pending Requisitions', value: '24', icon: FileText, color: 'blue' },
    { title: 'Awaiting My Approval', value: '8', icon: CheckCircle, color: 'orange' },
    { title: 'Open RFQs', value: '12', icon: MessageSquare, color: 'purple' },
    { title: 'Quotations Received', value: '45', icon: FileCheck, color: 'green' },
    { title: 'Pending Work Orders', value: '6', icon: ClipboardList, color: 'blue' },
    { title: 'Pending GRNs', value: '9', icon: Package, color: 'orange' },
    { title: 'Pending Payments', value: '15', icon: CreditCard, color: 'red' },
    { title: 'Budget Utilization', value: '68%', icon: TrendingUp, color: 'green' },
  ];
  const approvalQueue = [
    {
      id: 'REQ-2024-001',
      type: 'Material Requisition',
      requester: 'Sarah Wilson',
      department: 'Operations',
      amount: '$12,450',
      status: 'pending',
      date: '2024-03-10',
    },
    {
      id: 'PRF-2024-089',
      type: 'Payment Requisition',
      requester: 'Michael Chen',
      department: 'Finance',
      amount: '$8,900',
      status: 'pending',
      date: '2024-03-11',
    },
    {
      id: 'CS-2024-034',
      type: 'Comparative Statement',
      requester: 'Emily Davis',
      department: 'Procurement',
      amount: '$24,500',
      status: 'pending',
      date: '2024-03-12',
    },
    {
      id: 'WO-2024-112',
      type: 'Work Order',
      requester: 'James Brown',
      department: 'Operations',
      amount: '$15,200',
      status: 'pending',
      date: '2024-03-12',
    },
  ];
  const recentActivity = [
    {
      action: 'New RFQ Created',
      details: 'RFQ-2024-056 for Office Supplies',
      user: 'Admin',
      time: '10 min ago',
    },
    {
      action: 'Payment Processed',
      details: 'PRF-2024-088 paid to Vendor ABC Ltd',
      user: 'Treasury',
      time: '1 hour ago',
    },
    {
      action: 'GRN Submitted',
      details: 'GRN-2024-234 for Work Order WO-2024-109',
      user: 'Warehouse',
      time: '2 hours ago',
    },
    {
      action: 'Requisition Approved',
      details: 'REQ-2024-098 approved by Budget Holder',
      user: 'Finance',
      time: '3 hours ago',
    },
  ];
  const inventoryAlerts = [
    { item: 'Printer Paper A4', level: 'Low Stock', quantity: '150 reams', status: 'warning' },
    { item: 'Toner Cartridge HP 305A', level: 'Critical', quantity: '5 units', status: 'overdue' },
    { item: 'Network Cables Cat6', level: 'Low Stock', quantity: '25 units', status: 'warning' },
  ];
  return (
    <div className="p-6 space-y-6">
      {/* Quick Links Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Authentication Screens</h3>
                <p className="text-sm text-muted-foreground">View all authentication screens</p>
              </div>
            </div>
            <Link to="/auth-demo">
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                View Screens
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Material Requisitions</h3>
                <p className="text-sm text-muted-foreground">Complete requisition module</p>
              </div>
            </div>
            <Link to="/requisitions/list">
              <button className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors text-sm font-medium">
                View Module
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, John. Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <StatCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Approval Queue */}
        <div className="col-span-2 bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Approval Queue
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-foreground">{item.id}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{item.requester}</span>
                      <span>•</span>
                      <span>{item.department}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="font-semibold text-foreground">{item.amount}</p>
                    </div>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Inventory Alerts */}
        <div className="col-span-1 bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Inventory Alerts
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {inventoryAlerts.map((alert, index) => (
                <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{alert.item}</p>
                    <StatusBadge status={alert.status}>{alert.level}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.quantity} remaining</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-2 bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">New Requisition</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Create RFQ</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Add GRN</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <ClipboardList className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">New Work Order</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Payment Request</p>
              </button>
              <button className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">View Reports</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
