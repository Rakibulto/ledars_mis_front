'use client';

import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';

function DatePicker({ value, onChange, placeholder = 'Select date', disabled, className }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        format="DD/MM/YYYY"
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          if (newValue && dayjs(newValue).isValid()) {
            onChange?.(dayjs(newValue).format('YYYY-MM-DD'));
          } else {
            onChange?.('');
          }
        }}
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            size: 'small',
            placeholder,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'background.paper',
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}

export { DatePicker };
