'use client';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

function accountLabel(a) {
  if (!a) return '';
  return `${a.code || ''} — ${a.name || ''}`.trim();
}

/**
 * Searchable CoA account picker (replaces select dropdowns).
 *
 * @param {object[]} options - account list
 * @param {string|number|null} value - selected account id
 * @param {(id: string) => void} onChange
 */
export function AccountAutocomplete({
  options = [],
  value = '',
  onChange,
  label = 'Account',
  placeholder = 'Search code or name…',
  disabled = false,
  required = false,
  size = 'small',
  fullWidth = true,
  helperText,
  error = false,
  allowClear = true,
  sx,
  inputRef,
}) {
  const selected =
    options.find((a) => String(a.id) === String(value)) || null;

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      options={options}
      value={selected}
      sx={sx}
      getOptionLabel={(opt) => accountLabel(opt)}
      isOptionEqualToValue={(opt, val) => String(opt?.id) === String(val?.id)}
      filterOptions={(opts, state) => {
        const q = String(state.inputValue || '')
          .toLowerCase()
          .trim();
        if (!q) return opts;
        return opts.filter(
          (a) =>
            String(a.code || '')
              .toLowerCase()
              .includes(q) ||
            String(a.name || '')
              .toLowerCase()
              .includes(q)
        );
      }}
      onChange={(_e, opt) => {
        onChange?.(opt ? String(opt.id) : '');
      }}
      renderOption={(props, opt) => (
        <li {...props} key={opt.id}>
          {accountLabel(opt)}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          inputRef={inputRef}
        />
      )}
      clearOnEscape={allowClear}
      disableClearable={!allowClear}
    />
  );
}
