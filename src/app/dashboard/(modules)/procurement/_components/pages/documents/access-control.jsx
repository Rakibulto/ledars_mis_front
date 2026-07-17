'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Eye, Lock, Edit, Shield, Upload, Trash2, Download, ArrowLeft } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const roles = [
  'Requester',
  'Finance Checker',
  'Budget Holder',
  'Procurement Admin',
  'Approver',
  'Inventory Officer',
  'Treasury Officer',
  'Vendor',
  'System Admin',
];
const categories = [
  'Contracts',
  'Procurement',
  'Vendor Documents',
  'Goods Receipt',
  'Financial',
  'Inventory',
  'Compliance',
  'Templates',
];
const permissions = ['View', 'Upload', 'Download', 'Edit', 'Delete'];
const defaultMatrix = {
  Contracts: {
    Requester: ['View'],
    'Finance Checker': ['View', 'Download'],
    'Budget Holder': ['View', 'Download'],
    'Procurement Admin': ['View', 'Upload', 'Download', 'Edit'],
    Approver: ['View', 'Download'],
    'Inventory Officer': ['View'],
    'Treasury Officer': ['View', 'Download'],
    Vendor: ['View', 'Download'],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  Procurement: {
    Requester: ['View'],
    'Finance Checker': ['View', 'Download'],
    'Budget Holder': ['View'],
    'Procurement Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
    Approver: ['View', 'Download'],
    'Inventory Officer': ['View'],
    'Treasury Officer': [],
    Vendor: [],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  'Vendor Documents': {
    Requester: [],
    'Finance Checker': ['View', 'Download'],
    'Budget Holder': [],
    'Procurement Admin': ['View', 'Upload', 'Download', 'Edit'],
    Approver: ['View'],
    'Inventory Officer': [],
    'Treasury Officer': ['View', 'Download'],
    Vendor: ['View', 'Upload', 'Download'],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  'Goods Receipt': {
    Requester: ['View'],
    'Finance Checker': ['View', 'Download'],
    'Budget Holder': [],
    'Procurement Admin': ['View', 'Download'],
    Approver: ['View'],
    'Inventory Officer': ['View', 'Upload', 'Download', 'Edit'],
    'Treasury Officer': ['View'],
    Vendor: ['View'],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  Financial: {
    Requester: [],
    'Finance Checker': ['View', 'Upload', 'Download', 'Edit'],
    'Budget Holder': ['View', 'Download'],
    'Procurement Admin': ['View'],
    Approver: ['View', 'Download'],
    'Inventory Officer': [],
    'Treasury Officer': ['View', 'Upload', 'Download', 'Edit'],
    Vendor: [],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  Inventory: {
    Requester: [],
    'Finance Checker': ['View'],
    'Budget Holder': [],
    'Procurement Admin': ['View'],
    Approver: ['View'],
    'Inventory Officer': ['View', 'Upload', 'Download', 'Edit'],
    'Treasury Officer': [],
    Vendor: [],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  Compliance: {
    Requester: [],
    'Finance Checker': ['View'],
    'Budget Holder': ['View'],
    'Procurement Admin': ['View'],
    Approver: ['View', 'Download'],
    'Inventory Officer': [],
    'Treasury Officer': ['View'],
    Vendor: [],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
  Templates: {
    Requester: ['View', 'Download'],
    'Finance Checker': ['View', 'Download'],
    'Budget Holder': ['View', 'Download'],
    'Procurement Admin': ['View', 'Download', 'Upload', 'Edit'],
    Approver: ['View', 'Download'],
    'Inventory Officer': ['View', 'Download'],
    'Treasury Officer': ['View', 'Download'],
    Vendor: ['View', 'Download'],
    'System Admin': ['View', 'Upload', 'Download', 'Edit', 'Delete'],
  },
};
const permIcons = {
  View: Eye,
  Upload,
  Download,
  Edit,
  Delete: Trash2,
};
export function DocumentAccessControl() {
  const [selectedCategory, setSelectedCategory] = useState('Contracts');
  const [matrix] = useState(defaultMatrix);
  const getPermCount = (role) =>
    categories.reduce((sum, cat) => sum + (matrix[cat]?.[role]?.length || 0), 0);
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
              Document Access Control
            </h1>
            <p className="text-muted-foreground">
              Configure role-based permissions for document categories
            </p>
          </div>
          <Button variant="primary">
            <Shield className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <Card>
        <CardHeader
          title="Permission Matrix"
          description="Check marks indicate which operations each role can perform on each document category"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-left sticky left-0 bg-card min-w-[160px]">
                    Role
                  </th>
                  {categories.map((cat) => (
                    <th
                      key={cat}
                      className="pb-3 text-xs font-semibold text-foreground uppercase text-center px-2 min-w-[100px]"
                    >
                      <button
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-1 rounded transition-colors ${selectedCategory === cat ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {cat}
                      </button>
                    </th>
                  ))}
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center px-2">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 pr-3 sticky left-0 bg-card">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{role}</span>
                      </div>
                    </td>
                    {categories.map((cat) => {
                      const rolePerms = matrix[cat]?.[role] || [];
                      return (
                        <td key={cat} className="py-3 px-2 text-center">
                          <div className="flex flex-wrap justify-center gap-1">
                            {rolePerms.length > 0 ? (
                              rolePerms.map((perm) => {
                                const Icon = permIcons[perm];
                                return (
                                  <span
                                    key={perm}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-success/10"
                                    title={perm}
                                  >
                                    <Icon className="w-3 h-3 text-success" />
                                  </span>
                                );
                              })
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded bg-secondary"
                                title="No access"
                              >
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center">
                      <Badge variant="outline" size="sm">
                        {getPermCount(role)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground font-semibold">Legend:</span>
            {permissions.map((perm) => {
              const Icon = permIcons[perm];
              return (
                <div key={perm} className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-success/10">
                    <Icon className="w-3 h-3 text-success" />
                  </span>
                  <span className="text-xs text-foreground">{perm}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary">
                <Lock className="w-3 h-3 text-muted-foreground" />
              </span>
              <span className="text-xs text-foreground">No Access</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Selected Category Detail */}
      <Card className="mt-6">
        <CardHeader
          title={`Detailed Permissions: ${selectedCategory}`}
          description="Edit individual role permissions for this category"
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const rolePerms = matrix[selectedCategory]?.[role] || [];
              return (
                <div key={role} className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">{role}</h4>
                    {role === 'Vendor' && (
                      <Badge variant="success" size="sm">
                        External
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {permissions.map((perm) => {
                      const has = rolePerms.includes(perm);
                      return (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={has}
                            readOnly
                            className="rounded border-input"
                          />
                          <span
                            className={`text-sm ${has ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {perm}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
