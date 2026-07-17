'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Ban, Save, Upload, ArrowLeft, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../../components/ui/button';
import { useVendorBlacklistMutations } from './use-vendor-api';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function BlacklistRequest() {
  const { createBlacklist, isMutating } = useVendorBlacklistMutations();
  const [selectedVendor, setSelectedVendor] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const handleSubmit = () => {
    createBlacklist({ supplier: selectedVendor, reason, category });
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.vendors.blacklist}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Blacklist
        </Link>
        <div className="flex items-center gap-3">
          <Ban className="w-6 h-6 text-destructive" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              New Blacklist Request
            </h1>
            <p className="text-muted-foreground">Submit a vendor blacklisting request for review</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Vendor Selection */}
          <Card>
            <CardHeader
              title="Vendor Information"
              description="Select the vendor to be blacklisted"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vendor *</label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Search and select vendor...</option>
                    <option value="VND-022">ABC Supplies International (VND-022)</option>
                    <option value="VND-031">QuickBuild Construction (VND-031)</option>
                    <option value="VND-018">Metro Medical Supplies (VND-018)</option>
                    <option value="VND-027">Riverside Logistics (VND-027)</option>
                    <option value="VND-035">Global Tech Partners (VND-035)</option>
                  </select>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Vendor Summary (auto-populated on selection)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Contracts</p>
                      <p className="text-sm font-semibold">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total POs</p>
                      <p className="text-sm font-semibold">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Performance Score</p>
                      <p className="text-sm font-semibold">—</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Blacklist Details */}
          <Card>
            <CardHeader
              title="Blacklist Details"
              description="Provide justification and category"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select category...</option>
                    <option value="fraud">Fraud / Misrepresentation</option>
                    <option value="performance">Performance Failure</option>
                    <option value="quality">Quality Issues</option>
                    <option value="ethics">Ethics Violation</option>
                    <option value="coi">Conflict of Interest</option>
                    <option value="legal">Legal / Regulatory Issue</option>
                    <option value="financial">Financial Misconduct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Proposed Duration *
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select duration...</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Detailed Reason *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide a detailed description of the reason for blacklisting, including specific incidents, dates, and evidence..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Specific Incidents
                  </label>
                  <textarea
                    rows={3}
                    placeholder="List specific incidents with dates that support this request..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Impact Assessment */}
          <Card>
            <CardHeader
              title="Impact Assessment"
              description="Assess the impact of blacklisting this vendor"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Impact on Active Contracts
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe impact on any active contracts or pending orders..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Alternative Vendor Availability
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select...</option>
                    <option value="multiple">Multiple alternatives available</option>
                    <option value="limited">Limited alternatives</option>
                    <option value="sole">Sole source — may require emergency procurement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Recommended Mitigation Actions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Steps to mitigate impact on operations..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader
              title="Supporting Evidence"
              description="Upload documents supporting the blacklist request"
            />
            <CardBody>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">
                  Drop evidence files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Investigation reports, correspondence, quality test results, photos, etc.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, XLSX, JPG, PNG — Max 10MB each
                </p>
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
                <Button variant="primary" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  disabled={isMutating}
                  onClick={handleSubmit}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Requires Country Director approval
              </p>
            </CardBody>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Blacklist Policy</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Blacklisting requires documented evidence</li>
                    <li>• Vendor must be notified in writing</li>
                    <li>• Vendor has 14 days to respond / appeal</li>
                    <li>• Permanent blacklisting requires board approval</li>
                    <li>• All active contracts must be reviewed</li>
                    <li>• Blacklist is shared across all AAB offices</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Approval Workflow" />
            <CardBody>
              <div className="space-y-3">
                {[
                  { step: 1, label: 'Procurement Officer submits request', status: 'current' },
                  { step: 2, label: 'Procurement Committee reviews', status: 'pending' },
                  { step: 3, label: 'Country Director approves', status: 'pending' },
                  { step: 4, label: 'Vendor notified (14-day appeal)', status: 'pending' },
                  { step: 5, label: 'Blacklist activated', status: 'pending' },
                ].map((step) => (
                  <div key={step.step} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step.status === 'current' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {step.step}
                    </div>
                    <span
                      className={`text-sm ${step.status === 'current' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                    >
                      {step.label}
                    </span>
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
