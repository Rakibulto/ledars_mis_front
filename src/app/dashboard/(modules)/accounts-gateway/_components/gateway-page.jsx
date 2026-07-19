'use client';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GatewayProjectBar } from './gateway-project-bar';

/**
 * Shared page chrome matching HRM list/form pages:
 * DashboardContent + CustomBreadcrumbs + project context bar.
 */
export function GatewayPage({
  heading,
  links = [],
  action,
  children,
  showProjectBar = true,
  maxWidth = 'xxl',
}) {
  return (
    <DashboardContent maxWidth={maxWidth}>
      <CustomBreadcrumbs
        heading={heading}
        links={links}
        action={action}
        sx={{ mb: { xs: 3, md: showProjectBar ? 3 : 5 } }}
      />
      {showProjectBar && <GatewayProjectBar />}
      {children}
    </DashboardContent>
  );
}
