import { Link } from 'react-router';
import { Truck, Clock, MapPin, Package, Calendar, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorWorkOrders() {
  const workOrders = [
    {
      id: 'WO-2024-018',
      awardId: 'AWD-2024-012',
      title: 'Office Furniture Supply',
      issueDate: '2024-03-12',
      deliveryDate: '2024-04-15',
      status: 'pending-acceptance',
      value: 25000,
      items: 8,
      deliveryLocation: 'Main Office - Building A',
      termsAccepted: false,
    },
    {
      id: 'WO-2024-015',
      awardId: 'AWD-2024-008',
      title: 'IT Equipment Purchase',
      issueDate: '2024-03-01',
      deliveryDate: '2024-03-30',
      status: 'in-progress',
      value: 45000,
      items: 12,
      deliveryLocation: 'IT Department, Floor 3',
      termsAccepted: true,
    },
    {
      id: 'WO-2024-010',
      awardId: 'AWD-2024-005',
      title: 'Stationery Supplies',
      issueDate: '2024-02-18',
      deliveryDate: '2024-03-10',
      status: 'completed',
      value: 8500,
      items: 25,
      deliveryLocation: 'Central Warehouse',
      termsAccepted: true,
    },
  ];
  const getStatusBadge = (status) => {
    const config = {
      'pending-acceptance': { variant: 'error', icon: Clock, label: 'Pending Acceptance' },
      'in-progress': { variant: 'warning', icon: Truck, label: 'In Progress' },
      completed: { variant: 'success', icon: CheckCircle, label: 'Completed' },
    };
    const { variant, icon: Icon, label } = config[status];
    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Work Orders</h1>
              <p className="text-sm text-muted-foreground">Manage your delivery commitments</p>
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
        <div className="grid grid-cols-4 gap-6 mb-6">
          <Card className="border-l-4 border-l-error">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Pending Acceptance</p>
              <p className="text-3xl font-bold text-error">
                {workOrders.filter((wo) => wo.status === 'pending-acceptance').length}
              </p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-3xl font-bold text-warning">
                {workOrders.filter((wo) => wo.status === 'in-progress').length}
              </p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold text-success">
                {workOrders.filter((wo) => wo.status === 'completed').length}
              </p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-bold text-primary">
                ${(workOrders.reduce((sum, wo) => sum + wo.value, 0) / 1000).toFixed(0)}K
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Work Orders List */}
        <Card>
          <CardHeader title="All Work Orders" description="Your delivery assignments" />
          <CardBody>
            <div className="space-y-4">
              {workOrders.map((wo) => (
                <div
                  key={wo.id}
                  className={`p-6 border-2 rounded-lg ${
                    wo.status === 'pending-acceptance'
                      ? 'border-error/50 bg-error/5'
                      : wo.status === 'in-progress'
                        ? 'border-warning/50 bg-warning/5'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          wo.status === 'pending-acceptance'
                            ? 'bg-error/10'
                            : wo.status === 'in-progress'
                              ? 'bg-warning/10'
                              : 'bg-success/10'
                        }`}
                      >
                        <Truck
                          className={`w-7 h-7 ${
                            wo.status === 'pending-acceptance'
                              ? 'text-error'
                              : wo.status === 'in-progress'
                                ? 'text-warning'
                                : 'text-success'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{wo.title}</h3>
                          {getStatusBadge(wo.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-mono">{wo.id}</span>
                          <span>•</span>
                          <span>{wo.items} items</span>
                          <span>•</span>
                          <span>${wo.value.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">{wo.issueDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-error" />
                        <p className="text-sm font-medium text-foreground">{wo.deliveryDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Location</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-foreground" />
                        <p className="text-sm font-medium text-foreground">{wo.deliveryLocation}</p>
                      </div>
                    </div>
                  </div>

                  {wo.status === 'pending-acceptance' && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-lg mb-4">
                      <div className="flex items-start gap-2 mb-3">
                        <Clock className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">
                            Action Required
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Please review the work order terms and conditions. You must accept this
                            work order within 48 hours.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="primary" size="sm" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Work Order
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Terms & Conditions
                        </Button>
                      </div>
                    </div>
                  )}

                  {wo.status === 'in-progress' && (
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Package className="w-4 h-4 mr-2" />
                        View Items
                      </Button>
                      <Link to="/vendor-portal/delivery" className="flex-1">
                        <Button variant="primary" size="sm" className="w-full">
                          Upload Delivery Documents
                        </Button>
                      </Link>
                    </div>
                  )}

                  {wo.status === 'completed' && (
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Delivery Receipt
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Download Work Order
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
