'use client';

import { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useVendorMutations } from './use-vendor-api';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const { createVendor, isMutating } = useVendorMutations();
  const steps = [
    { id: 1, title: 'Company Information', status: 'current' },
    { id: 2, title: 'Legal Documents', status: 'pending' },
    { id: 3, title: 'Bank Details', status: 'pending' },
    { id: 4, title: 'Categories & Services', status: 'pending' },
    { id: 5, title: 'Review & Submit', status: 'pending' },
  ];
  const requiredDocuments = [
    { id: 'trade-license', name: 'Trade License', required: true },
    { id: 'tax-cert', name: 'Tax Certificate / TIN', required: true },
    { id: 'vat-reg', name: 'VAT Registration Certificate', required: true },
    { id: 'bank-letter', name: 'Bank Account Letter', required: true },
    { id: 'company-profile', name: 'Company Profile', required: false },
    { id: 'quality-cert', name: 'Quality Certifications', required: false },
  ];
  const handleFileUpload = (docId) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: true }));
  };
  const removeFile = (docId) => {
    setUploadedDocs((prev) => {
      const updated = { ...prev };
      delete updated[docId];
      return updated;
    });
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Vendor Onboarding
        </h1>
        <p className="text-muted-foreground">
          Complete vendor registration and verification process
        </p>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between overflow-x-auto gap-1 pb-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep > step.id
                          ? 'bg-success text-white'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${currentStep === step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${currentStep > step.id ? 'bg-success' : 'bg-border'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Step 1: Company Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader title="Company Information" description="Enter basic company details" />
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Legal Business Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Year Established *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Registered Address *
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Country *
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select country</option>
                    <option value="us">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="ca">Canada</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Primary Contact Person
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Legal Documents */}
      {currentStep === 2 && (
        <Card>
          <CardHeader
            title="Legal Documents"
            description="Upload required legal and registration documents"
          />
          <CardBody>
            <div className="space-y-4">
              {requiredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {doc.name}
                        {doc.required && (
                          <Badge variant="error" size="sm">
                            Required
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                    {uploadedDocs[doc.id] && (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>

                  {uploadedDocs[doc.id] ? (
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-success" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.name}.pdf</p>
                          <p className="text-xs text-muted-foreground">1.2 MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(doc.id)}
                        className="p-1 hover:bg-error/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFileUpload(doc.id)}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Upload className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Click to upload or drag and drop
                      </span>
                    </button>
                  )}
                </div>
              ))}

              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Document Verification</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All uploaded documents will be reviewed by our compliance team. Ensure all
                    documents are valid, clear, and up-to-date.
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 3: Bank Details */}
      {currentStep === 3 && (
        <Card>
          <CardHeader
            title="Bank Account Details"
            description="Enter banking information for payments"
          />
          <CardBody>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    SWIFT/BIC Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    IBAN (if applicable)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Tax Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tax ID / TIN *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      VAT Registration Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 4: Categories */}
      {currentStep === 4 && (
        <Card>
          <CardHeader
            title="Categories & Services"
            description="Select categories you can supply"
          />
          <CardBody>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select Categories *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Office Furniture',
                    'IT Equipment',
                    'Stationery',
                    'Medical Supplies',
                    'Construction Materials',
                    'Cleaning Services',
                    'Professional Services',
                    'Transportation',
                    'Food & Beverages',
                  ].map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 p-3 border-2 border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brief Description of Services
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Describe your company's expertise and services..."
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 5: Review */}
      {currentStep === 5 && (
        <Card>
          <CardHeader
            title="Review & Submit"
            description="Review your information before submission"
          />
          <CardBody>
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <CheckCircle className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Submit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review all information carefully. After submission, your application will
                  be reviewed by our team.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Company information completed</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Legal documents uploaded</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Bank details provided</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Categories selected</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-2">What happens next?</h4>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Your application will be reviewed within 2-3 business days</li>
                  <li>Our compliance team will verify all submitted documents</li>
                  <li>You'll receive an email notification about your application status</li>
                  <li>Once approved, you can start participating in RFQs</li>
                </ol>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        {currentStep < 5 ? (
          <Button variant="primary" onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}>
            Next Step
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={isMutating}
            onClick={() => createVendor({ status: 'Pending' })}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}
