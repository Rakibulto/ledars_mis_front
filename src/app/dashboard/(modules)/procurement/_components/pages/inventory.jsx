'use client';

import Link from 'next/link';
import {
  Box,
  Boxes,
  Package,
  FileText,
  Warehouse,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { Card, CardBody } from '../components/ui/card';
const formatBDT = (amount) => {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount.toLocaleString('en-IN')}`;
};
const summaryData = {
  totalInventoryValue: 18750000,
  fixedAssets: { count: 342, value: 14250000 },
  consumables: { count: 1256, value: 4500000 },
  lowStockAlerts: 14,
  outOfStock: 3,
  warehouses: 4,
  pendingRequisitions: 8,
  pendingReleases: 5,
};
const quickStats = [
  {
    label: 'Total Inventory Value',
    value: formatBDT(summaryData.totalInventoryValue),
    icon: TrendingUp,
    color: 'primary',
  },
  {
    label: 'Fixed Assets',
    value: summaryData.fixedAssets.count,
    sub: formatBDT(summaryData.fixedAssets.value),
    icon: Box,
    color: 'blue-500',
  },
  {
    label: 'Consumable Items',
    value: summaryData.consumables.count,
    sub: formatBDT(summaryData.consumables.value),
    icon: Package,
    color: 'green-500',
  },
  {
    label: 'Low Stock Alerts',
    value: summaryData.lowStockAlerts,
    sub: `${summaryData.outOfStock} out of stock`,
    icon: AlertTriangle,
    color: 'warning',
  },
];
const modules = [
  {
    title: 'Inventory Dashboard',
    desc: 'Overview of assets, consumables, stock levels & alerts',
    link: '/inventory/dashboard',
    icon: Boxes,
    badge: null,
  },
  {
    title: 'Inventory Items',
    desc: 'Browse all fixed assets and consumable items',
    link: '/inventory/items',
    icon: Package,
    badge: null,
  },
  {
    title: 'Stock Movements',
    desc: 'Track all stock in/out/transfer/adjustment transactions',
    link: '/inventory/movement',
    icon: ArrowRight,
    badge: null,
  },
  {
    title: 'Stock Issue / Transfer',
    desc: 'Issue stock to departments or transfer between locations',
    link: '/inventory/issue',
    icon: ClipboardList,
    badge: null,
  },
  {
    title: 'Warehouse Management',
    desc: 'Manage Ukhiya, Teknaf & Dhaka warehouses',
    link: '/inventory/warehouses',
    icon: Warehouse,
    badge: `${summaryData.warehouses} Active`,
  },
  {
    title: 'Material Requisition',
    desc: 'Raise material requests with 4-level approval workflow',
    link: '/inventory/material-requisition',
    icon: FileText,
    badge:
      summaryData.pendingRequisitions > 0 ? `${summaryData.pendingRequisitions} Pending` : null,
  },
  {
    title: 'Material Release',
    desc: 'Generate release notes, challans & waybills',
    link: '/inventory/material-release',
    icon: ClipboardList,
    badge: summaryData.pendingReleases > 0 ? `${summaryData.pendingReleases} Pending` : null,
  },
  {
    title: 'Inventory Reports',
    desc: 'Daily stock, aging & monthly warehouse summary reports',
    link: '/inventory/reports',
    icon: FileText,
    badge: null,
  },
];
export function Inventory() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Inventory & Warehouse Management
          </h1>
          <p className="text-muted-foreground">
            Ledars NGO — Asset management, stock tracking & warehouse operations
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {quickStats.map((stat, i) => (
            <Card key={i} className={i === 0 ? '' : `border-l-4 border-l-${stat.color}`}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                    {stat.sub && <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Module Navigation */}
        <div className="grid grid-cols-2 gap-6">
          {modules.map((mod) => (
            <Link key={mod.title} href={mod.link}>
              <Card hover className="h-full">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <mod.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">{mod.title}</h3>
                        {mod.badge && (
                          <Badge variant="warning" size="sm">
                            {mod.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{mod.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
