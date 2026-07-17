import { Link, useParams } from 'react-router';
import {
  Clock,
  MapPin,
  Package,
  FileText,
  Calendar,
  Download,
  ArrowLeft,
  DollarSign,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockRFQDetail = {
  id: 'RFQ-2026-045',
  title: 'Emergency Tarpaulins Supply (200 pcs)',
  category: 'Relief Supplies',
  publishedDate: '2026-04-01',
  closingDate: '2026-04-10',
  status: 'open',
  office: 'Ukhiya Field Office',
  deliveryLocation: "Ukhiya Central Warehouse, Ukhiya, Cox's Bazar",
  deliveryDeadline: '2026-04-25',
  paymentTerms: 'Net 30 after delivery & inspection',
  contactPerson: 'Procurement Unit, Ledars NGO',
  description:
    "Ledars NGO seeks quotations from qualified suppliers for the supply of emergency tarpaulins and related relief materials for the Rohingya refugee response program in Cox's Bazar district.",
  requirements: [
    'All materials must comply with SPHERE standards',
    'Vendor must have at least 2 years experience in relief supply',
    'Previous experience supplying humanitarian organizations preferred',
    'Delivery within 15 working days of purchase order',
    'All items subject to quality inspection at delivery point',
  ],
  items: [
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
  ],
  documents: [
    { name: 'RFQ-2026-045-Full-Document.pdf', size: '245 KB' },
    { name: 'Technical-Specifications.pdf', size: '128 KB' },
    { name: 'Terms-and-Conditions.pdf', size: '92 KB' },
  ],
};
export function VendorPortalRFQDetail() {
  const { id } = useParams();
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          to="/vendor-portal/rfqs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to RFQs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">{mockRFQDetail.id}</h1>
              <Badge variant="success">Open for Bidding</Badge>
              <Badge variant="outline">{mockRFQDetail.category}</Badge>
            </div>
            <p className="text-lg text-foreground">{mockRFQDetail.title}</p>
          </div>
          <Link to={`/vendor-portal/rfqs/${mockRFQDetail.id}/submit`}>
            <Button variant="primary" size="lg">
              Submit Quotation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader title="RFQ Description" />
            <CardBody>
              <p className="text-sm text-foreground leading-relaxed">{mockRFQDetail.description}</p>
            </CardBody>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader
              title="Required Items"
              description={`${mockRFQDetail.items.length} items requested`}
            />
            <CardBody>
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase w-10">#</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Description
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Specifications
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Unit
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockRFQDetail.items.map((item) => (
                    <tr key={item.no} className="border-b border-border">
                      <td className="py-3 pr-3 text-sm font-medium text-foreground">{item.no}</td>
                      <td className="py-3 pr-3 text-sm text-foreground">{item.description}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">{item.specs}</td>
                      <td className="py-3 pr-3 text-sm text-center">{item.unit}</td>
                      <td className="py-3 text-sm text-center font-medium">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader title="Vendor Requirements" />
            <CardBody>
              <ul className="space-y-2">
                {mockRFQDetail.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader title="RFQ Documents" description="Download the full RFQ package" />
            <CardBody>
              <div className="space-y-2">
                {mockRFQDetail.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
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
            <CardHeader title="Key Dates" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Published</p>
                    <p className="text-sm font-medium">{mockRFQDetail.publishedDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Closing Date</p>
                    <p className="text-sm font-semibold text-warning">
                      {mockRFQDetail.closingDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Deadline</p>
                    <p className="text-sm font-medium">{mockRFQDetail.deliveryDeadline}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Delivery Details" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Delivery Location</p>
                    <p className="text-sm font-medium">{mockRFQDetail.deliveryLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Terms</p>
                    <p className="text-sm font-medium">{mockRFQDetail.paymentTerms}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <CardBody>
              <p className="text-sm text-foreground">{mockRFQDetail.contactPerson}</p>
              <p className="text-xs text-muted-foreground mt-1">
                For queries, use the portal messaging system
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
