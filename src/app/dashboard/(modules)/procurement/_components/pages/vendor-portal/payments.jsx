import * as ReactRouter from 'react-router';
import {
  Bell,
  Clock,
  Download,
  Calendar,
  FileText,
  Banknote,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const Link = ReactRouter.Link || ReactRouter.default?.Link;
const formatBDT = (amount) => {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
};
export function VendorPayments() {
  const payments = [
    {
      id: 'PAY-AAB-2026-025',
      prfId: 'PRF-AAB-2026-008',
      woId: 'WO-AAB-2026-010',
      poId: 'PO-AAB-2026-010',
      invoiceNo: 'INV-TBS-2026-032',
      grossAmount: 345000,
      vatAmount: 51750,
      taxDeduction: 13800,
      netPayable: 382950,
      invoiceDate: '2026-02-15',
      dueDate: '2026-03-15',
      paidDate: '2026-03-10',
      status: 'paid',
      method: 'Bank Transfer — Dutch-Bangla Bank',
      transactionRef: 'TXN-DBBL-2026-04521',
      description: 'Emergency Tarpaulin & Hygiene Kits',
      approvalChain: [
        { stage: 'PRF Initiated', status: 'done', date: '2026-02-16' },
        { stage: 'Supervisor Endorsed', status: 'done', date: '2026-02-17' },
        { stage: 'Finance Verified', status: 'done', date: '2026-02-19' },
        { stage: 'HoF Approved', status: 'done', date: '2026-02-20' },
        { stage: 'Treasury Processed', status: 'done', date: '2026-03-08' },
        { stage: 'Paid', status: 'done', date: '2026-03-10' },
      ],
      notifications: [
        {
          type: 'Payment Completed',
          date: '2026-03-10',
          message: 'Payment of ৳3.83L credited to your account via Bank Transfer',
        },
        {
          type: 'Treasury Processing',
          date: '2026-03-08',
          message: 'Your payment is being processed by treasury',
        },
        { type: 'PRF Approved', date: '2026-02-20', message: 'PRF approved by Head of Finance' },
      ],
    },
    {
      id: 'PAY-AAB-2026-028',
      prfId: 'PRF-AAB-2026-012',
      woId: 'WO-AAB-2026-018',
      poId: 'PO-AAB-2026-018',
      invoiceNo: 'INV-TBS-2026-045',
      grossAmount: 485000,
      vatAmount: 72750,
      taxDeduction: 19400,
      netPayable: 538350,
      invoiceDate: '2026-04-01',
      dueDate: '2026-05-01',
      paidDate: null,
      status: 'processing',
      method: 'Bank Transfer — Dutch-Bangla Bank',
      transactionRef: null,
      description: 'IT Equipment — Laptops & Networking',
      approvalChain: [
        { stage: 'PRF Initiated', status: 'done', date: '2026-04-03' },
        { stage: 'Supervisor Endorsed', status: 'done', date: '2026-04-04' },
        { stage: 'Finance Verified', status: 'done', date: '2026-04-06' },
        { stage: 'CD Approved', status: 'done', date: '2026-04-08' },
        { stage: 'Treasury Processing', status: 'current', date: '2026-04-10' },
        { stage: 'Payment', status: 'pending', date: null },
      ],
      notifications: [
        {
          type: 'Treasury Processing',
          date: '2026-04-10',
          message: 'Payment forwarded to treasury for processing',
        },
        {
          type: 'PRF Approved',
          date: '2026-04-08',
          message: 'PRF approved by Country Director (amount ≥ ৳5L)',
        },
        {
          type: 'PRF Created',
          date: '2026-04-03',
          message: 'Payment request PRF-AAB-2026-012 initiated for your invoice',
        },
      ],
    },
    {
      id: 'PAY-AAB-2026-030',
      prfId: 'PRF-AAB-2026-013',
      woId: 'WO-AAB-2026-015',
      poId: 'PO-AAB-2026-015',
      invoiceNo: 'INV-DOM-2026-078',
      grossAmount: 125000,
      vatAmount: 18750,
      taxDeduction: 5000,
      netPayable: 138750,
      invoiceDate: '2026-04-05',
      dueDate: '2026-05-05',
      paidDate: null,
      status: 'pending-approval',
      method: 'Bank Transfer',
      transactionRef: null,
      description: 'Office Stationery & Supplies',
      approvalChain: [
        { stage: 'PRF Initiated', status: 'done', date: '2026-04-06' },
        { stage: 'Supervisor Endorsement', status: 'current', date: null },
        { stage: 'Finance Verification', status: 'pending', date: null },
        { stage: 'HoF Approval', status: 'pending', date: null },
        { stage: 'Treasury', status: 'pending', date: null },
        { stage: 'Payment', status: 'pending', date: null },
      ],
      notifications: [
        {
          type: 'PRF Created',
          date: '2026-04-06',
          message: 'Payment request PRF-AAB-2026-013 initiated for your invoice',
        },
      ],
    },
    {
      id: 'PAY-AAB-2026-022',
      prfId: 'PRF-AAB-2026-006',
      woId: 'WO-AAB-2026-008',
      poId: 'PO-AAB-2026-008',
      invoiceNo: 'INV-GML-2026-019',
      grossAmount: 215000,
      vatAmount: 32250,
      taxDeduction: 8600,
      netPayable: 238650,
      invoiceDate: '2026-01-20',
      dueDate: '2026-02-20',
      paidDate: '2026-02-15',
      status: 'paid',
      method: 'Cheque — CHQ-AAB-2026-0089',
      transactionRef: 'CHQ-AAB-2026-0089',
      description: 'First Aid Kits & Medical Supplies',
      approvalChain: [
        { stage: 'PRF Initiated', status: 'done', date: '2026-01-22' },
        { stage: 'Supervisor Endorsed', status: 'done', date: '2026-01-23' },
        { stage: 'Finance Verified', status: 'done', date: '2026-01-25' },
        { stage: 'HoF Approved', status: 'done', date: '2026-01-27' },
        { stage: 'Treasury Processed', status: 'done', date: '2026-02-12' },
        { stage: 'Paid', status: 'done', date: '2026-02-15' },
      ],
      notifications: [
        {
          type: 'Payment Completed',
          date: '2026-02-15',
          message: 'Payment of ৳2.39L via cheque has been dispatched',
        },
        { type: 'PRF Approved', date: '2026-01-27', message: 'PRF approved by Head of Finance' },
      ],
    },
    {
      id: 'PAY-AAB-2026-033',
      prfId: 'PRF-AAB-2026-014',
      woId: 'WO-AAB-2026-012',
      poId: 'PO-AAB-2026-012',
      invoiceNo: 'INV-BRC-2026-056',
      grossAmount: 875000,
      vatAmount: 65625,
      taxDeduction: 61250,
      netPayable: 879375,
      invoiceDate: '2026-04-08',
      dueDate: '2026-05-08',
      paidDate: null,
      status: 'pending-approval',
      method: 'Bank Transfer',
      transactionRef: null,
      description: 'Shelter Repair Works — Ukhiya Camp 4',
      approvalChain: [
        { stage: 'PRF Initiated', status: 'done', date: '2026-04-09' },
        { stage: 'Supervisor Endorsed', status: 'done', date: '2026-04-10' },
        { stage: 'Finance Verification', status: 'current', date: null },
        { stage: 'CD Approval', status: 'pending', date: null },
        { stage: 'Treasury', status: 'pending', date: null },
        { stage: 'Payment', status: 'pending', date: null },
      ],
      notifications: [
        {
          type: 'Endorsement Progressed',
          date: '2026-04-10',
          message: 'PRF endorsed by supervisor, now with Finance for verification',
        },
        {
          type: 'PRF Created',
          date: '2026-04-09',
          message: 'Payment request PRF-AAB-2026-014 initiated for your invoice',
        },
      ],
    },
  ];
  const totalEarned = payments.reduce((sum, p) => sum + p.netPayable, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.netPayable, 0);
  const pendingCount = payments.filter((p) => p.status === 'pending-approval').length;
  const processingCount = payments.filter((p) => p.status === 'processing').length;
  const getStatusBadge = (status) => {
    const config = {
      paid: { variant: 'success', icon: CheckCircle, label: 'Paid' },
      processing: { variant: 'warning', icon: Clock, label: 'Treasury Processing' },
      'pending-approval': { variant: 'default', icon: AlertCircle, label: 'In Approval' },
    };
    const { variant, icon: Icon, label } = config[status] || config['pending-approval'];
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Payment Status & PRF Tracking
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your invoices, PRF approval progress, and payment notifications — Ledars NGO
              </p>
            </div>
            <Link to="/vendor-portal/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Invoiced</p>
              <p className="text-2xl font-bold text-foreground">{formatBDT(totalEarned)}</p>
              <p className="text-xs text-muted-foreground mt-1">{payments.length} payments</p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Received</p>
              <p className="text-2xl font-bold text-success">{formatBDT(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter((p) => p.status === 'paid').length} paid
              </p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Treasury Processing</p>
              <p className="text-3xl font-bold text-warning">{processingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Being processed</p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">In Approval Chain</p>
              <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting endorsement</p>
            </CardBody>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader
            title="Payment & PRF History"
            description="Full payment lifecycle with approval tracking and notifications"
            action={
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Statement
              </Button>
            }
          />
          <CardBody>
            <div className="space-y-6">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`p-6 border-2 rounded-lg ${
                    payment.status === 'paid'
                      ? 'border-success/20 bg-success/5'
                      : payment.status === 'processing'
                        ? 'border-warning/20 bg-warning/5'
                        : 'border-border'
                  }`}
                >
                  {/* Payment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          payment.status === 'paid'
                            ? 'bg-success/10'
                            : payment.status === 'processing'
                              ? 'bg-warning/10'
                              : 'bg-muted'
                        }`}
                      >
                        <Banknote
                          className={`w-7 h-7 ${
                            payment.status === 'paid'
                              ? 'text-success'
                              : payment.status === 'processing'
                                ? 'text-warning'
                                : 'text-foreground'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {formatBDT(payment.netPayable)}
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono">{payment.prfId}</span>
                          <span>•</span>
                          <span>Invoice: {payment.invoiceNo}</span>
                          <span>•</span>
                          <span>WO: {payment.woId}</span>
                          <span>•</span>
                          <span>PO: {payment.poId}</span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{payment.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-5 gap-4 p-4 bg-white rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gross Amount</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatBDT(payment.grossAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">VAT</p>
                      <p className="text-sm font-medium text-success">
                        +{formatBDT(payment.vatAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tax/AIT</p>
                      <p className="text-sm font-medium text-error">
                        -{formatBDT(payment.taxDeduction)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Invoice Date</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm font-medium">{payment.invoiceDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {payment.paidDate ? 'Paid Date' : 'Due Date'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm font-medium">{payment.paidDate || payment.dueDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* PRF Approval Chain — Full visibility for vendor */}
                  <div className="p-4 bg-white rounded-lg mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      PRF Approval Progress
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {payment.approvalChain.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              step.status === 'done'
                                ? 'bg-success/10 text-success'
                                : step.status === 'current'
                                  ? 'bg-warning/20 text-warning font-bold border border-warning'
                                  : 'bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            {step.status === 'done' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : step.status === 'current' ? (
                              <Clock className="w-3 h-3 animate-pulse" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                            )}
                            {step.stage}
                          </div>
                          {idx < payment.approvalChain.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Messages */}
                  {payment.status === 'paid' && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <p className="text-sm font-medium text-foreground">
                          Payment completed on {payment.paidDate} — {payment.method}
                        </p>
                      </div>
                      {payment.transactionRef && (
                        <p className="text-xs text-muted-foreground ml-6 mt-1">
                          Ref: {payment.transactionRef}
                        </p>
                      )}
                    </div>
                  )}

                  {payment.status === 'processing' && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        <p className="text-sm font-medium text-foreground">
                          Payment is being processed by Treasury. Expected: 3-5 working days.
                        </p>
                      </div>
                    </div>
                  )}

                  {payment.status === 'pending-approval' && (
                    <div className="p-3 bg-muted border border-border rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          PRF is progressing through the Authority Matrix approval chain.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recent Notifications */}
                  {payment.notifications.length > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Recent Notifications
                      </p>
                      <div className="space-y-1.5">
                        {payment.notifications.slice(0, 2).map((notif, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <Bell className="w-3 h-3 text-primary mt-0.5" />
                            <div>
                              <span className="font-medium text-foreground">{notif.type}</span>
                              <span className="text-muted-foreground"> — {notif.message}</span>
                              <span className="text-muted-foreground ml-2">({notif.date})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      View Invoice
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      {payment.status === 'paid' ? 'Download Receipt' : 'Download PRF'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
