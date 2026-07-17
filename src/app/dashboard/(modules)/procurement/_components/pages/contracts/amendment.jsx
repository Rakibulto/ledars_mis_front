'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Save, FileText, Calendar, ArrowLeft, DollarSign, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function ContractAmendment() {
  const { id } = useParams();
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.contracts.detail(id)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contract {id}
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Contract Amendment
        </h1>
        <p className="text-muted-foreground">Create an amendment for contract {id}</p>
      </div>

      {/* Current Contract Summary */}
      <Card className="mb-6 border-primary/20">
        <CardHeader title="Current Contract Summary" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Contract</p>
              <p className="text-sm font-medium">CNT-2026-001</p>
              <p className="text-xs text-foreground mt-0.5">
                Emergency Relief Supply - Annual Framework
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendor</p>
              <p className="text-sm font-medium">Cox's Bazar Relief Supplies Ltd</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-sm font-semibold text-foreground">৳4,500,000</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current End Date</p>
              <p className="text-sm font-medium">2027-01-14</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Amendment Type */}
          <Card>
            <CardHeader title="Amendment Details" description="Specify the changes to be made" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Amendment Type *
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select amendment type...</option>
                    <option value="value-increase">Value Increase</option>
                    <option value="value-decrease">Value Decrease</option>
                    <option value="scope-change">Scope Change</option>
                    <option value="timeline-extension">Timeline Extension</option>
                    <option value="terms-change">Terms Modification</option>
                    <option value="vendor-change">Vendor Detail Change</option>
                    <option value="combined">Combined Changes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason for Amendment *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide detailed justification for the amendment..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Value Changes */}
          <Card>
            <CardHeader title="Value Adjustment" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current Value (BDT)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value="4,500,000"
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-secondary/50 text-muted-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    New Value (BDT)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="Enter new value"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Timeline Changes */}
          <Card>
            <CardHeader title="Timeline Adjustment" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Current End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value="2027-01-14"
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-secondary/50 text-muted-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    New End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Scope Changes */}
          <Card>
            <CardHeader title="Scope Changes" />
            <CardBody>
              <textarea
                rows={4}
                placeholder="Describe any changes to the scope of work, deliverables, or expectations..."
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
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
                <Button variant="success" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Amendment Policy</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Value increases above 20% require CD approval</li>
                    <li>• Maximum 3 amendments per contract</li>
                    <li>• Timeline extensions cannot exceed 50% of original duration</li>
                    <li>• All amendments require procurement committee review</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Previous Amendments" />
            <CardBody>
              <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">AMD-001</span>
                  <Badge variant="success" size="sm">
                    Approved
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Value increased from ৳4.0M to ৳4.5M</p>
                <p className="text-xs text-muted-foreground mt-1">2026-03-15</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
