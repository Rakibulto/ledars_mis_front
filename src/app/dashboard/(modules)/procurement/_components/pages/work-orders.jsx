'use client';

import { Plus, Clipboard } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
export function WorkOrders() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Work Orders</h1>
            <p className="text-muted-foreground">Purchase orders and work order management</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Work Order
          </Button>
        </div>

        <Card>
          <CardHeader
            title="Active Work Orders"
            description="Current purchase orders and work orders"
          />
          <CardBody>
            <div className="text-center py-12">
              <Clipboard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No work orders</h3>
              <p className="text-muted-foreground mb-6">
                Create work orders to manage vendor deliveries
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Work Order
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
