'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Clock,
  Shield,
  Package,
  FileText,
  FileCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { StatCard } from './stat-card';
import { StatusBadge } from './status-badge';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatRelativeTime(value) {
  if (!value) {
    return 'Just now';
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return 'Just now';
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));
  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function Dashboard() {
  const { data: dashboardData } = useGetRequest(
    endpoints.procurement_management.procurement_dashboard
  );

  const kpiData = useMemo(
    () => [
      {
        title: 'Pending Requisitions',
        value: dashboardData?.requisitions?.pending ?? 0,
        icon: FileText,
        color: 'blue',
      },
      {
        title: 'Awaiting My Approval',
        value: dashboardData?.pending_approvals ?? 0,
        icon: CheckCircle,
        color: 'orange',
      },
      {
        title: 'Open RFQs',
        value: dashboardData?.rfq?.open ?? 0,
        icon: MessageSquare,
        color: 'purple',
      },
      {
        title: 'Quotations Received',
        value: dashboardData?.quotations?.submitted ?? 0,
        icon: FileCheck,
        color: 'green',
      },
      {
        title: 'Pending Work Orders',
        value: dashboardData?.active_work_orders ?? 0,
        icon: ClipboardList,
        color: 'blue',
      },
      {
        title: 'Pending GRNs',
        value: dashboardData?.grn?.pending_verification ?? 0,
        icon: Package,
        color: 'orange',
      },
      {
        title: 'Pending Payments',
        value: dashboardData?.payments?.pending ?? 0,
        icon: CreditCard,
        color: 'red',
      },
      {
        title: 'Active Vendors',
        value: dashboardData?.suppliers?.active ?? 0,
        icon: TrendingUp,
        color: 'green',
      },
    ],
    [dashboardData]
  );

  const approvalQueue = useMemo(() => [], []);

  const recentActivity = useMemo(
    () =>
      (dashboardData?.recent_activities || []).map((activity) => ({
        action: activity.action
          ? activity.action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
          : 'Activity',
        details: activity.description || 'No details available.',
        user: 'System',
        time: formatRelativeTime(activity.created_at || activity.timestamp),
      })),
    [dashboardData]
  );

  const inventoryAlerts = useMemo(() => [], []);

  const quickActions = [
    {
      title: 'New Requisition',
      href: paths.dashboard.procurement.requisitions.create,
      icon: FileText,
    },
    {
      title: 'Create RFQ',
      href: paths.dashboard.procurement.rfq.create,
      icon: MessageSquare,
    },
    {
      title: 'Add GRN',
      href: paths.dashboard.procurement.grn.create,
      icon: Package,
    },
    {
      title: 'New Work Order',
      href: paths.dashboard.procurement.workOrders.create,
      icon: ClipboardList,
    },
    {
      title: 'Payment Request',
      href: paths.dashboard.procurement.paymentRequisitions.create,
      icon: CreditCard,
    },
    {
      title: 'View Reports',
      href: paths.dashboard.procurement.reports.root,
      icon: DollarSign,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Quick Links Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-2">
        <div className="bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Authentication Screens</h3>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  View all authentication screens
                </p>
              </div>
            </div>
            <Link
              href={`${paths.dashboard.procurement.root}/auth-demo`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 whitespace-nowrap self-start sm:self-auto"
            >
              View Screens
            </Link>
          </div>
        </div>

        <div className="bg-linear-to-r from-success/10 to-success/5 border border-success/20 rounded-xl p-2 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-success rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Material Requisitions</h3>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Complete requisition module
                </p>
              </div>
            </div>
            <Link
              href={paths.dashboard.procurement.requisitions.list}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 whitespace-nowrap self-start sm:self-auto"
            >
              View Module
            </Link>
          </div>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, John. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Approval Queue */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Approval Queue
            </h2>
          </div>
          <div className="p-4 md:p-6">
            <div className="space-y-4">
              {approvalQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors gap-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <span className="font-medium text-foreground">{item.id}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{item.requester}</span>
                      <span>•</span>
                      <span>{item.department}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="sm:text-right sm:mr-4">
                      <p className="font-semibold text-foreground">{item.amount}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
              {approvalQueue.length === 0 && (
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-medium text-foreground">
                    No live approval queue feed yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This section is now isolated from mock data until a real approval queue source
                    is wired.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-4 md:p-6">
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
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Inventory Alerts */}
        <div className="lg:col-span-1 bg-card border border-border rounded-lg">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Inventory Alerts
            </h2>
          </div>
          <div className="p-4 md:p-6">
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
              {inventoryAlerts.length === 0 && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-sm font-medium text-foreground">No live inventory alerts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inventory alerts are hidden until a real alert feed is connected.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="p-4 md:p-6 border-b border-border">
            <h2 className="text-base md:text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center"
                  >
                    <ActionIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{action.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
