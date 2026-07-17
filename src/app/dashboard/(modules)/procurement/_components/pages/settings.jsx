'use client';

import Link from 'next/link';
import { User, Bell, Grid, Globe, Shield, Palette } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Card, CardBody } from '../components/ui/card';

export function Settings() {
  const settingsCategories = [
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage procurement users and assignments',
      icon: User,
      href: paths.dashboard.procurement.settings.users,
    },
    {
      id: 'roles',
      name: 'Roles & Permissions',
      description: 'Control access and role ownership',
      icon: Shield,
      href: paths.dashboard.procurement.settings.roles,
    },
    {
      id: 'notifications',
      name: 'Notification Preferences',
      description: 'Configure alerts and emails',
      icon: Bell,
      href: paths.dashboard.procurement.settings.notifications,
    },
    {
      id: 'master-data',
      name: 'Master Data',
      description: 'Categories, account codes, and reference data',
      icon: Palette,
      href: paths.dashboard.procurement.settings.accountCodes,
    },
    {
      id: 'account-categories',
      name: 'Account Categories',
      description: 'Manage GL account categories used by account codes',
      icon: Grid,
      href: paths.dashboard.procurement.settings.accountCategories,
    },
    {
      id: 'workflow',
      name: 'Workflow Configuration',
      description: 'Approval workflows and processing rules',
      icon: Globe,
      href: paths.dashboard.procurement.settings.approvalMatrix,
    },
  ];
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={category.href} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardBody>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">→</div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
