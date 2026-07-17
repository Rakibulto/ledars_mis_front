import { Link } from 'react-router';
import { Award, Clock, Truck, FileText, Calendar, DollarSign, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorAwards() {
  const awards = [
    {
      id: 'AWD-2024-012',
      rfqId: 'RFQ-2024-038',
      title: 'Office Furniture Supply',
      awardDate: '2024-03-10',
      value: 25000,
      status: 'work-order-issued',
      deliveryDeadline: '2024-04-15',
      items: 8,
      category: 'Furniture',
    },
    {
      id: 'AWD-2024-008',
      rfqId: 'RFQ-2024-025',
      title: 'IT Equipment Purchase',
      awardDate: '2024-02-28',
      value: 45000,
      status: 'delivered',
      deliveryDeadline: '2024-03-30',
      items: 12,
      category: 'IT Equipment',
    },
    {
      id: 'AWD-2024-005',
      rfqId: 'RFQ-2024-018',
      title: 'Stationery Supplies',
      awardDate: '2024-02-15',
      value: 8500,
      status: 'completed',
      deliveryDeadline: '2024-03-10',
      items: 25,
      category: 'Stationery',
    },
  ];
  const stats = {
    total: awards.length,
    totalValue: awards.reduce((sum, award) => sum + award.value, 0),
    active: awards.filter((a) => a.status === 'work-order-issued').length,
    completed: awards.filter((a) => a.status === 'completed').length,
  };
  const getStatusBadge = (status) => {
    const config = {
      'work-order-issued': { variant: 'warning', icon: Clock, label: 'WO Issued' },
      delivered: { variant: 'primary', icon: Truck, label: 'Delivered' },
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
              <h1 className="text-2xl font-semibold text-foreground">My Awards</h1>
              <p className="text-sm text-muted-foreground">Tenders you have won</p>
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
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Awards</p>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-2xl font-bold text-success">
                ${(stats.totalValue / 1000).toFixed(0)}K
              </p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold text-warning">{stats.active}</p>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardBody>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold text-primary">{stats.completed}</p>
            </CardBody>
          </Card>
        </div>

        {/* Awards List */}
        <Card>
          <CardHeader title="Award History" description="All your awarded tenders" />
          <CardBody>
            <div className="space-y-4">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="p-6 border-2 border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-7 h-7 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{award.title}</h3>
                          {getStatusBadge(award.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>Award No: {award.id}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>RFQ: {award.rfqId}</span>
                          </div>
                          <span>•</span>
                          <Badge variant="default" size="sm">
                            {award.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${award.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{award.items} items</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Award Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">{award.awardDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Deadline</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-error" />
                        <p className="text-sm font-medium text-foreground">
                          {award.deliveryDeadline}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contract Value</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-success" />
                        <p className="text-sm font-medium text-foreground">
                          ${award.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {award.status === 'work-order-issued' && (
                      <>
                        <Link to="/vendor-portal/work-orders" className="flex-1">
                          <Button variant="primary" size="sm" className="w-full">
                            View Work Order
                          </Button>
                        </Link>
                        <Link to="/vendor-portal/delivery" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Upload Delivery Documents
                          </Button>
                        </Link>
                      </>
                    )}
                    {award.status === 'delivered' && (
                      <Button variant="outline" size="sm" className="flex-1">
                        View Delivery Status
                      </Button>
                    )}
                    {award.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Contract
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Download Invoice
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
