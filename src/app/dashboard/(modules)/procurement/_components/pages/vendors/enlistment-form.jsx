'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Save, Send, Upload, ArrowLeft, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../../components/ui/button';
import { useVendorEnlistmentMutations } from './use-vendor-api';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorEnlistmentForm() {
  const { createEnlistment, isMutating } = useVendorEnlistmentMutations();
  const [formData, setFormData] = useState({ company_name: '', status: 'pending-review' });
  const handleSubmit = () => {
    createEnlistment(formData);
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
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          New Vendor Enlistment Application
        </h1>
        <p className="text-muted-foreground">Submit a new vendor registration request</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader title="Company Information" description="Basic organization details" />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Legal registered name"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Trade License No. *
                    </label>
                    <input
                      type="text"
                      placeholder="License number"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      TIN (Tax Identification) *
                    </label>
                    <input
                      type="text"
                      placeholder="TIN number"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      BIN (VAT Registration)
                    </label>
                    <input
                      type="text"
                      placeholder="BIN number"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Year Established *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2015"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Annual Turnover (BDT)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 25,000,000"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Business Address *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Full registered address"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader title="Contact Person Details" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Contact person name"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="email@company.bd"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone *</label>
                  <input
                    type="tel"
                    placeholder="+880-XXXX-XXXXXX"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Supply Categories */}
          <Card>
            <CardHeader title="Supply Categories" description="Select all applicable categories" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Relief Supplies',
                  'Medical Equipment',
                  'Construction',
                  'IT & Equipment',
                  'Transport & Logistics',
                  'Stationery & Office',
                  'Food & Nutrition',
                  'WASH Supplies',
                  'Printing Services',
                  'Consultancy',
                  'Vehicle Maintenance',
                  'Furniture',
                ].map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                  >
                    <input type="checkbox" className="w-4 h-4 rounded border-border" />
                    <span className="text-sm text-foreground">{cat}</span>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader title="Bank Account Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brac Bank Ltd."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Branch</label>
                  <input
                    type="text"
                    placeholder="Branch name"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Account number"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    placeholder="Bank routing number"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader title="Required Documents" description="Upload supporting documentation" />
            <CardBody>
              <div className="space-y-3">
                {[
                  'Trade License (current year)',
                  'TIN Certificate',
                  'VAT Certificate (if applicable)',
                  'Company Profile / Portfolio',
                  'Bank Statement (last 6 months)',
                  'Previous Work References (min 2)',
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border"
                  >
                    <span className="text-sm text-foreground">{doc}</span>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={isMutating}
                  onClick={handleSubmit}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Enlistment Criteria</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Minimum 2 years in relevant business</li>
                    <li>• Valid trade license required</li>
                    <li>• TIN certificate mandatory</li>
                    <li>• At least 2 work references</li>
                    <li>• No blacklisting record with any NGO</li>
                    <li>• Company must not be owned by any ActionAid staff</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Review Process" />
            <CardBody>
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Application submitted' },
                  { step: 2, label: 'Document verification' },
                  { step: 3, label: 'Background check' },
                  { step: 4, label: 'Procurement review' },
                  { step: 5, label: 'Final approval / rejection' },
                ].map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {step.step}
                    </div>
                    <span className="text-sm text-muted-foreground">{step.label}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
