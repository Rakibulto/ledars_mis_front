import { useState } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';

import { Input } from './ui/input';
import { Radio } from './ui/radio';
import { Modal } from './ui/modal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { StatusBadge } from './status-badge';
import { Table, DataTable } from './ui/table';
import { FileUpload } from './ui/file-upload';
import { ApprovalTimeline } from './ui/timeline';
import { Card, CardBody, CardHeader } from './ui/card';
export function DesignSystemDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Sample table data
  const tableColumns = [
    { key: 'id', label: 'Requisition ID', width: '150px' },
    { key: 'requester', label: 'Requester', width: '200px' },
    { key: 'department', label: 'Department', width: '150px' },
    { key: 'amount', label: 'Amount', width: '120px', align: 'right' },
    { key: 'status', label: 'Status', width: '150px' },
    { key: 'date', label: 'Date', width: '120px' },
  ];
  const tableData = [
    {
      id: 'REQ-2024-001',
      requester: 'Sarah Wilson',
      department: 'Operations',
      amount: '$12,450',
      status: <StatusBadge status="pending">Pending</StatusBadge>,
      date: '2024-03-10',
    },
    {
      id: 'REQ-2024-002',
      requester: 'Michael Chen',
      department: 'Finance',
      amount: '$8,900',
      status: <StatusBadge status="approved">Approved</StatusBadge>,
      date: '2024-03-11',
    },
    {
      id: 'REQ-2024-003',
      requester: 'Emily Davis',
      department: 'IT',
      amount: '$24,500',
      status: <StatusBadge status="in-progress">In Progress</StatusBadge>,
      date: '2024-03-12',
    },
  ];
  const approvalData = [
    {
      level: 'Level 1 - Finance Check',
      approver: 'John Smith',
      role: 'Finance Officer',
      status: 'approved',
      date: '2024-03-10 10:30 AM',
      comment: 'Budget verified and approved.',
    },
    {
      level: 'Level 2 - Budget Holder',
      approver: 'Sarah Johnson',
      role: 'Budget Manager',
      status: 'approved',
      date: '2024-03-11 02:15 PM',
      comment: 'Funds allocated. Proceeding to procurement.',
    },
    {
      level: 'Level 3 - Procurement Approval',
      approver: 'Michael Brown',
      role: 'Procurement Head',
      status: 'pending',
    },
  ];
  return (
    <div className="p-6 space-y-8">
      {/* Typography Section */}
      <Card>
        <CardHeader title="Typography" description="Inter font family with consistent sizing" />
        <CardBody>
          <div className="space-y-4">
            <div>
              <h1>Heading 1 - Main Page Titles</h1>
              <h2>Heading 2 - Section Headers</h2>
              <h3>Heading 3 - Subsection Headers</h3>
              <h4>Heading 4 - Card Titles</h4>
              <p className="text-base text-foreground">Body text - Regular paragraph content</p>
              <p className="text-sm text-muted-foreground">
                Small text - Helper text and descriptions
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Buttons Section */}
      <Card>
        <CardHeader title="Buttons" description="Various button styles and sizes" />
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="success">Success Button</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" icon={Plus} iconPosition="left">
                Add Item
              </Button>
              <Button variant="outline" icon={Download} iconPosition="left">
                Export
              </Button>
              <Button variant="secondary" icon={Filter} iconPosition="left">
                Filter
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Form Controls Section */}
      <Card>
        <CardHeader
          title="Form Controls"
          description="Input fields, selects, and other form elements"
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Full Name" placeholder="Enter your full name" required />
            <Input
              label="Email Address"
              type="email"
              placeholder="email@example.com"
              helperText="We'll never share your email"
            />
            <Select
              label="Department"
              required
              options={[
                { value: '', label: 'Select department...' },
                { value: 'operations', label: 'Operations' },
                { value: 'finance', label: 'Finance' },
                { value: 'procurement', label: 'Procurement' },
                { value: 'it', label: 'IT' },
              ]}
            />
            <Input
              label="Budget Amount"
              type="number"
              placeholder="0.00"
              helperText="Enter amount in USD"
            />
            <div className="col-span-2">
              <Textarea
                label="Description"
                placeholder="Enter detailed description..."
                helperText="Provide as much detail as possible"
              />
            </div>
            <div className="col-span-2 space-y-3">
              <Checkbox label="I agree to the terms and conditions" />
              <Checkbox label="Send me email notifications" />
            </div>
            <div className="col-span-2 space-y-3">
              <p className="text-sm font-medium">Payment Method:</p>
              <Radio name="payment" label="Bank Transfer" />
              <Radio name="payment" label="Check" />
              <Radio name="payment" label="Cash" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader title="Badges & Status" description="Status indicators and labels" />
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="draft" />
              <StatusBadge status="submitted" />
              <StatusBadge status="approved" />
              <StatusBadge status="rejected" />
              <StatusBadge status="pending" />
              <StatusBadge status="completed" />
              <StatusBadge status="in-progress" />
              <StatusBadge status="paid" />
              <StatusBadge status="unpaid" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Section */}
      <DataTable
        title="Data Tables"
        description="Clean and professional table layouts"
        actions={
          <>
            <Button variant="outline" icon={Search} size="sm">
              Search
            </Button>
            <Button variant="primary" icon={Plus} size="sm">
              Add New
            </Button>
          </>
        }
      >
        <Table columns={tableColumns} data={tableData} />
      </DataTable>

      {/* Timeline Section */}
      <ApprovalTimeline approvals={approvalData} />

      {/* File Upload Section */}
      <Card>
        <CardHeader title="File Upload" description="Drag and drop file upload component" />
        <CardBody>
          <FileUpload
            label="Document Attachments"
            accept=".pdf,.doc,.docx,.jpg,.png"
            multiple
            maxSize={10}
            helperText="Upload supporting documents (PDF, Word, Images)"
          />
        </CardBody>
      </Card>

      {/* Modal Section */}
      <Card>
        <CardHeader title="Modals" description="Dialog and modal windows" />
        <CardBody>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Requisition"
        description="Fill in the details to create a new material requisition"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Save Requisition
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Requisition Title" placeholder="Enter title" required />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              required
              options={[
                { value: '', label: 'Select...' },
                { value: 'ops', label: 'Operations' },
                { value: 'fin', label: 'Finance' },
              ]}
            />
            <Input label="Estimated Cost" type="number" placeholder="0.00" />
          </div>
          <Textarea label="Justification" placeholder="Explain why this is needed..." />
        </div>
      </Modal>

      {/* Color Palette */}
      <Card>
        <CardHeader title="Color Palette" description="Enterprise color system" />
        <CardBody>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded-lg"></div>
              <p className="text-sm font-medium">Primary Blue</p>
              <p className="text-xs text-muted-foreground">#1e40af</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-success rounded-lg"></div>
              <p className="text-sm font-medium">Success Green</p>
              <p className="text-xs text-muted-foreground">#16a34a</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-warning rounded-lg"></div>
              <p className="text-sm font-medium">Warning Orange</p>
              <p className="text-xs text-muted-foreground">#ea580c</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-destructive rounded-lg"></div>
              <p className="text-sm font-medium">Danger Red</p>
              <p className="text-xs text-muted-foreground">#dc2626</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
