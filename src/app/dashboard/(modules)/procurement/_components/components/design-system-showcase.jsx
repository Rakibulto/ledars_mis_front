import { Plus, Users, Package, FileText, Settings, Download } from 'lucide-react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { StatusBadge } from './status-badge';
import { Card, CardBody, CardHeader } from './ui/card';
export function DesignSystemShowcase() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-semibold text-foreground mb-3">ProcureMax Design System</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          A professional, enterprise-grade design system for procurement and payment management
          platforms. Built with consistency, accessibility, and scalability in mind.
        </p>
      </div>

      {/* Foundation Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Color Palette */}
        <Card>
          <CardHeader title="Color Palette" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary border border-border"></div>
                <div>
                  <p className="text-sm font-medium">Primary Blue</p>
                  <p className="text-xs text-muted-foreground">#1e40af</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success border border-border"></div>
                <div>
                  <p className="text-sm font-medium">Success Green</p>
                  <p className="text-xs text-muted-foreground">#16a34a</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning border border-border"></div>
                <div>
                  <p className="text-sm font-medium">Warning Orange</p>
                  <p className="text-xs text-muted-foreground">#ea580c</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive border border-border"></div>
                <div>
                  <p className="text-sm font-medium">Danger Red</p>
                  <p className="text-xs text-muted-foreground">#dc2626</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader title="Typography" />
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Font Family</p>
                <p className="text-sm font-medium">Inter</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Base Size</p>
                <p className="text-sm font-medium">16px</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold">Heading 1</p>
                <p className="text-xl font-semibold">Heading 2</p>
                <p className="text-lg font-semibold">Heading 3</p>
                <p className="text-base">Body Text</p>
                <p className="text-sm text-muted-foreground">Small Text</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Spacing */}
        <Card>
          <CardHeader title="Spacing System" />
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">8px Base Grid</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded"></div>
                    <span className="text-sm">8px / 0.5rem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="text-sm">16px / 1rem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded"></div>
                    <span className="text-sm">24px / 1.5rem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded"></div>
                    <span className="text-sm">32px / 2rem</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Components Showcase */}
      <Card>
        <CardHeader title="Button Styles" description="Primary actions and secondary controls" />
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" icon={Plus}>
                With Icon
              </Button>
              <Button variant="outline" icon={Download}>
                Export Data
              </Button>
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
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Badges */}
        <Card>
          <CardHeader title="Badges & Status" description="Labels and state indicators" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="draft" />
                <StatusBadge status="submitted" />
                <StatusBadge status="pending" />
                <StatusBadge status="approved" />
                <StatusBadge status="rejected" />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="completed" />
                <StatusBadge status="in-progress" />
                <StatusBadge status="paid" />
                <StatusBadge status="unpaid" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Icons */}
        <Card>
          <CardHeader title="Icons" description="Lucide React icon library" />
          <CardBody>
            <div className="grid grid-cols-6 gap-4">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-xs">File</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                <span className="text-xs">Package</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                <span className="text-xs">Users</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                <span className="text-xs">Settings</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Download className="w-6 h-6 text-primary" />
                <span className="text-xs">Download</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-6 h-6 text-primary" />
                <span className="text-xs">Plus</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Design Principles */}
      <Card>
        <CardHeader
          title="Design Principles"
          description="Guidelines for building consistent interfaces"
        />
        <CardBody>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Consistency</h4>
              <p className="text-sm text-muted-foreground">
                Use the same patterns, components, and interactions throughout the application for a
                cohesive user experience.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Clarity</h4>
              <p className="text-sm text-muted-foreground">
                Clear labels, helpful descriptions, and proper visual hierarchy make complex
                workflows easy to understand.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Efficiency</h4>
              <p className="text-sm text-muted-foreground">
                Streamlined interfaces and smart defaults help users complete tasks quickly with
                minimal friction.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Available Components List */}
      <Card>
        <CardHeader
          title="Available Components"
          description="Complete component library ready for use"
        />
        <CardBody>
          <div className="grid grid-cols-4 gap-4">
            {[
              'Button',
              'Input',
              'Select',
              'Textarea',
              'Checkbox',
              'Radio',
              'Table',
              'DataTable',
              'Modal',
              'Card',
              'Timeline',
              'ApprovalTimeline',
              'FileUpload',
              'Badge',
              'StatusBadge',
              'Tabs',
              'Alert',
              'EmptyState',
              'LoadingSpinner',
              'Pagination',
              'FilterBar',
              'Sidebar',
              'Topbar',
              'StatCard',
            ].map((component) => (
              <div key={component} className="p-3 bg-secondary rounded-lg text-center">
                <p className="text-sm font-medium">{component}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Layout Guidelines */}
      <Card>
        <CardHeader title="Layout Structure" description="Standard application layout" />
        <CardBody>
          <div className="border-2 border-border rounded-lg overflow-hidden">
            <div className="flex">
              {/* Sidebar Preview */}
              <div className="w-48 bg-sidebar border-r border-sidebar-border p-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Sidebar</div>
                <div className="space-y-2">
                  <div className="h-8 bg-primary rounded"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                </div>
              </div>
              {/* Main Content Preview */}
              <div className="flex-1">
                <div className="h-12 bg-card border-b border-border flex items-center px-4">
                  <div className="text-xs font-semibold text-muted-foreground">Topbar</div>
                </div>
                <div className="p-4 bg-background">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Content Area
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 bg-card border border-border rounded"></div>
                    <div className="h-32 bg-card border border-border rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
