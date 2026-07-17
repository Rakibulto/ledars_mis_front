import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

export function RenderContentLoading({
  tableRowCount = 5,
  showFilters = true,
  showPagination = true,
  showAnalytics = true,
  analyticsCount = 4,
  analyticsLayout = 'row',
  mt = 3,
}) {
  const theme = useTheme();

  return (
    <Box mt={mt}>
      <LinearProgress
        color="blue"
        sx={{
          mb: 3,
          height: 6,
          borderRadius: 3,
          '& .MuiLinearProgress-bar': {
            borderRadius: 3,
          },
        }}
      />

      {showAnalytics && (
        <Card
          sx={{
            mb: showPagination || showFilters || tableRowCount > 0 ? 4 : 0,
            overflow: 'hidden',
            boxShadow: theme.customShadows?.z8,
            borderRadius: 3,
          }}
        >
          {analyticsLayout === 'row' ? (
            <Stack direction="row" spacing={2} sx={{ p: 3 }}>
              {[...Array(analyticsCount)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={200}
                  height={100}
                  sx={{ borderRadius: 2.5 }}
                />
              ))}
            </Stack>
          ) : (
            <Grid container spacing={3} sx={{ p: 3 }}>
              {[...Array(analyticsCount)].map((_, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      )}

      <Card>
        {showFilters && (
          <Stack direction="row" spacing={1} sx={{ p: 2, pb: 1 }}>
            {[...Array(4)].map((_, index) => (
              <Skeleton
                key={index}
                height={32}
                width={70}
                sx={{
                  borderRadius: 1,
                  opacity: 1 - index * 0.15,
                }}
              />
            ))}
          </Stack>
        )}

        {showFilters && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Skeleton height={40} width="100%" sx={{ maxWidth: 360, borderRadius: 1 }} />
          </Box>
        )}

        {tableRowCount > 0 && (
          <Box sx={{ p: 2 }}>
            <Skeleton height={36} sx={{ mb: 1, borderRadius: 1 }} />

            {[...Array(tableRowCount)].map((_, index) => (
              <Skeleton
                key={index}
                height={52}
                sx={{
                  my: 0.5,
                  borderRadius: 1,
                  opacity: 1 - index * 0.13,
                }}
              />
            ))}
          </Box>
        )}

        {showPagination && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton height={32} width={120} />
          </Box>
        )}
      </Card>
    </Box>
  );
}
