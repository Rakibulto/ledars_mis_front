'use client';

import { useState } from 'react';
import { Eye, Plus, Edit, Mail } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function EmailTemplateSettings() {
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const templates = [
    {
      id: 1,
      name: 'Requisition Approved',
      subject: 'Your Requisition #{REQ_ID} Has Been Approved',
      module: 'Requisitions',
      isActive: true,
    },
    {
      id: 2,
      name: 'Requisition Rejected',
      subject: 'Requisition #{REQ_ID} Requires Revision',
      module: 'Requisitions',
      isActive: true,
    },
    {
      id: 3,
      name: 'RFQ Invitation',
      subject: 'RFQ Invitation - {RFQ_TITLE}',
      module: 'RFQ',
      isActive: true,
    },
    {
      id: 4,
      name: 'Award Notification',
      subject: "Award Notification - You've Been Awarded Contract {AWARD_ID}",
      module: 'Awards',
      isActive: true,
    },
    {
      id: 5,
      name: 'Payment Processed',
      subject: 'Payment Processed - PRF {PRF_ID}',
      module: 'Payments',
      isActive: true,
    },
    {
      id: 6,
      name: 'Work Order Created',
      subject: 'New Work Order {WO_ID} Issued',
      module: 'Work Orders',
      isActive: true,
    },
  ];
  const templateContent = {
    1: {
      body: `Dear {USER_NAME},\n\nYour requisition {REQ_ID} has been approved and will proceed to the next stage.\n\nRequisition Details:\n- Requisition ID: {REQ_ID}\n- Department: {DEPARTMENT}\n- Total Amount: {AMOUNT}\n- Approved By: {APPROVER_NAME}\n- Approval Date: {APPROVAL_DATE}\n\nYou can view the full details in the system.\n\nBest regards,\nProcurement Team`,
    },
  };
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Email Template Settings</h1>
          <p className="text-muted-foreground">Customize system email notifications</p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Email Templates" description="Available templates" />
          <CardBody>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                    </div>
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{template.module}</p>
                  <Badge variant={template.isActive ? 'success' : 'default'} size="sm">
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="col-span-2">
          <Card>
            <CardHeader
              title="Template Editor"
              description={`Editing: ${templates.find((t) => t.id === selectedTemplate)?.name}`}
              action={
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              }
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    defaultValue={templates.find((t) => t.id === selectedTemplate)?.name}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    defaultValue={templates.find((t) => t.id === selectedTemplate)?.subject}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Body
                  </label>
                  <textarea
                    rows={12}
                    defaultValue={templateContent[1]?.body}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-foreground mb-2">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '{USER_NAME}',
                      '{REQ_ID}',
                      '{DEPARTMENT}',
                      '{AMOUNT}',
                      '{APPROVER_NAME}',
                      '{APPROVAL_DATE}',
                      '{WO_ID}',
                      '{VENDOR_NAME}',
                    ].map((variable) => (
                      <Badge key={variable} variant="default" size="sm">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active Status</p>
                    <p className="text-xs text-muted-foreground">Enable this email template</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
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
