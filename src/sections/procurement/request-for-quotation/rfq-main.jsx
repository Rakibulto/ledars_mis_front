'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';

import { endpoints } from 'src/utils/axios';
import { fDate, formatStr } from 'src/utils/format-time';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const parseValue = (value) => {
  const parsed = Number.parseFloat(value || 0);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatUGX = (value) => {
  const amount = parseValue(value);

  return `UGX ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getStatusStyles = (status) => {
  const state = String(status || '').toLowerCase();

  if (state === 'draft') {
    return {
      tone: 'info',
      icon: 'solar:pen-2-bold-duotone',
    };
  }

  if (state === 'sent') {
    return {
      tone: 'primary',
      icon: 'solar:plain-2-bold-duotone',
    };
  }

  if (state === 'responded') {
    return {
      tone: 'success',
      icon: 'solar:check-circle-bold-duotone',
    };
  }

  if (state === 'closed') {
    return {
      tone: 'error',
      icon: 'solar:close-circle-bold-duotone',
    };
  }

  return {
    tone: 'default',
    icon: 'solar:clipboard-text-bold-duotone',
  };
};

function SummaryStatCard({ title, value, icon, bgcolor, boxShadow, loading }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor,
        color: '#fff',
        boxShadow,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <>
            <Skeleton
              variant="text"
              width={90}
              sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 0.75 }}
            />
            <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ opacity: 0.92, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {value}
            </Typography>
          </>
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.85,
        }}
      >
        <Iconify icon={icon} width={26} />
      </Box>
    </Card>
  );
}

function RFQRowCard({ rfq }) {
  console.log('Rendering RFQRowCard for:', rfq);
  const statusStyles = getStatusStyles(rfq?.status);

  return (
    <Card
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) => theme.customShadows?.z4 || 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {rfq?.rfq_number}
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.1,
                py: 0.25,
                borderRadius: 10,
                bgcolor:
                  statusStyles.tone === 'success'
                    ? 'success.lighter'
                    : statusStyles.tone === 'error'
                      ? 'error.lighter'
                      : statusStyles.tone === 'info'
                        ? 'info.lighter'
                        : statusStyles.tone === 'primary'
                          ? 'primary.lighter'
                          : 'grey.200',
                color:
                  statusStyles.tone === 'success'
                    ? 'success.dark'
                    : statusStyles.tone === 'error'
                      ? 'error.dark'
                      : statusStyles.tone === 'info'
                        ? 'info.dark'
                        : statusStyles.tone === 'primary'
                          ? 'primary.dark'
                          : 'text.secondary',
              }}
            >
              <Iconify icon={statusStyles.icon} width={14} />
              <Typography variant="caption" fontWeight={600}>
                {rfq?.status || 'Unknown'}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75 }}>
            {rfq?.title || 'Untitled RFQ'}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {rfq?.description || 'No description available'}
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            flexWrap="wrap"
            sx={{ color: 'text.secondary' }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Iconify icon="solar:calendar-bold-duotone" width={15} />
              <Typography variant="body2">
                Due: {fDate(rfq?.due_date, formatStr.split.date)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Iconify icon="solar:users-group-rounded-bold-duotone" width={15} />
              <Typography variant="body2">{rfq?.suppliers_count || 0} Suppliers</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Iconify icon="solar:check-circle-bold-duotone" width={15} />
              <Typography variant="body2">{rfq?.responses_received || 0} Responses</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Iconify icon="solar:box-bold-duotone" width={15} />
              <Typography variant="body2">{rfq?.items_count || 0} Items</Typography>
            </Stack>
          </Stack>
        </Box>

        <Stack
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={1.5}
          sx={{ minWidth: { xs: 120, sm: 170 } }}
        >
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Value
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {formatUGX(rfq?.total_estimated_value)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            }}
          >
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.lighter',
                },
              }}
            >
              View Details
            </Button>
            {rfq?.status === 'Draft' && (
              <Button
                variant="contained"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  borderColor: 'primary.main',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.lighter',
                  },
                }}
              >
                Send
                {/* Send to Suppliers */}
              </Button>
            )}
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function RFQMain() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const rfqListUrl = `${endpoints.procurement.request_for_quotation}?search=${encodeURIComponent(searchQuery)}&page=${page + 1}&pagination=true`;
  const { data: rfqData, loading } = useGetRequest(rfqListUrl);

  const { data: summaryData, loading: summaryLoading } = useGetRequest(
    `${endpoints.procurement.request_for_quotation}summary/`
  );

  //   {
  //     "total_rfqs": 13,
  //     "active_rfqs": 10,
  //     "responses": 629,
  //     "total_value": "UGX 0.0M"
  // }

  const shouldShowLoading = loading;

  const filteredRfqs = rfqData || {};
  console.log('RFQ API Response:', rfqData.results);
  // console.log('RFQ Data:', rfqData);
  const ROWS_PER_PAGE = filteredRfqs?.page_size || 10;
  // Calculate total pages based on API response
  const totalPages = useMemo(() => {
    const total = filteredRfqs?.total ?? 0;

    return Math.ceil(total / ROWS_PER_PAGE);
  }, [filteredRfqs?.total, ROWS_PER_PAGE]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Request for Quotation (RFQ)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage RFQs to suppliers
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 2.5,
            borderColor: 'primary.main',
            color: 'primary.main',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: 'primary.lighter',
            },
          }}
        >
          Create RFQ
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryStatCard
            title="Total RFQs"
            value={summaryData?.total_rfqs || 0}
            icon="solar:document-text-bold-duotone"
            bgcolor="primary.main"
            boxShadow="0 6px 20px rgba(37, 99, 235, 0.24)"
            loading={shouldShowLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryStatCard
            title="Active RFQs"
            value={summaryData?.active_rfqs || 0}
            icon="solar:plain-2-bold-duotone"
            bgcolor="success.main"
            boxShadow="0 6px 20px rgba(22, 163, 74, 0.24)"
            loading={shouldShowLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryStatCard
            title="Responses"
            value={summaryData?.responses || 0}
            icon="solar:check-circle-bold-duotone"
            bgcolor="info.main"
            boxShadow="0 6px 20px rgba(14, 165, 233, 0.24)"
            loading={shouldShowLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryStatCard
            title="Total Value"
            value={formatUGX(summaryData?.total_value || 0)}
            icon="solar:wallet-money-bold-duotone"
            bgcolor="warning.main"
            boxShadow="0 6px 20px rgba(217, 119, 6, 0.24)"
            loading={shouldShowLoading}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          mb: 2.5,
          p: 1.5,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.z4 || 'none',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search RFQs..."
          value={searchQuery}
          onChange={(event) => {
            setPage(0);
            setSearchQuery(event.target.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              bgcolor: 'background.paper',
            },
          }}
        />
      </Card>

      <Stack spacing={2}>
        {shouldShowLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`rfq-skeleton-${index}`}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Skeleton variant="text" width={180} />
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="65%" />
                <Skeleton variant="rectangular" width="100%" height={30} sx={{ mt: 1 }} />
              </Card>
            ))
          : filteredRfqs?.results?.map((rfq) => <RFQRowCard key={rfq?.id} rfq={rfq} />)}

        {!shouldShowLoading && filteredRfqs?.results?.length === 0 && (
          <Card
            sx={{
              p: 6,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              textAlign: 'center',
            }}
          >
            <Iconify
              icon="solar:clipboard-remove-bold-duotone"
              width={56}
              sx={{ color: '#9ca3af', mb: 1.5 }}
            />
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              No RFQs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try changing your search term.
            </Typography>
          </Card>
        )}
      </Stack>

      <Box
        sx={{
          mt: 2.5,
          py: 1.5,
          px: { xs: 0.5, sm: 0 },
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Pagination
          count={totalPages}
          page={Math.min(page + 1, totalPages)}
          onChange={(_, pageNumber) => setPage(pageNumber - 1)}
          variant="outlined"
          shape="rounded"
          color="primary"
        />
      </Box>
    </Box>
  );
}
