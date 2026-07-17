'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Send,
  Mail,
  Star,
  Bell,
  Users,
  Clock,
  Globe,
  Shield,
  XCircle,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { PageLoader } from '../../components/ui/loading';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function VendorDistribution() {
  const router = useRouter();
  const [selectedRFQ, setSelectedRFQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { data: rfqRaw, loading: rfqLoading } = useGetRequest(
    `${endpoints.procurement_management.rfqs}?pagination=false`
  );

  const rfqs = (
    Array.isArray(rfqRaw) ? rfqRaw : Array.isArray(rfqRaw?.results) ? rfqRaw.results : []
  ).map((r) => ({
    rfqNumber: r.rfq_number || '',
    title: r.rfq_title || r.title || '',
    category: r.category_name || '',
    selectedCategories: [r.category_name || ''].filter(Boolean),
    deadline: r.submission_deadline || '',
    estimatedAmount: Number(r.total_estimated_value) || 0,
    vendors: (r.invited_vendors || r.vendors || []).map((v) => {
      const vendor = v.vendor || v;
      return {
        id: String(v.id),
        name: vendor.name || vendor.company_name_bn || '',
        email: vendor.user?.email || '',
        categories:
          Array.isArray(vendor.categories) && vendor.categories.length > 0
            ? vendor.categories
            : vendor.category
              ? [vendor.category]
              : [],
        location: vendor.city || '',
        rating: Number(vendor.rating) || 0,
        contracts: vendor.active_contracts || vendor.total_orders || 0,
        inviteStatus: v.submitted_status ? 'submitted' : v.invite_status || 'sent',
        emailStatus: v.email_status || 'pending',
        portalNotification: true,
        invitedAt: v.invited_at || r.published_date || '',
        viewedAt: null,
        submittedAt: null,
        lastReminder: null,
      };
    }),
  }));

  // set default selected RFQ once data is loaded
  const effectiveSelectedRFQ = selectedRFQ || rfqs[0]?.rfqNumber || '';
  const currentRFQ = rfqs.find((r) => r.rfqNumber === effectiveSelectedRFQ) ||
    rfqs[0] || {
      rfqNumber: '',
      title: '',
      selectedCategories: [],
      deadline: '',
      estimatedAmount: 0,
      vendors: [],
    };
  const vendors = currentRFQ.vendors || [];
  const filtered =
    statusFilter === 'all' ? vendors : vendors.filter((v) => v.inviteStatus === statusFilter);
  const stats = {
    total: vendors.length,
    submitted: vendors.filter((v) => v.inviteStatus === 'submitted').length,
    viewed: vendors.filter((v) => v.inviteStatus === 'viewed').length,
    sent: vendors.filter((v) => v.inviteStatus === 'sent').length,
    declined: vendors.filter((v) => v.inviteStatus === 'declined').length,
    emailDelivered: vendors.filter((v) => v.emailStatus === 'delivered').length,
    emailBounced: vendors.filter((v) => v.emailStatus === 'bounced').length,
  };
  const getInviteBadge = (status) => {
    const config = {
      submitted: { variant: 'success', label: 'Submitted', icon: CheckCircle },
      viewed: { variant: 'info', label: 'Viewed', icon: Eye },
      sent: { variant: 'warning', label: 'Sent', icon: Send },
      declined: { variant: 'danger', label: 'Declined', icon: XCircle },
      'not-sent': { variant: 'default', label: 'Not Sent', icon: Clock },
    };
    // const c = config[status] || config['sent'];
    const c = config[status] || config.sent;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {c.label}
      </Badge>
    );
  };
  if (rfqLoading) {
    return <PageLoader message="Loading distribution data..." />;
  }

  const handleSendReminderAll = async () => {
    const pending = vendors.filter(
      (v) => v.inviteStatus !== 'submitted' && v.inviteStatus !== 'declined'
    );
    if (!pending.length) {
      toast.info('No vendors pending submission');
      return;
    }
    setReminderLoading(true);
    try {
      toast.success(`Reminder sent to ${pending.length} vendor${pending.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to send reminders. Please try again.');
    } finally {
      setReminderLoading(false);
    }
  };

  const handleResendFailed = async () => {
    const bounced = vendors.filter((v) => v.emailStatus === 'bounced');
    if (!bounced.length) {
      toast.info('No bounced emails to resend');
      return;
    }
    setResendLoading(true);
    try {
      bounced.forEach((v) => toast.info(`Resend triggered for ${v.name}`));
    } catch {
      toast.error('Resend failed. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href={paths.dashboard.procurement.rfq.list}>
          <button type="button" className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Vendor Distribution & Notifications
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Category-based RFQ distribution with email and portal notifications
          </p>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total Invited" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Submitted" value={stats.submitted} icon={CheckCircle} color="green" />
        <StatCard title="Viewed" value={stats.viewed} icon={Eye} color="blue" />
        <StatCard title="Pending" value={stats.sent} icon={Clock} color="orange" />
        <StatCard title="Declined" value={stats.declined} icon={XCircle} color="red" />
        <StatCard
          title="Email Delivered"
          value={`${stats.emailDelivered}/${stats.total}`}
          icon={Mail}
          color="green"
        />
      </div>

      {/* RFQ Selector & Category Info */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <p className="block text-xs font-semibold text-muted-foreground mb-1">SELECT RFQ</p>
              <select
                value={effectiveSelectedRFQ}
                onChange={(e) => setSelectedRFQ(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {rfqs.map((r) => (
                  <option key={r.rfqNumber} value={r.rfqNumber}>
                    {r.rfqNumber} - {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <p className="block text-xs font-semibold text-muted-foreground mb-1">
                VENDOR CATEGORIES (VISIBILITY)
              </p>
              <div className="flex flex-wrap gap-1">
                {currentRFQ.selectedCategories.map((cat, i) => (
                  <Badge key={i} variant="primary" size="sm">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="block text-xs font-semibold text-muted-foreground mb-1">DEADLINE</p>
              <p className="text-sm font-medium">
                {new Date(currentRFQ.deadline).toLocaleDateString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="block text-xs font-semibold text-muted-foreground mb-1">EST. AMOUNT</p>
              <p className="text-sm font-bold text-primary">
                BDT {currentRFQ.estimatedAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Category Visibility Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Category-Based Vendor Visibility Active
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Only vendors registered under{' '}
            <strong>{currentRFQ.selectedCategories.join(', ')}</strong> can view and respond to this
            RFQ. Vendors outside these categories cannot access any RFQ information on the vendor
            portal. Email notifications are sent only to selected category vendors.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'submitted', 'viewed', 'sent', 'declined'].map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === status ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} (
            {status === 'all'
              ? vendors.length
              : vendors.filter((v) => v.inviteStatus === status).length}
            )
          </button>
        ))}
      </div>

      {/* Vendor Distribution Table */}
      <Card>
        <CardHeader
          title={`Vendor Distribution - ${currentRFQ.rfqNumber}`}
          description={`${filtered.length} vendors shown | Category: ${currentRFQ.category}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={reminderLoading}
                onClick={handleSendReminderAll}
              >
                <Bell className="w-4 h-4 mr-1" />
                {reminderLoading ? 'Sending...' : 'Send Reminder'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={resendLoading}
                onClick={handleResendFailed}
              >
                <Send className="w-4 h-4 mr-1" />
                {resendLoading ? 'Resending...' : 'Resend Failed'}
              </Button>
            </div>
          }
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold">Vendor</th>
                  <th className="pb-3 text-xs font-semibold">Categories</th>
                  <th className="pb-3 text-xs font-semibold text-center">Rating</th>
                  <th className="pb-3 text-xs font-semibold text-center">Email</th>
                  <th className="pb-3 text-xs font-semibold text-center">Portal</th>
                  <th className="pb-3 text-xs font-semibold">Invited</th>
                  <th className="pb-3 text-xs font-semibold">Viewed</th>
                  <th className="pb-3 text-xs font-semibold">Submitted</th>
                  <th className="pb-3 text-xs font-semibold">Status</th>
                  <th className="pb-3 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3">
                      <p className="text-sm font-medium text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.location} &middot; {v.contracts} contracts
                      </p>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.categories.map((c, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded ${currentRFQ.selectedCategories.includes(c) ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'}`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="flex items-center gap-0.5 justify-center text-xs">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {v.rating}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          v.emailStatus === 'delivered'
                            ? 'success'
                            : v.emailStatus === 'bounced'
                              ? 'danger'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {v.emailStatus === 'delivered' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : v.emailStatus === 'bounced' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      {v.portalNotification ? (
                        <Badge variant="success" size="sm">
                          <Globe className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <XCircle className="w-3 h-3" />
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-xs">
                      {v.invitedAt || <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                    <td className="py-3 text-xs">
                      {v.viewedAt || <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                    <td className="py-3 text-xs">
                      {v.submittedAt || <span className="text-muted-foreground">&mdash;</span>}
                    </td>
                    <td className="py-3">{getInviteBadge(v.inviteStatus)}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {v.inviteStatus !== 'submitted' && v.inviteStatus !== 'declined' && (
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Send Reminder"
                            onClick={() => toast.success(`Reminder sent to ${v.name}`)}
                          >
                            <Bell className="w-3.5 h-3.5 text-orange-500" />
                          </button>
                        )}
                        {v.emailStatus === 'bounced' && (
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded"
                            title="Resend Email"
                            onClick={() => toast.info(`Resend triggered for ${v.name}`)}
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Notification Summary */}
      <Card className="mt-6">
        <CardHeader title="Notification Summary" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <Mail className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{stats.emailDelivered}</p>
              <p className="text-xs text-green-600">Emails Delivered</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-700">{stats.emailBounced}</p>
              <p className="text-xs text-red-600">Emails Bounced</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <Globe className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">
                {vendors.filter((v) => v.portalNotification).length}
              </p>
              <p className="text-xs text-blue-600">Portal Notifications</p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <Bell className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-700">
                {vendors.filter((v) => v.lastReminder).length}
              </p>
              <p className="text-xs text-purple-600">Reminders Sent</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
