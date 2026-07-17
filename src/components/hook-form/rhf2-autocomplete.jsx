'use client';

import { Controller } from 'react-hook-form';

import { TextField, Autocomplete } from '@mui/material';

export default function RHFAutocomplete({
  onChangeState,
  name,
  control,
  options = [],
  loading = false,
  label,
  errors,
  optionLabel = 'name',
  optionValue = 'id',
  sx,
  ...other
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: `${label} is required` }}
      render={({ field }) => (
        <Autocomplete
          options={options}
          loading={loading}
          getOptionLabel={(option) => option?.[optionLabel] || ''}
          value={options.find((item) => item[optionValue] === field.value) || null}
          isOptionEqualToValue={(option, value) => option?.[optionValue] === value?.[optionValue]}
          onChange={(_, value) => {
            field.onChange(value ? value[optionValue] : null);
            if (onChangeState) onChangeState(value);
          }}
          renderOption={(props, option) => (
            <li {...props} key={option[optionValue]}>
              {option[optionLabel]}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: sx?.borderRadius || 2,
                },
              }}
              {...params}
              label={label}
              error={!!errors?.[name]}
              helperText={errors?.[name]?.message}
            />
          )}
          sx={sx}
          {...other}
        />
      )}
    />
  );
}
