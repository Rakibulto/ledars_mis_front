'use client';

import { Award } from 'lucide-react';

import { Card, CardBody, CardHeader } from '../components/ui/card';
export function Awards() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Awards</h1>
          <p className="text-muted-foreground">Contract awards and vendor selection</p>
        </div>

        <Card>
          <CardHeader title="Contract Awards" description="Awarded contracts to vendors" />
          <CardBody>
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No awards issued</h3>
              <p className="text-muted-foreground">Contract awards will appear here once issued</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
