'use client';

import dayjs from 'dayjs';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider as Provider } from '@mui/x-date-pickers/LocalizationProvider';

// ----------------------------------------------------------------------

export function LocalizationProvider({ children }) {
  // Set default locale to English
  dayjs.locale('en');

  return (
    <Provider dateAdapter={AdapterDayjs} adapterLocale="en">
      {children}
    </Provider>
  );
}
