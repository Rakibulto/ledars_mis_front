'use client';

import { TextField, Autocomplete } from '@mui/material';

export default function MuiAutocomplete({
  value,
  onChange,
  options = [],
  loading = false,
  label,
  optionLabel = 'name',
  optionValue = 'id',
  sx,
  textFieldSx,
  error,
  helperText,
  ...other
}) {
  return (
    <Autocomplete
      options={options}
      loading={loading}
      getOptionLabel={(option) => option?.[optionLabel] || ''}
      value={options.find((item) => item[optionValue] === value) || null}
      isOptionEqualToValue={(option, val) => option?.[optionValue] === val?.[optionValue]}
      onChange={(_, val) => {
        onChange?.(val ? val[optionValue] : '', val);
      }}
      renderOption={(props, option) => (
        <li {...props} key={option[optionValue]}>
          {option[optionLabel]}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          error={error}
          helperText={helperText}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: sx?.borderRadius ?? 2,
              ...(textFieldSx || {}),
            },
          }}
        />
      )}
      sx={sx}
      {...other}
    />
  );
}
