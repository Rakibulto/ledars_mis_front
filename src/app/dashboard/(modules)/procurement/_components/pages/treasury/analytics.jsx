'use client';

import { useState } from 'react';
import { Clock, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function PaymentAnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  // Mock analytics data
  const analytics = {
    totalPayments: 45,
    totalValue: 1245000,
    avgPaymentTime: 5.2,
    onTimePayments: 38,
    delayedPayments: 7,
    byStatus: {
      paid: { count: 28, value: 845000 },
      partiallyPaid: { count: 5, value: 120000 },
      sentToTreasury: { count: 6, value: 185000 },
      onHold: { count: 3, value: 65000 },
      returned: { count: 2, value: 25000 },
      rejected: { count: 1, value: 5000 },
    },
    byMonth: [
      { month: 'Oct', payments: 12, value: 285000 },
      { month: 'Nov', payments: 15, value: 390000 },
      { month: 'Dec', payments: 18, value: 570000 },
    ],
    topVendors: [
      { name: 'BuildPro Construction', payments: 8, value: 425000 },
      { name: 'TechSupply Global', payments: 12, value: 320000 },
      { name: 'Premium Office Solutions', payments: 10, value: 245000 },
      { name: 'Medical Equipment Corp', payments: 6, value: 165000 },
      { name: 'Office Supplies Inc', payments: 9, value: 90000 },
    ],
    paymentMethods: [
      { method: 'Bank Transfer', count: 32, percentage: 71 },
      { method: 'RTGS', count: 8, percentage: 18 },
      { method: 'Check', count: 3, percentage: 7 },
      { method: 'Mobile Money', count: 2, percentage: 4 },
    ],
    budgetUtilization: [
      { code: 'BDG-CONST-2024', allocated: 500000, spent: 425000, percentage: 85 },
      { code: 'BDG-IT-2024', allocated: 400000, spent: 320000, percentage: 80 },
      { code: 'BDG-OP-2024', allocated: 300000, spent: 245000, percentage: 82 },
      { code: 'BDG-MED-2024', allocated: 250000, spent: 165000, percentage: 66 },
      { code: 'BDG-ADMIN-2024', allocated: 150000, spent: 90000, percentage: 60 },
    ],
    avgProcessingTime: [
      { stage: 'PRF Creation to Approval', days: 2.3 },
      { stage: 'Approval to Treasury', days: 1.5 },
      { stage: 'Treasury to Payment', days: 1.4 },
      { stage: 'Total Cycle Time', days: 5.2 },
    ],
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Payment Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive payment and treasury insights</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{analytics.totalPayments}</p>
            <p className="text-sm font-semibold text-primary">
              ${(analytics.totalValue / 1000000).toFixed(2)}M total value
            </p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Paid</p>
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success mb-1">{analytics.byStatus.paid.count}</p>
            <p className="text-sm text-muted-foreground">
              ${(analytics.byStatus.paid.value / 1000).toFixed(0)}K disbursed
            </p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{analytics.avgPaymentTime}</p>
            <p className="text-sm text-muted-foreground">days end-to-end</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success mb-1">
              {Math.round((analytics.onTimePayments / analytics.totalPayments) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {analytics.onTimePayments} of {analytics.totalPayments} payments
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Payment Status Breakdown */}
        <Card className="col-span-2">
          <CardHeader
            title="Payment Status Breakdown"
            description="Current distribution by status"
          />
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm font-medium text-foreground">Paid</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {analytics.byStatus.paid.count} payments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(analytics.byStatus.paid.value / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${(analytics.byStatus.paid.value / analytics.totalValue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm font-medium text-foreground">Partially Paid</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {analytics.byStatus.partiallyPaid.count} payments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(analytics.byStatus.partiallyPaid.value / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(analytics.byStatus.partiallyPaid.value / analytics.totalValue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">Sent to Treasury</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {analytics.byStatus.sentToTreasury.count} payments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(analytics.byStatus.sentToTreasury.value / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(analytics.byStatus.sentToTreasury.value / analytics.totalValue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-sm font-medium text-foreground">On Hold</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {analytics.byStatus.onHold.count} payments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(analytics.byStatus.onHold.value / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(analytics.byStatus.onHold.value / analytics.totalValue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <span className="text-sm font-medium text-foreground">Returned/Rejected</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {analytics.byStatus.returned.count + analytics.byStatus.rejected.count}{' '}
                      payments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      $
                      {(
                        (analytics.byStatus.returned.value + analytics.byStatus.rejected.value) /
                        1000
                      ).toFixed(0)}
                      K
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-error"
                    style={{
                      width: `${((analytics.byStatus.returned.value + analytics.byStatus.rejected.value) / analytics.totalValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader title="Payment Methods" description="Distribution by method" />
          <CardBody>
            <div className="space-y-3">
              {analytics.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <p className="text-sm font-medium text-foreground">{method.method}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{method.count}</span>
                    <Badge variant="default" size="sm">
                      {method.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Top Vendors */}
        <Card>
          <CardHeader
            title="Top Vendors by Payment Value"
            description="Highest payment recipients"
          />
          <CardBody>
            <div className="space-y-3">
              {analytics.topVendors.map((vendor, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.payments} payments</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    ${(vendor.value / 1000).toFixed(0)}K
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardHeader title="Avg Processing Time by Stage" description="Days per workflow stage" />
          <CardBody>
            <div className="space-y-4">
              {analytics.avgProcessingTime.map((stage, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{stage.stage}</p>
                    <p className="text-sm font-semibold text-primary">{stage.days} days</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${index === analytics.avgProcessingTime.length - 1 ? 'bg-primary' : 'bg-success'}`}
                      style={{ width: `${(stage.days / 6) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader title="Budget Utilization" description="Spending vs allocated budget" />
        <CardBody>
          <div className="space-y-4">
            {analytics.budgetUtilization.map((budget, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono font-semibold text-foreground">{budget.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${(budget.spent / 1000).toFixed(0)}K / ${(budget.allocated / 1000).toFixed(0)}
                      K
                    </p>
                    <Badge
                      variant={
                        budget.percentage >= 90
                          ? 'error'
                          : budget.percentage >= 75
                            ? 'warning'
                            : 'success'
                      }
                      size="sm"
                    >
                      {budget.percentage}% utilized
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      budget.percentage >= 90
                        ? 'bg-error'
                        : budget.percentage >= 75
                          ? 'bg-warning'
                          : 'bg-success'
                    }`}
                    style={{ width: `${budget.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
