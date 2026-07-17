import { useState } from 'react';
import { Link } from 'react-router';
import {
  Clock,
  Upload,
  Trash2,
  XCircle,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorDocuments() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const documents = [
    {
      id: 1,
      name: 'Business Registration Certificate',
      category: 'legal',
      file: 'business-registration.pdf',
      uploadDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'approved',
      size: '1.2 MB',
    },
    {
      id: 2,
      name: 'Tax Clearance Certificate',
      category: 'legal',
      file: 'tax-clearance.pdf',
      uploadDate: '2024-02-20',
      expiryDate: '2024-12-31',
      status: 'approved',
      size: '850 KB',
    },
    {
      id: 3,
      name: 'ISO 9001 Certification',
      category: 'certification',
      file: 'iso-9001.pdf',
      uploadDate: '2024-03-01',
      expiryDate: '2025-03-01',
      status: 'pending',
      size: '2.1 MB',
    },
    {
      id: 4,
      name: 'Bank Statement',
      category: 'financial',
      file: 'bank-statement-jan-2024.pdf',
      uploadDate: '2024-03-10',
      expiryDate: null,
      status: 'rejected',
      size: '620 KB',
      rejectionReason: 'Document is older than 3 months. Please upload recent statement.',
    },
    {
      id: 5,
      name: 'Company Profile',
      category: 'other',
      file: 'company-profile.pdf',
      uploadDate: '2024-01-10',
      expiryDate: null,
      status: 'approved',
      size: '3.5 MB',
    },
  ];
  const requiredDocuments = [
    {
      name: 'Business Registration Certificate',
      category: 'legal',
      required: true,
      uploaded: true,
    },
    { name: 'Tax Clearance Certificate', category: 'legal', required: true, uploaded: true },
    { name: 'Bank Statement (Recent)', category: 'financial', required: true, uploaded: false },
    { name: 'Company Profile', category: 'other', required: true, uploaded: true },
    { name: 'ISO Certification', category: 'certification', required: false, uploaded: true },
    { name: 'Insurance Certificate', category: 'legal', required: false, uploaded: false },
  ];
  const getStatusBadge = (status) => {
    const config = {
      approved: { variant: 'success', icon: CheckCircle, label: 'Approved' },
      pending: { variant: 'warning', icon: Clock, label: 'Under Review' },
      rejected: { variant: 'error', icon: XCircle, label: 'Rejected' },
    };
    const { variant, icon: Icon, label } = config[status];
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };
  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'legal', label: 'Legal' },
    { value: 'financial', label: 'Financial' },
    { value: 'certification', label: 'Certifications' },
    { value: 'other', label: 'Other' },
  ];
  const filteredDocuments =
    selectedCategory === 'all'
      ? documents
      : documents.filter((doc) => doc.category === selectedCategory);
  const uploadedCount = requiredDocuments.filter((doc) => doc.uploaded).length;
  const requiredCount = requiredDocuments.filter((doc) => doc.required).length;
  const requiredUploaded = requiredDocuments.filter((doc) => doc.required && doc.uploaded).length;
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">My Documents</h1>
              <p className="text-sm text-muted-foreground">
                Manage your business documents and certificates
              </p>
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
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
              <p className="text-3xl font-bold text-foreground">{documents.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Required Documents</p>
              <p className="text-3xl font-bold text-foreground">
                {requiredUploaded}/{requiredCount}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Approved Documents</p>
              <p className="text-3xl font-bold text-success">
                {documents.filter((d) => d.status === 'approved').length}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Missing Required Documents Alert */}
        {requiredUploaded < requiredCount && (
          <Card className="mb-6 border-l-4 border-l-error">
            <CardBody>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Missing Required Documents</h3>
                  <p className="text-sm text-muted-foreground">
                    You need to upload {requiredCount - requiredUploaded} more required document(s)
                    to complete your profile.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Upload New Document */}
            <Card>
              <CardHeader title="Upload New Document" description="Add documents to your profile" />
              <CardBody>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Click to upload or drag and drop
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG up to 10MB</p>
                  <Button variant="primary" size="sm">
                    Choose File
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader
                title="My Documents"
                description={`${filteredDocuments.length} document(s)`}
                action={
                  <div className="flex gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategory === cat.value
                            ? 'bg-primary text-white'
                            : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                }
              />
              <CardBody>
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 border-2 rounded-lg ${
                        doc.status === 'rejected'
                          ? 'border-error/20 bg-error/5'
                          : doc.status === 'approved'
                            ? 'border-success/20 bg-success/5'
                            : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">{doc.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{doc.file}</span>
                              <span>•</span>
                              <span>{doc.size}</span>
                              <span>•</span>
                              <span>Uploaded: {doc.uploadDate}</span>
                            </div>
                            {doc.expiryDate && (
                              <div className="mt-2 text-xs">
                                <span className="text-muted-foreground">Expires: </span>
                                <span className="font-medium text-foreground">
                                  {doc.expiryDate}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>

                      {doc.status === 'rejected' && doc.rejectionReason && (
                        <div className="p-3 bg-error/10 border border-error/20 rounded-lg mb-3">
                          <p className="text-xs font-medium text-error mb-1">Rejection Reason:</p>
                          <p className="text-xs text-foreground">{doc.rejectionReason}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        {doc.status === 'rejected' && (
                          <Button variant="primary" size="sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Re-upload
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 mr-2 text-error" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Documents Checklist */}
            <Card>
              <CardHeader title="Required Documents" description="Document checklist" />
              <CardBody>
                <div className="space-y-3">
                  {requiredDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground">{doc.name}</h4>
                          {doc.required && (
                            <Badge variant="error" size="sm">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{doc.category}</p>
                      </div>
                      {doc.uploaded ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <button className="text-xs text-primary font-medium hover:underline">
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Document Guidelines */}
            <Card>
              <CardHeader title="Upload Guidelines" />
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Upload clear, readable copies</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Ensure documents are current and valid</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">File size should not exceed 10MB</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">Accepted formats: PDF, JPG, PNG</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Documents are reviewed within 2-3 business days
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Help */}
            <Card className="bg-primary/5 border-primary/20">
              <CardBody>
                <h4 className="text-sm font-semibold text-foreground mb-2">Need Help?</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Contact our support team if you have questions about document requirements.
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
