'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, FileText, ArrowLeft, FolderOpen } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody } from '../../components/ui/card';
const mockCategories = [
  {
    id: 1,
    name: 'Contracts',
    description: 'Work orders, award letters, formal agreements',
    documentCount: 45,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: '📄',
    createdBy: 'System Admin',
    accessRoles: ['All Roles'],
  },
  {
    id: 2,
    name: 'Procurement',
    description: 'RFQ specs, comparative statements, requisitions',
    documentCount: 78,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    icon: '📋',
    createdBy: 'System Admin',
    accessRoles: ['Procurement Admin', 'Approver', 'System Admin'],
  },
  {
    id: 3,
    name: 'Vendor Documents',
    description: 'Trade licenses, TIN/BIN certificates, insurance',
    documentCount: 156,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    icon: '🏢',
    createdBy: 'System Admin',
    accessRoles: ['Procurement Admin', 'Vendor', 'System Admin'],
  },
  {
    id: 4,
    name: 'Goods Receipt',
    description: 'GRN documents, delivery notes, inspection reports',
    documentCount: 62,
    color: 'bg-green-50 text-green-600 border-green-200',
    icon: '📦',
    createdBy: 'System Admin',
    accessRoles: ['Inventory Officer', 'Procurement Admin', 'System Admin'],
  },
  {
    id: 5,
    name: 'Financial',
    description: 'Payment vouchers, invoices, budget plans, bank statements',
    documentCount: 134,
    color: 'bg-red-50 text-red-600 border-red-200',
    icon: '💰',
    createdBy: 'System Admin',
    accessRoles: ['Finance Checker', 'Treasury Officer', 'Budget Holder', 'System Admin'],
  },
  {
    id: 6,
    name: 'Inventory',
    description: 'Stock reports, asset registers, movement records',
    documentCount: 38,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    icon: '📊',
    createdBy: 'System Admin',
    accessRoles: ['Inventory Officer', 'System Admin'],
  },
  {
    id: 7,
    name: 'Compliance',
    description: 'Audit reports, compliance checklists, policy documents',
    documentCount: 22,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    icon: '🛡️',
    createdBy: 'Kamal Hossain',
    accessRoles: ['System Admin', 'Approver'],
  },
  {
    id: 8,
    name: 'Templates',
    description: 'Standard form templates, letter formats, report templates',
    documentCount: 15,
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: '📝',
    createdBy: 'System Admin',
    accessRoles: ['All Roles'],
  },
];
export function DocumentCategories() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const totalDocuments = mockCategories.reduce((sum, c) => sum + c.documentCount, 0);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.documents.repository}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Repository
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Document Categories
            </h1>
            <p className="text-muted-foreground">
              Organize documents by type with role-based access control
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Category
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{mockCategories.length}</p>
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">9</p>
                <p className="text-sm text-muted-foreground">Access Roles Configured</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockCategories.map((cat) => (
          <Card key={cat.id} hover>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg border flex items-center justify-center text-2xl ${cat.color}`}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-muted rounded transition-colors">
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button className="p-1.5 hover:bg-muted rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {cat.documentCount} documents
                  </span>
                </div>
                <Badge variant="outline" size="sm">
                  Created by: {cat.createdBy}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Access Roles:
                </p>
                <div className="flex flex-wrap gap-1">
                  {cat.accessRoles.map((role) => (
                    <Badge key={role} variant="outline" size="sm">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
