'use client';

import GlobalStyles from '@mui/material/GlobalStyles';

import { CurrencyProvider } from '../accounting-finance/_components/currency-context';

import { GatewayProjectProvider } from './_components/gateway-project-context';

export default function AccountsGatewayLayout({ children }) {
  return (
    <CurrencyProvider>
      <GatewayProjectProvider>
        <GlobalStyles
          styles={{
            '@media print': {
              'body *': {
                visibility: 'hidden !important',
              },
              '.print-area, .print-area *': {
                visibility: 'visible !important',
              },
              '.print-area': {
                position: 'absolute !important',
                left: '0 !important',
                top: '0 !important',
                width: '100% !important',
                margin: '0 !important',
                padding: '0 !important',
              },
              '.no-print, .no-print *': {
                display: 'none !important',
                visibility: 'hidden !important',
              },
              '@page': {
                size: 'A4',
                margin: '12mm',
              },
            },
          }}
        />
        {children}
      </GatewayProjectProvider>
    </CurrencyProvider>
  );
}
