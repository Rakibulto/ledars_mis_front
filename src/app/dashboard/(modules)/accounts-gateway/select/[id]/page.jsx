'use client';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useGatewayProject } from '../../_components/gateway-project-context';

/**
 * Nav project picker — sets working project then redirects to gateway dashboard
 * so the Projects submenu can collapse (query-style links falsely stay "active").
 */
export default function SelectGatewayProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { setProjectId, projects, loading } = useGatewayProject();
  const id = Number(params?.id);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      router.replace(paths.dashboard.accountsGateway.projects);
      return;
    }
    if (loading) return;
    if (projects.length && !projects.some((p) => p.id === id)) {
      router.replace(paths.dashboard.accountsGateway.projects);
      return;
    }
    setProjectId(id);
    router.replace(paths.dashboard.accountsGateway.root);
  }, [id, loading, projects, setProjectId, router]);

  return (
    <Box
      sx={{
        minHeight: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Opening project books…
      </Typography>
    </Box>
  );
}
