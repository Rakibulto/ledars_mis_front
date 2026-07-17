'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
export function BudgetCodeSetup() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const budgetCodes = [
    {
      id: 1,
      code: 'BDG-OP-2024',
      name: 'Operations Budget 2024',
      department: 'Operations',
      allocated: 1200000,
      spent: 980000,
      balance: 220000,
      isActive: true,
    },
    {
      id: 2,
      code: 'BDG-IT-2024',
      name: 'IT Budget 2024',
      department: 'IT',
      allocated: 900000,
      spent: 720000,
      balance: 180000,
      isActive: true,
    },
    {
      id: 3,
      code: 'BDG-MED-2024',
      name: 'Medical Budget 2024',
      department: 'Medical',
      allocated: 800000,
      spent: 640000,
      balance: 160000,
      isActive: true,
    },
    {
      id: 4,
      code: 'BDG-CONST-2024',
      name: 'Construction Budget 2024',
      department: 'Construction',
      allocated: 1500000,
      spent: 1200000,
      balance: 300000,
      isActive: true,
    },
    {
      id: 5,
      code: 'BDG-ADMIN-2024',
      name: 'Admin Budget 2024',
      department: 'Administration',
      allocated: 600000,
      spent: 310000,
      balance: 290000,
      isActive: true,
    },
    {
      id: 6,
      code: 'BDG-OP-2023',
      name: 'Operations Budget 2023',
      department: 'Operations',
      allocated: 1000000,
      spent: 1000000,
      balance: 0,
      isActive: false,
    },
  ];
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Budget Code Setup</h1>
          <p className="text-muted-foreground">Manage budget codes and allocations</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Budget Code
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`Budget Codes (${budgetCodes.length})`}
          description="Configure budget allocations by department"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Budget Code</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Department</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Allocated</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Spent</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Balance</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Utilization</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgetCodes.map((budget) => {
                  const utilization = (budget.spent / budget.allocated) * 100;
                  return (
                    <tr key={budget.id} className="border-b border-border">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-mono font-semibold text-foreground">
                            {budget.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-foreground">{budget.name}</td>
                      <td className="py-4 text-sm text-foreground">{budget.department}</td>
                      <td className="py-4 text-sm font-semibold text-foreground">
                        ${budget.allocated.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm font-semibold text-error">
                        ${budget.spent.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm font-semibold text-success">
                        ${budget.balance.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            utilization >= 95 ? 'error' : utilization >= 80 ? 'warning' : 'success'
                          }
                        >
                          {utilization.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={budget.isActive ? 'success' : 'default'}>
                          {budget.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-muted rounded transition-colors">
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button className="p-2 hover:bg-muted rounded transition-colors">
                            <Trash2 className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader title="Add Budget Code" description="Create new budget allocation" />
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Budget Code *
                    </label>
                    <input
                      type="text"
                      placeholder="BDG-XXX-2024"
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Select department</option>
                      <option value="operations">Operations</option>
                      <option value="it">IT</option>
                      <option value="medical">Medical</option>
                      <option value="construction">Construction</option>
                      <option value="admin">Administration</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Allocated Amount ($) *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Fiscal Year *
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                      <span className="ml-3 text-sm font-medium text-foreground">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="primary" className="flex-1">
                  Create Budget Code
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
