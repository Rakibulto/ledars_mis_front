'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Save, Upload, FileText, Calendar, ArrowLeft, DollarSign } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function ContractCreate() {
  const [contractType, setContractType] = useState('');
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.contracts.root}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Contracts
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Create New Contract
        </h1>
        <p className="text-muted-foreground">
          Create a new contract from an approved award or standalone
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader title="Contract Details" description="Basic contract information" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Contract Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Emergency Relief Supply - Annual Framework"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Contract Type *
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select type...</option>
                      <option value="framework">Framework Agreement</option>
                      <option value="fixed">Fixed-Price</option>
                      <option value="sla">Service Level Agreement</option>
                      <option value="po">Purchase Order</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select category...</option>
                      <option value="goods">Goods</option>
                      <option value="services">Services</option>
                      <option value="works">Works</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Linked Award Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWD-2026-012"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Office *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select office...</option>
                      <option value="dhk">Dhaka Head Office</option>
                      <option value="cxb">Cox's Bazar Sadar Office</option>
                      <option value="ukh">Ukhiya Field Office</option>
                      <option value="tkn">Teknaf Field Office</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vendor */}
          <Card>
            <CardHeader title="Vendor Information" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Vendor *</label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Search or select vendor...</option>
                    <option value="VND-001">Cox's Bazar Relief Supplies Ltd</option>
                    <option value="VND-005">National Builders Co.</option>
                    <option value="VND-009">TechServe Solutions</option>
                    <option value="VND-012">HealthFirst Bangladesh</option>
                    <option value="VND-015">Desh Transport Services</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Vendor Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Primary contact name"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Financial */}
          <Card>
            <CardHeader title="Financial Details" />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Contract Value (BDT) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Payment Terms *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select terms...</option>
                      <option value="net30">Net 30</option>
                      <option value="net45">Net 45</option>
                      <option value="net60">Net 60</option>
                      <option value="monthly">Monthly</option>
                      <option value="milestone">Milestone-based</option>
                      <option value="advance">Advance Payment</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      End Date *
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
              </div>
            </CardBody>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader title="Terms & Conditions" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Scope of Work *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the scope of work, deliverables, and expectations..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Special Conditions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any special terms, penalty clauses, or conditions..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader title="Attachments" />
            <CardBody>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">
                  Drop contract documents here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, DOCX, XLSX up to 10MB each
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-3">
                <Button variant="primary" className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button variant="success" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Guidelines" />
            <CardBody>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    1
                  </div>
                  <p>Link to an approved award when creating from procurement cycle</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    2
                  </div>
                  <p>Contracts above ৳5M require Country Director approval</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    3
                  </div>
                  <p>Upload signed contract PDF before finalization</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    4
                  </div>
                  <p>Framework agreements must include maximum value ceiling</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
