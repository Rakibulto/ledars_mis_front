'use client';

import { useRouter } from 'next/navigation';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableNoData } from 'src/components/table';

import { GatewayPage } from '../_components/gateway-page';
import { useGatewayProject } from '../_components/gateway-project-context';

export default function GatewayProjectsPage() {
  const router = useRouter();
  const { projects, projectId, setProjectId, loading } = useGatewayProject();

  const selectAndOpenGateway = (id) => {
    setProjectId(id);
    router.push(paths.dashboard.accountsGateway.root);
  };

  return (
    <GatewayPage
      heading="NGO Projects"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Projects' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.projectManagements.projects.allProjects}
          variant="outlined"
          startIcon={<Iconify icon="solar:folder-with-files-bold-duotone" />}
        >
          Project Management
        </Button>
      }
      showProjectBar={false}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Projects come from Project Management. Select one to open Accounts Gateway with that
        working books context.
      </Typography>

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Short name</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading &&
                projects.map((p) => (
                  <TableRow key={p.id} hover selected={p.id === projectId}>
                    <TableCell>{p.code}</TableCell>
                    <TableCell>{p.short_name || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{p.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color="info">
                        {p.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={p.id === projectId ? 'contained' : 'outlined'}
                        onClick={() => selectAndOpenGateway(p.id)}
                      >
                        {p.id === projectId ? 'Open gateway' : 'Use & open'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              <TableNoData notFound={!loading && !projects.length} />
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </GatewayPage>
  );
}
