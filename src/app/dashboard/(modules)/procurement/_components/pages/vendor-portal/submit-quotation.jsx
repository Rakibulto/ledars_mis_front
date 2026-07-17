import { useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Save,
  Upload,
  Shield,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const rfqItems = [
  {
    no: 1,
    description: 'Heavy-duty Tarpaulin (4m x 6m), UV-treated, waterproof',
    unit: 'Piece',
    qty: 200,
    specs: 'Weight: min 200gsm, Color: Blue/White',
  },
  {
    no: 2,
    description: 'Nylon Rope, 12mm diameter, 50m rolls',
    unit: 'Roll',
    qty: 100,
    specs: 'Breaking strength: min 500kg',
  },
  {
    no: 3,
    description: 'Steel Ground Pegs, 30cm length',
    unit: 'Set of 10',
    qty: 50,
    specs: 'Galvanized steel, rust-resistant',
  },
];
export function VendorPortalSubmitQuotation() {
  const { id } = useParams();
  const [agreed, setAgreed] = useState(false);
  const [activeSection, setActiveSection] = useState('technical');
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to={`/vendor-portal/rfqs/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to RFQ
        </Link>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Submit Proposal</h1>
            <p className="text-muted-foreground">
              RFQ: {id || 'RFQ-2026-045'} &mdash; Emergency Tarpaulins Supply
            </p>
          </div>
          <Badge variant="info" size="sm">
            <Shield className="w-3 h-3 mr-1" />
            Two-Envelope System
          </Badge>
        </div>
      </div>

      {/* Two-Envelope Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Two-Envelope Submission (Technical &amp; Financial)
            </p>
            <p className="text-xs text-blue-700 mt-1">
              As per AAB procurement policy, proposals are submitted in two separate envelopes. The
              Technical Proposal is evaluated first. Only technically qualified vendors&apos;
              Financial Proposals are opened and evaluated.
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSection('technical')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === 'technical' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 1: Technical Proposal
          </button>
          <button
            onClick={() => setActiveSection('financial')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeSection === 'financial' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Envelope 2: Financial Proposal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* TECHNICAL PROPOSAL */}
          {activeSection === 'technical' && (
            <>
              <Card>
                <CardHeader
                  title="Technical Proposal"
                  description="Company qualifications, methodology, and compliance with specifications"
                />
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Company Experience &amp; Capability Statement{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describe your company's experience with similar projects, capacity to deliver the required quantities, and relevant past performance with Ledars NGO or similar organizations..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Technical Methodology / Approach <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe your approach to fulfilling this order: sourcing, quality control, packaging, delivery logistics..."
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Compliance with Technical Specifications
                      </label>
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr className="text-left">
                              <th className="px-4 py-2 text-xs font-semibold">#</th>
                              <th className="px-4 py-2 text-xs font-semibold">Item Name</th>
                              <th className="px-4 py-2 text-xs font-semibold">Required Specs</th>
                              <th className="px-4 py-2 text-xs font-semibold">
                                Your Offered Specs
                              </th>
                              <th className="px-4 py-2 text-xs font-semibold text-center">
                                Compliant?
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rfqItems.map((item) => (
                              <tr key={item.no} className="border-t border-border">
                                <td className="px-4 py-2 text-sm">{item.no}</td>
                                <td className="px-4 py-2 text-sm">
                                  {item.name || item.description}
                                </td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">
                                  {item.specs}
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    placeholder="Your specification"
                                    className="w-full px-2 py-1 text-sm border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <select className="px-2 py-1 text-xs border border-input rounded">
                                    <option>Yes</option>
                                    <option>Partial</option>
                                    <option>No</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Delivery Lead Time (days) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 15"
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Warranty Period
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12 months"
                          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="Technical Documents Upload"
                  description="Upload supporting evidence for your technical proposal"
                />
                <CardBody>
                  <div className="space-y-3">
                    {[
                      'Product Catalog / Brochure',
                      'Quality Test Certificates',
                      'Past Performance References (min 2)',
                      'Company Registration / Relevant Licences',
                    ].map((doc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="border-2 border-dashed border-border rounded px-4 py-1.5 text-xs text-muted-foreground cursor-pointer hover:border-primary/30">
                            <Upload className="w-3 h-3 inline mr-1" />
                            Upload
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* FINANCIAL PROPOSAL */}
          {activeSection === 'financial' && (
            <>
              <Card>
                <CardHeader
                  title="Financial Proposal &mdash; Item Pricing"
                  description="All prices in BDT, inclusive of applicable VAT/Tax"
                />
                <CardBody>
                  <table className="w-full">
                    <thead className="border-b-2 border-border">
                      <tr className="text-left">
                        <th className="pb-3 text-xs font-semibold uppercase w-10">#</th>
                        <th className="pb-3 text-xs font-semibold uppercase">Item Name</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-center">Qty</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Unit Price (BDT)
                        </th>
                        <th className="pb-3 text-xs font-semibold uppercase text-right">
                          Total (BDT)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqItems.map((item) => (
                        <tr key={item.no} className="border-b border-border">
                          <td className="py-3 pr-3 text-sm font-medium">{item.no}</td>
                          <td className="py-3 pr-3">
                            <p className="text-sm text-foreground">
                              {item.name || item.description}
                            </p>
                            <p className="text-xs text-muted-foreground">{item.specs}</p>
                          </td>
                          <td className="py-3 pr-3 text-sm text-center">
                            {item.qty} {item.unit}
                          </td>
                          <td className="py-3 pr-3 text-right">
                            <input
                              type="number"
                              placeholder="0.00"
                              className="w-28 px-2 py-1.5 border border-input rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </td>
                          <td className="py-3 text-sm font-medium text-right text-muted-foreground">
                            &mdash;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border">
                      <tr>
                        <td colSpan={4} className="pt-3 text-sm font-semibold text-right">
                          Sub Total (BDT):
                        </td>
                        <td className="pt-3 text-sm font-semibold text-right">&mdash;</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-1 text-sm text-right text-muted-foreground">
                          VAT (if applicable):
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-1 text-sm text-right text-muted-foreground">
                          Transportation / Delivery Charge:
                        </td>
                        <td className="pt-1 text-sm text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-24 px-2 py-1 border border-input rounded text-right text-sm"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="pt-2 text-sm font-bold text-right">
                          Grand Total (BDT):
                        </td>
                        <td className="pt-2 text-sm font-bold text-right text-primary">&mdash;</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Payment &amp; Validity" />
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Quotation Validity (days) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 30"
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Payment Terms <span className="text-red-500">*</span>
                      </label>
                      <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>100% after delivery &amp; inspection</option>
                        <option>Net 30 after delivery</option>
                        <option>Net 15 after delivery</option>
                        <option>50% advance, 50% delivery</option>
                      </select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Additional Remarks" />
                <CardBody>
                  <textarea
                    rows={3}
                    placeholder="Any conditions, discounts for early payment, bulk pricing notes..."
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </CardBody>
              </Card>
            </>
          )}

          {/* Declaration */}
          <Card>
            <CardBody>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground leading-relaxed">
                  I hereby confirm that the information in both the Technical and Financial
                  proposals are accurate, the goods/services meet the stated specifications, and I
                  accept the terms and conditions outlined in the RFQ document. I understand that
                  Ledars NGO reserves the right to accept or reject any proposal.
                </span>
              </label>
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
                <Button variant="primary" className="w-full" disabled={!agreed}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Proposal
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Both technical &amp; financial envelopes will be submitted together
              </p>
            </CardBody>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">Important Notes</p>
                  <ul className="text-xs text-orange-700 space-y-1.5">
                    <li>&bull; Technical proposal must NOT include pricing</li>
                    <li>&bull; All prices in BDT, inclusive of taxes</li>
                    <li>&bull; Delivery cost should be declared separately</li>
                    <li>&bull; Late submissions will not be accepted</li>
                    <li>&bull; Once submitted, proposal cannot be modified</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="RFQ Summary" />
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RFQ ID</span>
                  <span className="font-medium">RFQ-2026-045</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="default" size="sm">
                    Relief Supplies
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Date</span>
                  <span className="font-semibold text-orange-600">2026-04-10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery By</span>
                  <span className="font-medium">2026-04-25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Office</span>
                  <span className="font-medium">Ukhiya, Cox&apos;s Bazar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">Two-Envelope</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Submission Checklist" />
            <CardBody>
              <div className="space-y-2">
                {[
                  'Technical capability statement',
                  'Spec compliance table filled',
                  'Technical documents uploaded',
                  'Unit prices entered (financial)',
                  'VAT/delivery charges declared',
                  'Declaration accepted',
                ].map((item, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-border" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
