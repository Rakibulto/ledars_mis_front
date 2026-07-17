import { useState } from 'react';
import { Link } from 'react-router';
import {
  X,
  Bell,
  Award,
  Truck,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorNotifications() {
  const [filter, setFilter] = useState('all');
  const notifications = [
    {
      id: 1,
      type: 'award',
      title: 'Congratulations! You won a tender',
      message: 'You have been awarded RFQ-2024-038 for Office Furniture Supply worth $25,000',
      time: '2 hours ago',
      read: false,
      icon: Award,
      color: 'warning',
      action: 'View Award',
      link: '/vendor-portal/awards',
    },
    {
      id: 2,
      type: 'work-order',
      title: 'New Work Order Issued',
      message: 'Work Order WO-2024-018 has been issued. Please accept within 48 hours.',
      time: '5 hours ago',
      read: false,
      icon: Truck,
      color: 'error',
      action: 'Accept Work Order',
      link: '/vendor-portal/work-orders',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $8,500 for Invoice INV-2024-088 has been credited to your account.',
      time: '1 day ago',
      read: true,
      icon: DollarSign,
      color: 'success',
      action: 'View Payment',
      link: '/vendor-portal/payments',
    },
    {
      id: 4,
      type: 'rfq',
      title: 'New RFQ Available',
      message:
        'RFQ-2024-051 for Construction Materials is now open for bidding. Deadline: March 22',
      time: '1 day ago',
      read: true,
      icon: FileText,
      color: 'primary',
      action: 'Submit Quote',
      link: '/vendor-portal/rfqs',
    },
    {
      id: 5,
      type: 'document',
      title: 'Document Approved',
      message: 'Your Tax Clearance Certificate has been verified and approved.',
      time: '2 days ago',
      read: true,
      icon: CheckCircle,
      color: 'success',
      action: 'View Documents',
      link: '/vendor-portal/documents',
    },
    {
      id: 6,
      type: 'delivery',
      title: 'Delivery Documents Required',
      message: 'Please upload delivery documents for WO-2024-015 by March 30',
      time: '2 days ago',
      read: false,
      icon: AlertCircle,
      color: 'warning',
      action: 'Upload Documents',
      link: '/vendor-portal/delivery',
    },
    {
      id: 7,
      type: 'rfq',
      title: 'RFQ Deadline Approaching',
      message: 'Only 2 days left to submit quotation for RFQ-2024-045',
      time: '3 days ago',
      read: true,
      icon: FileText,
      color: 'error',
      action: 'Submit Now',
      link: '/vendor-portal/rfqs',
    },
  ];
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'award', label: 'Awards' },
    { value: 'payment', label: 'Payments' },
    { value: 'rfq', label: 'RFQs' },
    { value: 'work-order', label: 'Work Orders' },
  ];
  const filteredNotifications =
    filter === 'all'
      ? notifications
      : filter === 'unread'
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === filter);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="error" className="px-2 py-1">
                    {unreadCount} New
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">Stay updated with your activities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                Mark All as Read
              </Button>
              <Link to="/vendor-portal/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div>
            <Card>
              <CardHeader title="Filter" />
              <CardBody>
                <div className="space-y-2">
                  {filters.map((f) => {
                    const count =
                      f.value === 'all'
                        ? notifications.length
                        : f.value === 'unread'
                          ? unreadCount
                          : notifications.filter((n) => n.type === f.value).length;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`w-full p-3 text-left rounded-lg transition-colors ${
                          filter === f.value ? 'bg-primary text-white' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{f.label}</span>
                          <Badge
                            variant={filter === f.value ? 'default' : 'default'}
                            size="sm"
                            className={filter === f.value ? 'bg-white/20 text-white' : ''}
                          >
                            {count}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader title="Notification Settings" />
              <CardBody>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-foreground">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-foreground">New RFQs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-foreground">Award notifications</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-foreground">Payment updates</span>
                  </label>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content - Notifications List */}
          <div className="col-span-3">
            <Card>
              <CardHeader
                title={`${filteredNotifications.length} Notification${filteredNotifications.length !== 1 ? 's' : ''}`}
                description={
                  filter === 'all'
                    ? 'All notifications'
                    : `Filtered by: ${filters.find((f) => f.value === filter)?.label}`
                }
              />
              <CardBody>
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className={`p-5 border-2 rounded-lg transition-all ${
                          !notification.read
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-${notification.color}/10`}
                          >
                            <Icon className={`w-6 h-6 text-${notification.color}`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">
                                    {notification.title}
                                  </h3>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-sm text-foreground mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">{notification.time}</p>
                              </div>

                              <button className="p-1 hover:bg-muted rounded transition-colors">
                                <X className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>

                            <div className="flex gap-2 mt-3">
                              <Link to={notification.link}>
                                <Button variant="primary" size="sm">
                                  {notification.action}
                                </Button>
                              </Link>
                              {!notification.read && (
                                <Button variant="outline" size="sm">
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                      <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No notifications
                      </h3>
                      <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
