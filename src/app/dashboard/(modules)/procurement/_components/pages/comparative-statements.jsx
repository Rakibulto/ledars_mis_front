'use client';

import { Plus, BarChart3 } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
export function ComparativeStatements() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Comparative Statements</h1>
            <p className="text-muted-foreground">Compare and analyze vendor quotations</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Comparison
          </Button>
        </div>

        <Card>
          <CardHeader
            title="Comparative Analysis"
            description="Side-by-side vendor quotation comparisons"
          />
          <CardBody>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No comparative statements
              </h3>
              <p className="text-muted-foreground mb-6">
                Create statements to compare vendor offers
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Statement
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
