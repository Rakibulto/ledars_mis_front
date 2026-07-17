'use client';

import { Plus, Users } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';

export function Vendors() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Vendors</h1>
            <p className="text-muted-foreground">Manage vendor registrations and performance</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Vendors</p>
                <p className="text-2xl font-semibold text-foreground">0</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-semibold text-success">0</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                <p className="text-2xl font-semibold text-warning">0</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Blacklisted</p>
                <p className="text-2xl font-semibold text-danger">0</p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Vendor Directory" description="Registered vendors and suppliers" />
          <CardBody>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No vendors registered</h3>
              <p className="text-muted-foreground mb-6">
                Add vendors to start the procurement process
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
