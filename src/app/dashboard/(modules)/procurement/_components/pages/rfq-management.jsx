'use client';

import { Plus, MessageSquare } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
export function RFQManagement() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">RFQ Management</h1>
            <p className="text-muted-foreground">Manage Request for Quotations to vendors</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create RFQ
          </Button>
        </div>

        <Card>
          <CardHeader title="Active RFQs" description="Currently open requests for quotations" />
          <CardBody>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No active RFQs</h3>
              <p className="text-muted-foreground mb-6">Start requesting quotations from vendors</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create RFQ
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
