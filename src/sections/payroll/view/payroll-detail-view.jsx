'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useGetPayrollById } from 'src/actions/payroll';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetCompanyInfo } from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PayrollInvoicePDF } from '../payroll-invoice-pdf';
import { PayrollInvoiceDetails } from '../payroll-invoice-details';

// ----------------------------------------------------------------------

export function PayrollDetailView({ id }) {
  const { payroll, payrollLoading } = useGetPayrollById(id);
  const { companyInfo, companyInfoLoading } = useGetCompanyInfo();

  if (payrollLoading || companyInfoLoading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 20 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!payroll) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Payroll Not Found"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Payroll', href: paths.dashboard.payroll.list },
            { name: 'Not Found' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
      </DashboardContent>
    );
  }

  const employeeName = payroll.employee?.split(' - ')?.[0] || payroll.employee || '';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Payslip #${payroll.id}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payroll', href: paths.dashboard.payroll.list },
          { name: `${employeeName} â€“ ${payroll.payroll_month} ${payroll.payroll_year}` },
        ]}
        action={
          <Stack direction="row" spacing={1.5}>
            <PDFDownloadLink
              document={<PayrollInvoicePDF payroll={payroll} companyInfo={companyInfo} />}
              fileName={`Payslip_${employeeName.replace(/\s+/g, '_')}_${payroll.payroll_month}_${payroll.payroll_year}.pdf`}
              style={{ textDecoration: 'none' }}
            >
              {({ loading }) => (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Iconify icon="eva:cloud-download-fill" />
                    )
                  }
                  disabled={loading}
                >
                  {loading ? 'Preparing...' : 'Download PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PayrollInvoiceDetails payroll={payroll} companyInfo={companyInfo} />
    </DashboardContent>
  );
}
