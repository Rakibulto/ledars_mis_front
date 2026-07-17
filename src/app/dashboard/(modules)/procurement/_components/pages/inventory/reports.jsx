'use client';

import { useState } from 'react';
import { Clock, Package, Download, Calendar, Warehouse, BarChart3 } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const formatBDT = (amount) => {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount.toLocaleString('en-IN')}`;
};
// ===== DAILY STOCK REPORT =====
const dailyStockData = {
  date: '2026-03-30',
  warehouse: 'Ukhiya Central Warehouse',
  summary: {
    totalItems: 142,
    totalValue: 8250000,
    stockIn: 3,
    stockOut: 7,
    transfers: 2,
    adjustments: 1,
  },
  items: [
    {
      id: 'INV-AAB-2026-0090',
      name: 'Emergency Tarpaulin (12ft x 18ft)',
      openingBal: 125,
      received: 200,
      issued: 80,
      transferred: 30,
      closingBal: 215,
      value: 258000,
      status: 'adequate',
    },
    {
      id: 'INV-AAB-2026-0091',
      name: 'Hygiene Kit (Family Pack)',
      openingBal: 58,
      received: 0,
      issued: 50,
      transferred: 0,
      closingBal: 8,
      value: 6800,
      status: 'critical',
    },
    {
      id: 'INV-AAB-2026-0092',
      name: 'First Aid Kit (Standard)',
      openingBal: 27,
      received: 0,
      issued: 15,
      transferred: 0,
      closingBal: 12,
      value: 30000,
      status: 'low',
    },
    {
      id: 'INV-AAB-2026-0093',
      name: 'Solar Lantern (Rechargeable)',
      openingBal: 35,
      received: 0,
      issued: 0,
      transferred: 0,
      closingBal: 35,
      value: 77000,
      status: 'adequate',
    },
    {
      id: 'INV-AAB-2026-0094',
      name: 'Bottled Water (1.5L Case of 12)',
      openingBal: 320,
      received: 0,
      issued: 45,
      transferred: 0,
      closingBal: 275,
      value: 55000,
      status: 'adequate',
    },
    {
      id: 'INV-AAB-2026-0095',
      name: 'Blanket (Thermal, 5ft x 7ft)',
      openingBal: 280,
      received: 0,
      issued: 0,
      transferred: 100,
      closingBal: 180,
      value: 171000,
      status: 'adequate',
    },
    {
      id: 'INV-AAB-2026-0100',
      name: 'Shelter Toolkit',
      openingBal: 45,
      received: 0,
      issued: 12,
      transferred: 0,
      closingBal: 33,
      value: 115500,
      status: 'adequate',
    },
    {
      id: 'INV-AAB-2026-0101',
      name: 'Water Purification Tablet (Strip of 10)',
      openingBal: 1200,
      received: 0,
      issued: 300,
      transferred: 0,
      closingBal: 900,
      value: 18000,
      status: 'adequate',
    },
  ],
};
// ===== AGING REPORT =====
const agingData = [
  {
    id: 'INV-AAB-2026-0090',
    name: 'Emergency Tarpaulin (12ft x 18ft)',
    category: 'Relief Supplies',
    location: 'Ukhiya Central Warehouse',
    receivedDate: '2026-01-15',
    daysInStock: 74,
    quantity: 215,
    value: 258000,
    expiryDate: null,
    aging: '60-90 days',
  },
  {
    id: 'INV-AAB-2026-0091',
    name: 'Hygiene Kit (Family Pack)',
    category: 'WASH Supplies',
    location: 'Ukhiya Central Warehouse',
    receivedDate: '2025-11-20',
    daysInStock: 130,
    quantity: 8,
    value: 6800,
    expiryDate: '2027-11-20',
    aging: '90-180 days',
  },
  {
    id: 'INV-AAB-2026-0078',
    name: 'Toner Cartridge HP 26A (Black)',
    category: 'IT Accessories',
    location: 'Dhaka HQ Store',
    receivedDate: '2025-09-10',
    daysInStock: 201,
    quantity: 25,
    value: 87500,
    expiryDate: null,
    aging: '180+ days',
  },
  {
    id: 'INV-AAB-2026-0102',
    name: 'Oral Rehydration Salt (ORS) — Batch A',
    category: 'Medical Supplies',
    location: 'Ukhiya Central Warehouse',
    receivedDate: '2025-06-15',
    daysInStock: 288,
    quantity: 150,
    value: 7500,
    expiryDate: '2026-06-15',
    aging: '180+ days',
  },
  {
    id: 'INV-AAB-2026-0103',
    name: 'Paracetamol (500mg) — Batch B',
    category: 'Medical Supplies',
    location: 'Ukhiya Central Warehouse',
    receivedDate: '2025-08-20',
    daysInStock: 222,
    quantity: 80,
    value: 4000,
    expiryDate: '2026-08-20',
    aging: '180+ days',
  },
  {
    id: 'INV-AAB-2026-0045',
    name: 'A4 Paper (80gsm, 500 sheet ream)',
    category: 'Office Supplies',
    location: 'Dhaka HQ Store',
    receivedDate: '2026-03-10',
    daysInStock: 20,
    quantity: 450,
    value: 225000,
    expiryDate: null,
    aging: '0-30 days',
  },
  {
    id: 'INV-AAB-2026-0012',
    name: 'HP ProBook 450 G10 Laptop',
    category: 'IT Equipment',
    location: 'Dhaka HQ Store',
    receivedDate: '2026-03-28',
    daysInStock: 2,
    quantity: 15,
    value: 1350000,
    expiryDate: null,
    aging: '0-30 days',
  },
];
// ===== MONTHLY WAREHOUSE SUMMARY =====
const monthlyWarehouseSummary = [
  {
    warehouse: 'Ukhiya Central Warehouse',
    manager: 'Rahima Begum',
    month: 'March 2026',
    openingValue: 7850000,
    closingValue: 8250000,
    totalReceived: 1450000,
    totalIssued: 850000,
    totalTransferred: 200000,
    itemCount: 142,
    stockInCount: 12,
    stockOutCount: 45,
    transferCount: 8,
    topItems: [
      { name: 'Emergency Tarpaulin', received: 500, issued: 280 },
      { name: 'Hygiene Kit', received: 100, issued: 92 },
      { name: 'First Aid Kit', received: 50, issued: 38 },
    ],
  },
  {
    warehouse: 'Teknaf Warehouse-1',
    manager: 'Karim Uddin',
    month: 'March 2026',
    openingValue: 2150000,
    closingValue: 2450000,
    totalReceived: 520000,
    totalIssued: 220000,
    totalTransferred: 0,
    itemCount: 68,
    stockInCount: 5,
    stockOutCount: 18,
    transferCount: 3,
    topItems: [
      { name: 'Blanket (Thermal)', received: 100, issued: 45 },
      { name: 'Solar Lantern', received: 50, issued: 30 },
      { name: 'Shelter Toolkit', received: 20, issued: 12 },
    ],
  },
  {
    warehouse: 'Dhaka HQ Store',
    manager: 'Md. Ashraful Hoque',
    month: 'March 2026',
    openingValue: 4250000,
    closingValue: 5850000,
    totalReceived: 1850000,
    totalIssued: 250000,
    totalTransferred: 0,
    itemCount: 95,
    stockInCount: 8,
    stockOutCount: 12,
    transferCount: 2,
    topItems: [
      { name: 'HP ProBook 450 G10 Laptop', received: 15, issued: 4 },
      { name: 'A4 Paper (80gsm)', received: 500, issued: 30 },
      { name: 'Toner Cartridge', received: 20, issued: 3 },
    ],
  },
  {
    warehouse: 'Teknaf Warehouse-2',
    manager: 'Selim Hossain',
    month: 'March 2026',
    openingValue: 980000,
    closingValue: 1050000,
    totalReceived: 185000,
    totalIssued: 115000,
    totalTransferred: 0,
    itemCount: 34,
    stockInCount: 3,
    stockOutCount: 8,
    transferCount: 1,
    topItems: [
      { name: 'Emergency Tarpaulin', received: 50, issued: 35 },
      { name: 'Bottled Water', received: 100, issued: 80 },
    ],
  },
];
const getAgingColor = (aging) => {
  switch (aging) {
    case '0-30 days':
      return 'success';
    case '30-60 days':
      return 'default';
    case '60-90 days':
      return 'warning';
    case '90-180 days':
      return 'warning';
    case '180+ days':
      return 'error';
    default:
      return 'default';
  }
};
const getStockStatusColor = (status) => {
  switch (status) {
    case 'adequate':
      return 'success';
    case 'low':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
};
export function InventoryReports() {
  const [activeReport, setActiveReport] = useState('daily');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-30');
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Inventory Reports</h1>
          <p className="text-muted-foreground">
            Ledars NGO — Daily Stock Report, Aging Report, Monthly Warehouse Summary
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range + Warehouse Filter */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Period:</span>
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center gap-2 ml-4">
              <Warehouse className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Warehouses</option>
                <option value="Dhaka HQ Store">Dhaka HQ Store</option>
                <option value="Ukhiya Central Warehouse">Ukhiya Central Warehouse</option>
                <option value="Teknaf Warehouse-1">Teknaf Warehouse-1</option>
                <option value="Teknaf Warehouse-2">Teknaf Warehouse-2</option>
              </select>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              Showing data for: {dateFrom} to {dateTo}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Report Type Selector */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          type="button"
          onClick={() => setActiveReport('daily')}
          className={`flex-1 p-4 border-2 rounded-lg transition-colors ${activeReport === 'daily' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${activeReport === 'daily' ? 'bg-primary/10' : 'bg-muted'}`}
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Daily Stock Report</p>
              <p className="text-xs text-muted-foreground">
                Daily opening/closing balance, in/out movements
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveReport('aging')}
          className={`flex-1 p-4 border-2 rounded-lg transition-colors ${activeReport === 'aging' ? 'border-warning bg-warning/5' : 'border-border hover:border-warning/50'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${activeReport === 'aging' ? 'bg-warning/10' : 'bg-muted'}`}
            >
              <Clock className="w-3.5 h-3.5 text-warning" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Aging Report</p>
              <p className="text-xs text-muted-foreground">
                Stock aging, expiry tracking, slow-moving items
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveReport('monthly')}
          className={`flex-1 p-4 border-2 rounded-lg transition-colors ${activeReport === 'monthly' ? 'border-success bg-success/5' : 'border-border hover:border-success/50'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${activeReport === 'monthly' ? 'bg-success/10' : 'bg-muted'}`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-success" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Monthly Warehouse Summary</p>
              <p className="text-xs text-muted-foreground">Warehouse-wise monthly stock summary</p>
            </div>
          </div>
        </button>
      </div>

      {/* DAILY STOCK REPORT */}
      {activeReport === 'daily' && (
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Daily Stock Report — {dailyStockData.date}
                  </h2>
                  <p className="text-sm text-muted-foreground">{dailyStockData.warehouse}</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Items</p>
                    <p className="text-xl font-bold text-foreground">
                      {dailyStockData.summary.totalItems}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                    <p className="text-xl font-bold text-primary">
                      {formatBDT(dailyStockData.summary.totalValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">In</p>
                    <p className="text-xl font-bold text-success">
                      +{dailyStockData.summary.stockIn}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Out</p>
                    <p className="text-xl font-bold text-warning">
                      -{dailyStockData.summary.stockOut}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Stock Movement Detail" />
            <CardBody>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Item
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Opening
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-success">
                        Received
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-warning">
                        Issued
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-primary">
                        Transferred
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Closing
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                        Value
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStockData.items.map((item) => (
                      <tr key={item.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.id}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-center text-foreground">
                          {item.openingBal}
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-medium text-success">
                          {item.received > 0 ? `+${item.received}` : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-medium text-warning">
                          {item.issued > 0 ? `-${item.issued}` : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-medium text-primary">
                          {item.transferred > 0 ? `-${item.transferred}` : '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-semibold text-foreground">
                          {item.closingBal}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-foreground">
                          {formatBDT(item.value)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Badge variant={getStockStatusColor(item.status)} size="sm">
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* AGING REPORT */}
      {activeReport === 'aging' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-success">
              <CardBody>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">0-30 days</p>
                  <p className="text-xl font-bold text-success">
                    {agingData.filter((i) => i.aging === '0-30 days').length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">30-60 days</p>
                  <p className="text-xl font-bold text-foreground">
                    {agingData.filter((i) => i.aging === '30-60 days').length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-warning">
              <CardBody>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">60-90 days</p>
                  <p className="text-xl font-bold text-warning">
                    {agingData.filter((i) => i.aging === '60-90 days').length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-warning">
              <CardBody>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">90-180 days</p>
                  <p className="text-xl font-bold text-warning">
                    {agingData.filter((i) => i.aging === '90-180 days').length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-error">
              <CardBody>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">180+ days</p>
                  <p className="text-xl font-bold text-error">
                    {agingData.filter((i) => i.aging === '180+ days').length}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader
              title="Stock Aging Detail"
              description="Time items have been in stock — flag slow-moving and near-expiry items"
            />
            <CardBody>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Item
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Days
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="text-right px-3 py-3 text-sm font-medium text-muted-foreground">
                        Value
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Expiry
                      </th>
                      <th className="text-center px-3 py-3 text-sm font-medium text-muted-foreground">
                        Aging
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData
                      .sort((a, b) => b.daysInStock - a.daysInStock)
                      .map((item) => (
                        <tr key={item.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.id}</p>
                          </td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">
                            {item.category}
                          </td>
                          <td className="px-3 py-3 text-sm text-muted-foreground">
                            {item.location}
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-semibold text-foreground">
                            {item.daysInStock}
                          </td>
                          <td className="px-3 py-3 text-sm text-center text-foreground">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-foreground">
                            {formatBDT(item.value)}
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            {item.expiryDate ? (
                              <span className="text-warning">{item.expiryDate}</span>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant={getAgingColor(item.aging)} size="sm">
                              {item.aging}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* MONTHLY WAREHOUSE SUMMARY */}
      {activeReport === 'monthly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Warehouses</p>
                  <p className="text-xl font-bold text-foreground">
                    {monthlyWarehouseSummary.length}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card className="border-l-4 border-l-primary">
              <CardBody>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Combined Closing Value</p>
                  <p className="text-xl font-bold text-primary">
                    {formatBDT(monthlyWarehouseSummary.reduce((s, w) => s + w.closingValue, 0))}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                  <p className="text-xl font-bold text-foreground">
                    {monthlyWarehouseSummary.reduce((s, w) => s + w.itemCount, 0)}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                  <p className="text-xl font-bold text-foreground">
                    {monthlyWarehouseSummary.reduce(
                      (s, w) => s + w.stockInCount + w.stockOutCount + w.transferCount,
                      0
                    )}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
          {monthlyWarehouseSummary.map((wh, index) => (
            <Card key={index}>
              <CardHeader
                title={wh.warehouse}
                description={`Manager: ${wh.manager} \u2022 ${wh.month}`}
              />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Opening Value</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatBDT(wh.openingValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-success/5 rounded-lg text-center">
                    <p className="text-xs text-success mb-1">Received</p>
                    <p className="text-lg font-semibold text-success">
                      {formatBDT(wh.totalReceived)}
                    </p>
                  </div>
                  <div className="p-3 bg-warning/5 rounded-lg text-center">
                    <p className="text-xs text-warning mb-1">Issued</p>
                    <p className="text-lg font-semibold text-warning">
                      {formatBDT(wh.totalIssued)}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg text-center">
                    <p className="text-xs text-primary mb-1">Transferred</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatBDT(wh.totalTransferred)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Closing Value</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatBDT(wh.closingValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                    <p className="text-lg font-semibold text-foreground">{wh.itemCount}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 border border-border rounded-lg flex items-center gap-3">
                    <Package className="w-3.5 h-3.5 shrink-0 text-success" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stock In</p>
                      <p className="font-semibold text-foreground">
                        {wh.stockInCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded-lg flex items-center gap-3">
                    <Package className="w-3.5 h-3.5 shrink-0 text-warning" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stock Out</p>
                      <p className="font-semibold text-foreground">
                        {wh.stockOutCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded-lg flex items-center gap-3">
                    <Warehouse className="w-3.5 h-3.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Transfers</p>
                      <p className="font-semibold text-foreground">
                        {wh.transferCount} transactions
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Top Items (Received / Issued)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {wh.topItems.map((item, i) => (
                      <Badge key={i} variant="outline">
                        {item.name}: +{item.received} / -{item.issued}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
