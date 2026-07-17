'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function RolesAndPermissions() {
  const [selectedRole, setSelectedRole] = useState('procurement-manager');
  const roles = [
    {
      id: 'system-admin',
      name: 'System Administrator',
      users: 2,
      description: 'Full system access',
    },
    {
      id: 'procurement-manager',
      name: 'Procurement Manager',
      users: 5,
      description: 'Manage procurement workflow',
    },
    {
      id: 'finance-manager',
      name: 'Finance Manager',
      users: 3,
      description: 'Finance and payment approval',
    },
    {
      id: 'treasury-officer',
      name: 'Treasury Officer',
      users: 2,
      description: 'Payment processing',
    },
    { id: 'requester', name: 'Requester', users: 25, description: 'Create requisitions' },
    {
      id: 'approver',
      name: 'Approver',
      users: 12,
      description: 'Approve requisitions and payments',
    },
  ];
  const permissions = {
    requisitions: [
      {
        id: 'req-create',
        name: 'Create Requisitions',
        procurement: true,
        finance: false,
        treasury: false,
        requester: true,
        approver: false,
      },
      {
        id: 'req-approve',
        name: 'Approve Requisitions',
        procurement: true,
        finance: false,
        treasury: false,
        requester: false,
        approver: true,
      },
      {
        id: 'req-view',
        name: 'View All Requisitions',
        procurement: true,
        finance: true,
        treasury: false,
        requester: false,
        approver: true,
      },
    ],
    rfq: [
      {
        id: 'rfq-create',
        name: 'Create RFQ',
        procurement: true,
        finance: false,
        treasury: false,
        requester: false,
        approver: false,
      },
      {
        id: 'rfq-evaluate',
        name: 'Evaluate Quotations',
        procurement: true,
        finance: false,
        treasury: false,
        requester: false,
        approver: true,
      },
    ],
    payments: [
      {
        id: 'prf-create',
        name: 'Create Payment Requisition',
        procurement: true,
        finance: true,
        treasury: false,
        requester: false,
        approver: false,
      },
      {
        id: 'prf-approve',
        name: 'Approve Payments',
        procurement: false,
        finance: true,
        treasury: false,
        requester: false,
        approver: false,
      },
      {
        id: 'treasury-process',
        name: 'Process Payments',
        procurement: false,
        finance: false,
        treasury: true,
        requester: false,
        approver: false,
      },
    ],
    settings: [
      {
        id: 'user-management',
        name: 'Manage Users',
        procurement: false,
        finance: false,
        treasury: false,
        requester: false,
        approver: false,
      },
      {
        id: 'system-config',
        name: 'System Configuration',
        procurement: false,
        finance: false,
        treasury: false,
        requester: false,
        approver: false,
      },
    ],
  };
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and access permissions</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Roles List */}
        <Card>
          <CardHeader title="System Roles" description="Available roles" />
          <CardBody>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedRole === role.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-muted rounded">
                        <Edit className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded">
                        <Trash2 className="w-3 h-3 text-error" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{role.description}</p>
                  <Badge variant="default" size="sm">
                    {role.users} users
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Permissions Matrix */}
        <div className="col-span-2">
          <Card>
            <CardHeader
              title="Permission Matrix"
              description={`Configure permissions for ${roles.find((r) => r.id === selectedRole)?.name || 'selected role'}`}
            />
            <CardBody>
              <div className="space-y-6">
                {/* Requisitions */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Requisitions
                  </h3>
                  <div className="space-y-2">
                    {permissions.requisitions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm text-foreground">{perm.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={
                              selectedRole === 'procurement-manager' ? perm.procurement : false
                            }
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RFQ */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    RFQ & Quotations
                  </h3>
                  <div className="space-y-2">
                    {permissions.rfq.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm text-foreground">{perm.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={
                              selectedRole === 'procurement-manager' ? perm.procurement : false
                            }
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payments */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    Payments & Treasury
                  </h3>
                  <div className="space-y-2">
                    {permissions.payments.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm text-foreground">{perm.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            defaultChecked={
                              selectedRole === 'procurement-manager' ? perm.procurement : false
                            }
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-error" />
                    System Settings
                  </h3>
                  <div className="space-y-2">
                    {permissions.settings.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm text-foreground">{perm.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button variant="primary" className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1">
                  Reset
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
