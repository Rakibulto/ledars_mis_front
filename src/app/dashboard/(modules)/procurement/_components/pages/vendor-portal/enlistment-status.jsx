import { Tag, Shield, Upload, FileText, Building2, CheckCircle, AlertCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorEnlistmentStatus() {
  const enlistment = {
    vendorId: 'V001',
    companyName: 'TechBD Solutions Ltd',
    currentYear: '2025-2026',
    status: 'active',
    applicationDate: '2025-07-15',
    approvedDate: '2025-08-02',
    nextRenewal: '2026-07-01',
    daysToRenewal: 88,
  };
  const steps = [
    {
      step: 1,
      label: 'Application Submitted',
      status: 'completed',
      date: '2025-07-15',
      note: 'Online registration form completed with all required fields',
    },
    {
      step: 2,
      label: 'Compliance Documents Uploaded',
      status: 'completed',
      date: '2025-07-15',
      note: 'Trade License, VAT BIN, TIN, Tax Compliance, Bank Solvency, Company Profile, RJSC Certificate',
    },
    {
      step: 3,
      label: 'Admin Verification',
      status: 'completed',
      date: '2025-07-25',
      note: 'Documents verified by Procurement Unit. Verified by: Md. Rafiqul Islam',
    },
    {
      step: 4,
      label: 'Category Assignment',
      status: 'completed',
      date: '2025-07-28',
      note: 'Assigned: IT Equipment, Computer Hardware, Networking, Software & Licensing, Office Equipment',
    },
    {
      step: 5,
      label: 'Approval & Activation',
      status: 'completed',
      date: '2025-08-02',
      note: 'Approved by Head of Procurement. Enlistment Year: 2025-2026',
    },
  ];
  const documents = [
    { name: 'Trade License', status: 'valid', expiry: '2026-06-30', daysLeft: 87 },
    { name: 'VAT BIN Certificate', status: 'valid', expiry: null, daysLeft: null },
    { name: 'TIN Certificate', status: 'valid', expiry: null, daysLeft: null },
    { name: 'Tax Compliance Certificate', status: 'expiring', expiry: '2026-06-28', daysLeft: 85 },
    { name: 'Bank Solvency Certificate', status: 'valid', expiry: '2026-07-15', daysLeft: 102 },
    { name: 'Company Profile', status: 'valid', expiry: null, daysLeft: null },
    { name: 'RJSC Certificate', status: 'valid', expiry: null, daysLeft: null },
  ];
  const categories = [
    'IT Equipment',
    'Computer Hardware',
    'Networking',
    'Software & Licensing',
    'Office Equipment',
  ];
  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-foreground">Enlistment Status</h1>
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
          <Badge variant="primary" size="sm">
            {enlistment.currentYear}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Your vendor enlistment status and renewal information
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Current Enlistment Summary */}
          <Card className="border-l-4 border-l-green-500">
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Enlistment Year: {enlistment.currentYear}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Application: {enlistment.applicationDate} &middot; Approved:{' '}
                    {enlistment.approvedDate}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Next Renewal Due:{' '}
                    <span className="font-semibold text-orange-600">{enlistment.nextRenewal}</span>{' '}
                    ({enlistment.daysToRenewal} days remaining)
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="success">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified &amp; Active
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Enlistment Workflow Timeline */}
          <Card>
            <CardHeader
              title="Enlistment Workflow"
              description="Complete verification process for your enlistment"
            />
            <CardBody>
              <div className="space-y-0">
                {steps.map((s, i) => (
                  <div key={s.step} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : s.status === 'in-progress'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {s.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : s.step}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${s.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}`}
                        />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">
                          Step {s.step}: {s.label}
                        </h4>
                        <Badge
                          variant={
                            s.status === 'completed'
                              ? 'success'
                              : s.status === 'in-progress'
                                ? 'info'
                                : 'default'
                          }
                          size="sm"
                        >
                          {s.status === 'completed'
                            ? 'Completed'
                            : s.status === 'in-progress'
                              ? 'In Progress'
                              : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
                      {s.date && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Date: {s.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Compliance Documents */}
          <Card>
            <CardHeader
              title="Compliance Documents"
              description="Required documents for annual enlistment"
            />
            <CardBody>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold">Document</th>
                      <th className="px-4 py-3 text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold">Expiry</th>
                      <th className="px-4 py-3 text-xs font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={doc.status === 'valid' ? 'success' : 'warning'} size="sm">
                            {doc.status === 'valid' ? 'Valid' : 'Expiring Soon'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {doc.expiry || '\u2014'}
                          {doc.daysLeft && doc.daysLeft <= 90 && (
                            <span className="ml-2 text-orange-600 text-xs font-semibold">
                              ({doc.daysLeft}d left)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {doc.status === 'expiring' ? (
                            <Button variant="primary" size="sm">
                              <Upload className="w-3 h-3 mr-1" />
                              Renew
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <FileText className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Categories */}
          <Card>
            <CardHeader
              title="Assigned Categories"
              description="You receive RFQs in these categories"
            />
            <CardBody>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{cat}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                To change categories, contact the procurement team.
              </p>
            </CardBody>
          </Card>

          {/* Renewal Info */}
          <Card className="border-l-4 border-l-orange-500">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Annual Renewal</h4>
                  <p className="text-xs text-muted-foreground">
                    Enlistment is annual. You must renew by{' '}
                    <span className="font-semibold">{enlistment.nextRenewal}</span> to maintain
                    active status. Ensure all compliance documents are updated before renewal.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    Apply for Renewal
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Enlistment Requirements */}
          <Card>
            <CardHeader title="Enlistment Requirements" />
            <CardBody>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  Valid Trade License
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  VAT Registration (BIN)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  TIN Certificate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  Tax Compliance Certificate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  Bank Solvency Certificate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  Company Profile / Brochure
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  RJSC Registration Certificate
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                  Bank Account Information
                </li>
              </ul>
            </CardBody>
          </Card>

          {/* Help */}
          <Card>
            <CardBody>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Need Help?</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Contact Procurement Unit:
                    <br />
                    procurement@actionaid.org.bd
                    <br />
                    +880 2-9876543
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
