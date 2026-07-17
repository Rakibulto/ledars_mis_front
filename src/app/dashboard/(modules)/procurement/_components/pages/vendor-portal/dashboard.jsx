import { Link } from 'react-router';
import {
  Tag,
  Send,
  Bell,
  Award,
  Truck,
  Shield,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorDashboard() {
  const vendorInfo = {
    companyName: 'TechBD Solutions Ltd',
    vendorId: 'V001',
    enlistment: '2025-2026',
    categories: ['IT Equipment', 'Computer Hardware', 'Networking'],
    twoFAEnabled: true,
    lastLogin: '2026-04-02 14:30',
    profileComplete: 100,
    docExpiring: 2,
  };
  const stats = [
    {
      label: 'Active RFQs (My Categories)',
      value: '4',
      icon: FileText,
      color: 'primary',
      link: '/vendor-portal/rfqs',
    },
    {
      label: 'Submitted Quotations',
      value: '8',
      icon: Send,
      color: 'success',
      link: '/vendor-portal/quotations',
    },
    {
      label: 'Awarded Tenders',
      value: '5',
      icon: Award,
      color: 'warning',
      link: '/vendor-portal/awards',
    },
    {
      label: 'Active Work Orders',
      value: '2',
      icon: Truck,
      color: 'error',
      link: '/vendor-portal/work-orders',
    },
  ];
  const activeRFQs = [
    {
      id: 'RFQ-2026-012',
      title: 'Laptop Procurement - WASH Project (Dhaka)',
      category: 'IT Equipment',
      deadline: '2026-04-18',
      status: 'open',
      daysLeft: 14,
      budget: 'BDT 6,50,000',
    },
    {
      id: 'RFQ-2026-015',
      title: 'Network Switch & Router for Field Offices',
      category: 'Networking',
      deadline: '2026-04-12',
      status: 'open',
      daysLeft: 8,
      budget: 'BDT 3,20,000',
    },
    {
      id: 'RFQ-2026-018',
      title: 'Desktop PC & Monitors - Rajshahi Office',
      category: 'Computer Hardware',
      deadline: '2026-04-08',
      status: 'open',
      daysLeft: 4,
      budget: 'BDT 4,85,000',
    },
    {
      id: 'RFQ-2026-022',
      title: 'Server & UPS - HQ Data Center Upgrade',
      category: 'IT Equipment',
      deadline: '2026-04-25',
      status: 'open',
      daysLeft: 21,
      budget: 'BDT 12,00,000',
    },
  ];
  const recentActivity = [
    {
      type: 'quotation',
      message: 'Technical & financial proposal submitted for RFQ-2026-008',
      time: '3 hours ago',
      icon: Send,
      color: 'success',
    },
    {
      type: 'award',
      message: 'Awarded: Network Infrastructure Upgrade (BDT 3,20,000)',
      time: '1 day ago',
      icon: Award,
      color: 'warning',
    },
    {
      type: 'payment',
      message: 'Payment of BDT 6,50,000 received for WO-2025-092',
      time: '3 days ago',
      icon: DollarSign,
      color: 'success',
    },
    {
      type: 'doc-alert',
      message: 'Tax Compliance Certificate expires in 87 days',
      time: '5 days ago',
      icon: AlertCircle,
      color: 'error',
    },
    {
      type: 'delivery',
      message: 'Delivery confirmed for WO-2026-008',
      time: '1 week ago',
      icon: Truck,
      color: 'success',
    },
  ];
  const pendingActions = [
    {
      id: 1,
      action: 'Submit quotation for RFQ-2026-018 (4 days left)',
      priority: 'urgent',
      link: '/vendor-portal/rfqs',
    },
    {
      id: 2,
      action: 'Accept Work Order WO-2026-015',
      priority: 'high',
      link: '/vendor-portal/work-orders',
    },
    {
      id: 3,
      action: 'Upload delivery challan for WO-2026-015',
      priority: 'high',
      link: '/vendor-portal/delivery',
    },
    {
      id: 4,
      action: 'Renew Tax Compliance Certificate (87 days left)',
      priority: 'medium',
      link: '/vendor-portal/documents',
    },
  ];
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">Vendor Portal</h1>
                {vendorInfo.twoFAEnabled && (
                  <Badge variant="info" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    2FA Active
                  </Badge>
                )}
                <Badge variant="primary" size="sm">
                  {vendorInfo.enlistment}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Welcome back, {vendorInfo.companyName} ({vendorInfo.vendorId})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/vendor-portal/notifications">
                <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </Link>
              <Link to="/vendor-portal/profile">
                <Button variant="outline" size="sm">
                  My Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Category Badge Row */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold">MY CATEGORIES:</span>
          {vendorInfo.categories.map((cat) => (
            <Badge key={cat} variant="default" size="sm">
              <Tag className="w-3 h-3 mr-1" />
              {cat}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            You see RFQs only in these categories
          </span>
        </div>

        {/* Doc Expiry Alert */}
        {vendorInfo.docExpiring > 0 && (
          <Card className="mb-6 border-l-4 border-l-orange-500">
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {vendorInfo.docExpiring} Document(s) Expiring Soon
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tax Compliance Certificate and Bank Solvency Certificate expire within 90
                      days. Update them to maintain active status.
                    </p>
                  </div>
                </div>
                <Link to="/vendor-portal/documents">
                  <Button variant="primary" size="sm">
                    Update Documents
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardBody>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-12 h-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 text-${stat.color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Active RFQs */}
          <div className="col-span-2">
            <Card>
              <CardHeader
                title="Category-Specific RFQs"
                description="Active RFQs matching your assigned categories"
                action={
                  <Link to="/vendor-portal/rfqs">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                }
              />
              <CardBody>
                <div className="space-y-3">
                  {activeRFQs.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {rfq.id}
                            </span>
                            <Badge variant="default" size="sm">
                              {rfq.category}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">{rfq.title}</h4>
                          <p className="text-xs text-muted-foreground">Est. Budget: {rfq.budget}</p>
                        </div>
                        <Badge variant={rfq.daysLeft <= 5 ? 'danger' : 'warning'} size="sm">
                          {rfq.daysLeft} days left
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Deadline: {rfq.deadline}
                        </span>
                        <Link to="/vendor-portal/submit-quotation">
                          <Button variant="primary" size="sm">
                            Submit Proposal
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader title="Recent Activity" />
              <CardBody>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-${activity.color}/10 flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`w-5 h-5 text-${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader title="Pending Actions" description="Tasks requiring your attention" />
              <CardBody>
                <div className="space-y-3">
                  {pendingActions.map((item) => (
                    <Link key={item.id} to={item.link}>
                      <div
                        className={`p-3 rounded-lg border-l-4 ${
                          item.priority === 'urgent'
                            ? 'border-l-red-500 bg-red-50'
                            : item.priority === 'high'
                              ? 'border-l-orange-500 bg-orange-50'
                              : 'border-l-primary bg-primary/5'
                        } hover:shadow-md transition-shadow cursor-pointer`}
                      >
                        <p className="text-sm font-medium text-foreground">{item.action}</p>
                        <Badge
                          variant={
                            item.priority === 'urgent'
                              ? 'danger'
                              : item.priority === 'high'
                                ? 'warning'
                                : 'default'
                          }
                          size="sm"
                          className="mt-2"
                        >
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader title="Quick Links" />
              <CardBody>
                <div className="space-y-2">
                  {[
                    {
                      to: '/vendor-portal/awards',
                      icon: Award,
                      label: 'My Awards',
                      color: 'text-primary',
                    },
                    {
                      to: '/vendor-portal/payments',
                      icon: DollarSign,
                      label: 'Payment Status (BDT)',
                      color: 'text-green-600',
                    },
                    {
                      to: '/vendor-portal/documents',
                      icon: FileText,
                      label: 'My Documents',
                      color: 'text-foreground',
                    },
                    {
                      to: '/vendor-portal/work-orders',
                      icon: Truck,
                      label: 'Work Orders',
                      color: 'text-blue-600',
                    },
                  ].map((link) => (
                    <Link key={link.to} to={link.to}>
                      <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <link.icon className={`w-5 h-5 ${link.color}`} />
                          <span className="text-sm font-medium text-foreground">{link.label}</span>
                        </div>
                      </button>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Portal Security */}
            <Card className="mt-6">
              <CardBody>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Portal Security</p>
                    <p className="text-[10px] text-muted-foreground">
                      2FA: Active &middot; Last login: {vendorInfo.lastLogin}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
