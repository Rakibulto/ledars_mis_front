import { useState } from 'react';
import { Link } from 'react-router';
import {
  Tag,
  Mail,
  User,
  Edit,
  Save,
  Phone,
  MapPin,
  Shield,
  Building,
  CheckCircle,
} from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const vendor = {
    name: 'TechBD Solutions Ltd',
    nameBn:
      '\u099F\u09C7\u0995\u09AC\u09BF\u09A1\u09BF \u09B8\u09B2\u09BF\u0989\u09B6\u09A8\u09B8 \u09B2\u09BF\u0983',
    legalName: 'TechBD Solutions Limited',
    vendorId: 'V001',
    email: 'info@techbd.com.bd',
    phone: '+880 2-9876543',
    mobile: '+880 1711-234567',
    address: 'House 42, Road 11, Block D, Banani, Dhaka 1213',
    website: 'www.techbd.com.bd',
    rjscNo: 'RJSC-C-123456/2018',
    tradeLicense: 'DSCC-TL-2025-98765',
    tin: '234-567-8901',
    vatBin: '001234567-0201',
    orgType: 'Private Limited Company',
    annualTurnover: 'BDT 5 - 10 Crore',
    categories: [
      'IT Equipment',
      'Computer Hardware',
      'Networking',
      'Software & Licensing',
      'Office Equipment',
    ],
    status: 'verified',
    rating: 4.6,
    enlistment: '2025-2026',
    joinedDate: '2018-09-15',
    twoFAEnabled: true,
    nid: '1990XXXXXXX4321',
    contactPerson: 'Md. Ariful Islam',
    designation: 'Managing Director',
    district: 'Dhaka',
    division: 'Dhaka',
    bankName: 'Dutch-Bangla Bank Ltd.',
    bankBranch: 'Banani Branch, Dhaka',
    accountNo: '1234567890123',
    routingNo: '090261234',
    accountType: 'Current Account',
  };
  const documents = [
    { name: 'Trade License', status: 'valid', expiry: '2026-06-30', daysLeft: 87 },
    { name: 'VAT BIN Certificate', status: 'valid', expiry: '\u2014', daysLeft: null },
    { name: 'TIN Certificate', status: 'valid', expiry: '\u2014', daysLeft: null },
    { name: 'Tax Compliance Certificate', status: 'expiring', expiry: '2026-06-28', daysLeft: 85 },
    { name: 'Bank Solvency Certificate', status: 'expiring', expiry: '2026-07-15', daysLeft: 102 },
    { name: 'Company Profile', status: 'valid', expiry: '\u2014', daysLeft: null },
    { name: 'RJSC Certificate', status: 'valid', expiry: '\u2014', daysLeft: null },
  ];
  const profileSections = [
    { name: 'Company Information', completeness: 100, status: 'complete' },
    { name: 'Contact Details', completeness: 100, status: 'complete' },
    { name: 'Compliance Documents', completeness: 100, status: 'complete' },
    { name: 'Bank Information', completeness: 100, status: 'complete' },
    { name: 'Assigned Categories', completeness: 100, status: 'complete' },
  ];
  const overallCompleteness = 100;
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">Vendor Profile</h1>
                {vendor.twoFAEnabled && (
                  <Badge variant="info" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    2FA Active
                  </Badge>
                )}
                <Badge variant="primary" size="sm">
                  {vendor.enlistment}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your company information &middot; {vendor.vendorId}
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
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card>
              <CardBody>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-semibold text-foreground">{vendor.name}</h2>
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{vendor.nameBn}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Enlisted since {vendor.joinedDate}</span>
                        <span>&middot;</span>
                        <span>Rating: {vendor.rating}/5.0</span>
                        <span>&middot;</span>
                        <span>{vendor.orgType}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={isEditing ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </Button>
                </div>

                {/* Profile Completeness */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Profile Completeness
                    </span>
                    <span className="text-sm font-semibold text-green-700">
                      {overallCompleteness}%
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${overallCompleteness}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Your profile is fully complete. You are eligible for all RFQs in your assigned
                    categories.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader title="Company Information" description="Legal and business details" />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Company Name (English)
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.name}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Company Name (Bangla)
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.nameBn}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.legalName}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Type
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.orgType}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        RJSC Registration
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.rjscNo}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Trade License
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.tradeLicense}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Annual Turnover
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.annualTurnover}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">TIN</label>
                      <input
                        type="text"
                        defaultValue={vendor.tin}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        VAT BIN
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.vatBin}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.website}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader title="Contact Information" description="Primary contact details" />
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Contact Person
                      </label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          defaultValue={vendor.contactPerson}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Designation
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.designation}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="email"
                          defaultValue={vendor.email}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone (Office)
                      </label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          defaultValue={vendor.phone}
                          disabled={!isEditing}
                          className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Mobile
                      </label>
                      <input
                        type="tel"
                        defaultValue={vendor.mobile}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        NID Number
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.nid}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Business Address
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-3" />
                      <textarea
                        rows={2}
                        defaultValue={vendor.address}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        District
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.district}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Division
                      </label>
                      <input
                        type="text"
                        defaultValue={vendor.division}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Bank Information */}
            <Card>
              <CardHeader title="Bank Information" description="Payment account details" />
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      defaultValue={vendor.bankName}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Branch</label>
                    <input
                      type="text"
                      defaultValue={vendor.bankBranch}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      defaultValue={vendor.accountNo}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      defaultValue={vendor.routingNo}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Account Type
                    </label>
                    <input
                      type="text"
                      defaultValue={vendor.accountType}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Assigned Categories */}
            <Card>
              <CardHeader
                title="Assigned Procurement Categories"
                description="You receive RFQs only in these categories"
              />
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((category, index) => (
                    <Badge key={index} variant="primary" className="px-3 py-2">
                      <Tag className="w-3 h-3 mr-1" />
                      {category}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  To request additional categories, contact the procurement team or submit a
                  category change request.
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Sections */}
            <Card>
              <CardHeader title="Profile Sections" description="All sections complete" />
              <CardBody>
                <div className="space-y-3">
                  {profileSections.map((section, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{section.name}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${section.completeness}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {section.completeness}% complete
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Document Expiry Alerts */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader title="Document Status" />
              <CardBody>
                <div className="space-y-2">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-xs">{doc.name}</span>
                      {doc.status === 'expiring' ? (
                        <Badge variant="warning" size="sm">
                          {doc.daysLeft}d left
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          Valid
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <Link to="/vendor-portal/documents" className="block mt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Documents
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <CardBody>
                <div className="space-y-2">
                  <Link to="/vendor-portal/documents">
                    <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border border-border">
                      <p className="text-sm font-medium text-foreground">
                        Upload / Renew Documents
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Trade License, VAT, Tax Compliance
                      </p>
                    </button>
                  </Link>
                  <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border border-border">
                    <p className="text-sm font-medium text-foreground">Change Password / 2FA</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Update your portal security settings
                    </p>
                  </button>
                  <button className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors border border-border">
                    <p className="text-sm font-medium text-foreground">Request Category Change</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request addition/removal of categories
                    </p>
                  </button>
                </div>
              </CardBody>
            </Card>

            {/* Security & Verification */}
            <Card className="border-l-4 border-l-green-500">
              <CardBody>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      Verified &amp; Secure
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Your account is verified and 2FA is enabled. Enlistment: {vendor.enlistment}.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
