'use client';

import Link from 'next/link';
import { FileCheck, ArrowRight } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';

export function Quotations() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">Quotations</h1>
          <p className="text-sm text-muted-foreground">Review and manage vendor quotations</p>
        </div>

        <Card padding="none">
          <CardHeader
            title="Quotation Management"
            description="Access quotation opening and evaluation tools"
          />
          <CardBody>
            <div className="text-center py-8">
              <FileCheck className="w-6 h-6 text-primary mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1.5">
                Quotation Opening &amp; Evaluation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Securely open and evaluate vendor quotations after submission deadlines
              </p>
              <Link href={paths.dashboard.procurement.quotations.list}>
                <Button size="sm">
                  Go to Quotation Dashboard
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
