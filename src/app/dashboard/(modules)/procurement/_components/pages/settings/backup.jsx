'use client';

import { Clock, Upload, Download, Database, HardDrive, RefreshCw, CheckCircle } from 'lucide-react';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockBackups = [
  {
    id: 'BKP-001',
    date: '2026-04-05 02:00',
    type: 'Scheduled',
    size: '2.4 GB',
    duration: '8 min',
    status: 'success',
    retention: '90 days',
    location: 'Azure Blob Storage',
  },
  {
    id: 'BKP-002',
    date: '2026-04-04 02:00',
    type: 'Scheduled',
    size: '2.4 GB',
    duration: '7 min',
    status: 'success',
    retention: '90 days',
    location: 'Azure Blob Storage',
  },
  {
    id: 'BKP-003',
    date: '2026-04-03 14:30',
    type: 'Manual',
    size: '2.3 GB',
    duration: '9 min',
    status: 'success',
    retention: 'Permanent',
    location: 'Azure Blob Storage',
  },
  {
    id: 'BKP-004',
    date: '2026-04-03 02:00',
    type: 'Scheduled',
    size: '2.3 GB',
    duration: '7 min',
    status: 'success',
    retention: '90 days',
    location: 'Azure Blob Storage',
  },
  {
    id: 'BKP-005',
    date: '2026-04-02 02:00',
    type: 'Scheduled',
    size: '2.3 GB',
    duration: '8 min',
    status: 'success',
    retention: '90 days',
    location: 'Azure Blob Storage',
  },
  {
    id: 'BKP-006',
    date: '2026-04-01 02:00',
    type: 'Scheduled',
    size: '2.3 GB',
    duration: '12 min',
    status: 'warning',
    retention: '90 days',
    location: 'Azure Blob Storage',
  },
];
export function BackupSettings() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Backup & Recovery</h1>
          <p className="text-muted-foreground">
            Manage system backups, restore points, and disaster recovery
          </p>
        </div>
        <Button variant="primary">
          <HardDrive className="w-4 h-4 mr-2" />
          Create Backup Now
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard title="Last Backup" value="5h ago" icon={Clock} color="green" />
        <StatCard title="Total Backups" value={mockBackups.length} icon={Database} color="blue" />
        <StatCard title="Storage Used" value="14.2 GB" icon={HardDrive} color="purple" />
        <StatCard title="Success Rate" value="98%" icon={CheckCircle} color="orange" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Schedule Config */}
        <Card>
          <CardHeader title="Backup Schedule" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Daily Backup</span>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Time: 02:00 AM (BST)</p>
                <p>Retention: 90 days</p>
                <p>Next run: 2026-04-06 02:00</p>
              </div>
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm text-foreground">Weekly Full Backup</span>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Day: Every Sunday</p>
                <p>Retention: 1 year</p>
                <p>Next run: 2026-04-12 03:00</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader title="Storage Overview" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Azure Blob Storage</span>
                  <span className="text-muted-foreground">14.2 / 100 GB</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: '14.2%' }} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Daily backups: 12 files (28.3 GB)</p>
                <p>Weekly backups: 8 files (19.2 GB)</p>
                <p>Manual backups: 3 files (7.0 GB)</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recovery */}
        <Card>
          <CardHeader title="Disaster Recovery" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">RPO (Recovery Point Objective)</span>
                <span className="text-sm font-semibold">24 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">RTO (Recovery Time Objective)</span>
                <span className="text-sm font-semibold">4 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Last DR Test</span>
                <span className="text-sm font-semibold">2026-03-15</span>
              </div>
              <div className="pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="w-full">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Test Recovery
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader title="Backup History" />
        <CardBody>
          <table className="w-full">
            <thead className="border-b-2 border-border">
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">ID</th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                  Date & Time
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Type
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-right">
                  Size
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Duration
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Status
                </th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase">Retention</th>
                <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockBackups.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 pr-3 text-sm font-medium text-primary">{b.id}</td>
                  <td className="py-3 pr-3 text-sm text-foreground">{b.date}</td>
                  <td className="py-3 pr-3 text-center">
                    <Badge variant={b.type === 'Manual' ? 'info' : 'default'} size="sm">
                      {b.type}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-sm text-right font-medium">{b.size}</td>
                  <td className="py-3 pr-3 text-sm text-center text-muted-foreground">
                    {b.duration}
                  </td>
                  <td className="py-3 pr-3 text-center">
                    <Badge variant={b.status === 'success' ? 'success' : 'warning'} size="sm">
                      {b.status === 'success' ? 'Success' : 'Partial'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-3 text-sm text-muted-foreground">{b.retention}</td>
                  <td className="py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
