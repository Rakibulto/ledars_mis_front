'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Save, Calendar, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function ContractRenewal() {
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
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Contract Renewal</h1>
            <p className="text-muted-foreground">Renew contract {id} for a new term</p>
          </div>
        </div>
      </div>

      {/* Current Contract Summary */}
      <Card className="mb-6 border-primary/20">
        <CardHeader title="Expiring Contract Summary" />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Contract ID</p>
              <p className="text-sm font-medium">CNT-2026-001</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="text-sm font-medium">Emergency Relief Supply - Annual Framework</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vendor</p>
              <p className="text-sm font-medium">Cox's Bazar Relief Supplies Ltd</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current End</p>
              <p className="text-sm font-semibold text-orange-600">2027-01-14</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-sm font-semibold">৳4,500,000</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Performance Summary */}
      <Card className="mb-6">
        <CardHeader
          title="Vendor Performance Summary"
          description="Performance evaluation from the current contract period"
        />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-lg font-semibold text-green-700">92%</p>
              <p className="text-xs text-green-600">On-Time Delivery</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-lg font-semibold text-blue-700">95%</p>
              <p className="text-xs text-blue-600">Quality Rating</p>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <p className="text-lg font-semibold text-purple-700">88%</p>
              <p className="text-xs text-purple-600">Communication</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="text-lg font-semibold text-orange-700">63%</p>
              <p className="text-xs text-orange-600">Budget Utilized</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Renewal Details */}
          <Card>
            <CardHeader title="Renewal Details" description="Configure the new contract term" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Renewal Type *
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select renewal type...</option>
                    <option value="same-terms">Same Terms & Conditions</option>
                    <option value="revised-terms">Revised Terms</option>
                    <option value="new-scope">New Scope with Same Vendor</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      New Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        defaultValue="2027-01-15"
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      New End Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        defaultValue="2028-01-14"
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    New Contract Value (BDT) *
                  </label>
                  <input
                    type="number"
                    defaultValue="4500000"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Previous value: ৳4,500,000</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Updated Payment Terms
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="net30">Net 30 (current)</option>
                    <option value="net45">Net 45</option>
                    <option value="net60">Net 60</option>
                    <option value="monthly">Monthly</option>
                    <option value="milestone">Milestone-based</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Justification */}
          <Card>
            <CardHeader title="Renewal Justification" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Justification for Renewal *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Explain why renewal is recommended over re-tendering..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Change Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any changes from the original terms..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader title="Renewal Checklist" />
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: 'Vendor performance evaluation completed', checked: true },
                  { label: 'Market price comparison conducted', checked: false },
                  { label: 'Budget availability confirmed for new term', checked: true },
                  { label: 'Legal review of updated terms completed', checked: false },
                  { label: 'Procurement committee approval obtained', checked: false },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-4 h-4 rounded border-input"
                    />
                    <span className="text-sm text-foreground">{item.label}</span>
                    {item.checked && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                  </label>
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
                <Button variant="primary" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="success" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Submit Renewal
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border-warning/30 bg-warning/5">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Renewal Policy</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• Maximum 2 consecutive renewals allowed</li>
                    <li>• After 2 renewals, new competitive bidding required</li>
                    <li>• Value increase above 10% requires new procurement process</li>
                    <li>• Must initiate at least 30 days before expiry</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Renewal History" />
            <CardBody>
              <p className="text-sm text-muted-foreground text-center py-3">
                This is the first renewal for this contract
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
