'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Mail,
  Star,
  Phone,
  XCircle,
  FileText,
  Download,
  ArrowLeft,
  Building2,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { useVendorEnlistment, useVendorEnlistmentMutations } from './use-vendor-api';
export function VendorEnlistmentReview() {
  const { id } = useParams();
  const [rejectReason, setRejectReason] = useState('');
  const { data: apiData } = useVendorEnlistment({ pageSize: 1, search: id });
  const { approveEnlistment, rejectEnlistment, isMutating } = useVendorEnlistmentMutations();

  const results = Array.isArray(apiData?.results)
    ? apiData.results
    : Array.isArray(apiData)
      ? apiData
      : [];
  const raw =
    results.find((r) => String(r.id) === String(id) || r.enlistment_number === id) ||
    results[0] ||
    {};

  const app = {
    id: raw.enlistment_number || raw.id || id,
    companyName: raw.company_name || '',
    contactPerson: raw.contact_person || '',
    designation: raw.designation || '',
    email: raw.email || '',
    phone: raw.phone || '',
    address: raw.address || '',
    category: Array.isArray(raw.category) ? raw.category : raw.category ? [raw.category] : [],
    tin: raw.tin || '',
    bin: raw.bin || '',
    tradeLicense: raw.trade_license || '',
    yearEstablished: raw.years_in_business || '',
    annualTurnover: raw.annual_turnover || '',
    status: raw.status || '',
    submittedDate: raw.submitted_date || '',
    documents: Array.isArray(raw.documents)
      ? raw.documents.map((d) => ({
          name: d.doc_type || d.name || '',
          size: '',
          verified: d.review_status === 'verified',
          fileUrl: d.file_url || d.file || '',
        }))
      : [],
    references: Array.isArray(raw.references) ? raw.references : [],
    evaluationChecklist: Array.isArray(raw.checklist) ? raw.checklist : [],
    bank: {
      name: raw.bank_name || '',
      branch: raw.branch_name || '',
      account: raw.account_number || '',
      routing: raw.routing_number || '',
    },
    notes: raw.notes || '',
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.vendors.enlistment}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Enlistment
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {app.companyName}
              </h1>
              <Badge variant="warning">Pending Review</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Application: {app.id} • Submitted: {app.submittedDate}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={isMutating}
              onClick={() => rejectEnlistment(id, rejectReason || 'Rejected by reviewer')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button variant="success" disabled={isMutating} onClick={() => approveEnlistment(id)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader title="Company Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Company Name</p>
                  <p className="text-sm font-medium">{app.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trade License</p>
                  <p className="text-sm font-medium">{app.tradeLicense}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">TIN</p>
                  <p className="text-sm font-medium">{app.tin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">BIN (VAT)</p>
                  <p className="text-sm font-medium">{app.bin}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Year Established</p>
                  <p className="text-sm font-medium">{app.yearEstablished}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Annual Turnover</p>
                  <p className="text-sm font-medium">{app.annualTurnover}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employees</p>
                  <p className="text-sm font-medium">{app.employees}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <div className="flex gap-1 mt-0.5">
                    {app.category.map((c) => (
                      <Badge key={c} variant="outline" size="sm">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{app.address}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader title="Bank Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="text-sm font-medium">{app.bank.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium">{app.bank.branch}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-sm font-medium">{app.bank.account}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Routing Number</p>
                  <p className="text-sm font-medium">{app.bank.routing}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* References */}
          <Card>
            <CardHeader title="Work References" />
            <CardBody>
              <div className="space-y-3">
                {app.references.map((ref, idx) => (
                  <div key={idx} className="p-4 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{ref.org}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{ref.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{ref.project}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contract Value: {ref.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader title="Submitted Documents" />
            <CardBody>
              <div className="space-y-2">
                {app.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.verified ? (
                        <Badge variant="success" size="sm">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          Pending
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Contact Person" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{app.contactPerson}</p>
                    <p className="text-xs text-muted-foreground">{app.designation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{app.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{app.phone}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Evaluation Checklist */}
          <Card>
            <CardHeader title="Evaluation Checklist" />
            <CardBody>
              <div className="space-y-2">
                {app.evaluationChecklist.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 rounded border-border"
                    />
                    <span
                      className={`text-sm ${item.checked ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {item.item}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {app.evaluationChecklist.filter((i) => i.checked).length} of{' '}
                    {app.evaluationChecklist.length} verified
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Reviewer Notes" />
            <CardBody>
              <textarea
                rows={4}
                placeholder="Add evaluation notes..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              />
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Save Notes
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
