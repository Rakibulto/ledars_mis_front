'use client';

import { Plus, Package } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
export function GRN() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Goods Receive Notes</h1>
            <p className="text-muted-foreground">Receive and verify incoming goods</p>
          </div>
          <Button size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create GRN
          </Button>
        </div>

        <Card padding="none">
          <CardHeader title="Pending Receipts" description="Goods awaiting receipt verification" />
          <CardBody>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No pending receipts</h3>
              <p className="text-muted-foreground mb-6">Receive goods against purchase orders</p>
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create GRN
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
