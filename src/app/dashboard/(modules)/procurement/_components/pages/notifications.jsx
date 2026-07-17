'use client';

import { Bell, CheckCheck } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardBody, CardHeader } from '../components/ui/card';
export function Notifications() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with system alerts and messages</p>
          </div>
          <Button variant="outline">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        <Card>
          <CardHeader
            title="All Notifications"
            description="Recent system notifications and alerts"
          />
          <CardBody>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
