import { m } from 'framer-motion';

import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function BaseOption({ icon, label, tooltip, selected, ...other }) {
  return (
    <ButtonBase
      disableRipple
      sx={{
        p: 1,
        cursor: 'pointer',
      }}
      {...other}
    >
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {!selected ? (
          <Iconify icon="line-md:moon-rising-filled-alt-loop" width={24} color="#6d28d9" />
        ) : (
          <Iconify
            icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition"
            width={24}
            color="#eab308"
          />
        )}
      </m.div>
    </ButtonBase>
  );
}
