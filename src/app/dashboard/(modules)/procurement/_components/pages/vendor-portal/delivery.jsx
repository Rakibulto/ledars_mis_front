import { useState } from 'react';
import { Link } from 'react-router';
import { Clock, Truck, Image, Upload, Package, FileText, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorDelivery() {
  const [selectedWO, setSelectedWO] = useState(null);
  const deliveryTasks = [
    {
      woId: 'WO-2024-015',
      title: 'IT Equipment Purchase',
      deliveryDate: '2024-03-30',
      status: 'pending-upload',
      items: 12,
      documentsRequired: [
        'Delivery Note',
        'Invoice',
        'Quality Certificate',
        'Photos of Delivered Items',
      ],
    },
    {
      woId: 'WO-2024-012',
      title: 'Office Supplies',
      deliveryDate: '2024-03-25',
      status: 'uploaded',
      items: 8,
      documentsRequired: ['Delivery Note', 'Invoice'],
      uploadedDocs: 2,
    },
  ];
  const uploadedDocuments = [
    {
      id: 1,
      name: 'Delivery Note - WO-2024-012.pdf',
      uploadDate: '2024-03-20',
      status: 'approved',
      type: 'delivery-note',
    },
    {
      id: 2,
      name: 'Invoice - WO-2024-012.pdf',
      uploadDate: '2024-03-20',
      status: 'approved',
      type: 'invoice',
    },
    {
      id: 3,
      name: 'Quality Certificate.pdf',
      uploadDate: '2024-03-18',
      status: 'pending',
      type: 'certificate',
    },
  ];
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Delivery Documents</h1>
              <p className="text-sm text-muted-foreground">Upload delivery documentation</p>
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
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Pending Deliveries */}
            <Card>
              <CardHeader
                title="Pending Document Upload"
                description="Work orders requiring delivery documents"
              />
              <CardBody>
                <div className="space-y-4">
                  {deliveryTasks.map((task) => (
                    <div
                      key={task.woId}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedWO === task.woId
                          ? 'border-primary bg-primary/5'
                          : task.status === 'pending-upload'
                            ? 'border-error/50 bg-error/5 hover:border-error'
                            : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedWO(task.woId)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${task.status === 'pending-upload' ? 'bg-error/10' : 'bg-success/10'}`}
                          >
                            <Truck
                              className={`w-6 h-6 ${task.status === 'pending-upload' ? 'text-error' : 'text-success'}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">Work Order: {task.woId}</p>
                          </div>
                        </div>
                        <Badge variant={task.status === 'pending-upload' ? 'error' : 'success'}>
                          {task.status === 'pending-upload' ? 'Documents Required' : 'Uploaded'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                          <p className="text-sm font-medium text-foreground">{task.deliveryDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Items</p>
                          <p className="text-sm font-medium text-foreground">{task.items} items</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-medium text-foreground mb-2">
                          Required Documents:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.documentsRequired.map((doc, index) => (
                            <Badge key={index} variant="default" size="sm">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Upload Section */}
            {selectedWO && (
              <Card>
                <CardHeader
                  title="Upload Documents"
                  description={`Upload files for ${selectedWO}`}
                />
                <CardBody>
                  <div className="space-y-4">
                    {/* Delivery Note */}
                    <div className="p-4 border-2 border-dashed border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Delivery Note</h4>
                          <Badge variant="error" size="sm">
                            Required
                          </Badge>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                      </div>
                    </div>

                    {/* Invoice */}
                    <div className="p-4 border-2 border-dashed border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Invoice</h4>
                          <Badge variant="error" size="sm">
                            Required
                          </Badge>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="p-4 border-2 border-dashed border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Image className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">
                            Photos of Delivered Items
                          </h4>
                          <Badge variant="warning" size="sm">
                            Optional
                          </Badge>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload multiple photos
                        </p>
                        <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB each</p>
                      </div>
                    </div>

                    <Button variant="primary" className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Documents
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Uploaded Documents History */}
            <Card>
              <CardHeader title="Document History" description="Previously uploaded documents" />
              <CardBody>
                <div className="space-y-3">
                  {uploadedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{doc.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {doc.uploadDate}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'success' : 'warning'}>
                        {doc.status === 'approved' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Guidelines */}
            <Card>
              <CardHeader title="Upload Guidelines" />
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Upload clear, readable documents</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Include all required fields and signatures
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Photos should show items clearly</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Submit within 24 hours of delivery</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Document Types */}
            <Card>
              <CardHeader title="Required Document Types" />
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Delivery Note</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">Signed proof of delivery</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Invoice</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">Official tax invoice</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Quality Certificate</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">If applicable for items</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Image className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Photos</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">Visual proof of delivery</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Help */}
            <Card className="bg-primary/5 border-primary/20">
              <CardBody>
                <h4 className="text-sm font-semibold text-foreground mb-2">Need Assistance?</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Contact support if you need help with document upload.
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  Contact Support
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
