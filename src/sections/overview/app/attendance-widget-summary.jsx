import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

export function AttendanceWidgetSummary({ sx, icon, title, total, color = 'warning', ...other }) {
  const isClickable = typeof other.onClick === 'function';

  return (
    <Card
      sx={{
        py: 3,
        pl: 3,
        pr: 2.5,
        ...(isClickable && { cursor: 'pointer' }),
        ...sx,
      }}
      {...other}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            typography: 'h3',
            ...(isClickable && {
              '&:hover': { textDecoration: 'underline' },
            }),
          }}
        >
          {fNumber(total)}
          {isClickable && (
            <Iconify
              icon="solar:round-arrow-right-up-bold-duotone"
              width={20}
              height={20}
              sx={{ ml: 0.5, color: 'primary.main', mt: 0.25 }}
            />
          )}
        </Box>
        <Typography noWrap variant="subtitle2" component="div" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
      </Box>

      {icon && (
        <SvgColor
          src={icon}
          sx={{
            top: 24,
            right: 20,
            width: 36,
            height: 36,
            position: 'absolute',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.vars.palette[color].main} 0%, ${theme.vars.palette[color].dark} 100%)`,
          }}
        />
      )}

      <Box
        sx={{
          top: -44,
          width: 160,
          zIndex: -1,
          height: 160,
          right: -104,
          opacity: 0.12,
          borderRadius: 3,
          position: 'absolute',
          transform: 'rotate(40deg)',
          background: (theme) =>
            `linear-gradient(to right, ${
              theme.vars.palette[color].main
            } 0%, ${varAlpha(theme.vars.palette[color].mainChannel, 0)} 100%)`,
        }}
      />
    </Card>
  );
}
