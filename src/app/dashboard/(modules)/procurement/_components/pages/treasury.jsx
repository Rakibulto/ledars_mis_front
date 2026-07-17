'use client';

import { Wallet } from 'lucide-react';

import { Card, CardBody, CardHeader } from '../components/ui/card';

export function Treasury() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Treasury Tracking
          </h1>
          <p className="text-sm text-muted-foreground">Financial tracking and payment processing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
                <p className="text-2xl font-semibold text-foreground">$0</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
                <p className="text-2xl font-semibold text-info">$0</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Paid This Month</p>
                <p className="text-2xl font-semibold text-success">$0</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Payment Queue" description="Approved payments ready for processing" />
          <CardBody>
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No payments in queue</h3>
              <p className="text-muted-foreground">
                Approved payment requisitions will appear here
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
