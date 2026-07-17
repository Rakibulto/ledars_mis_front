'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { Iconify } from 'src/components/iconify';

import { useA2HS } from './A2HSContext';

export default function A2HSPrompt() {
  const { isInstallable, isInstalled, installApp, dismissPrompt } = useA2HS();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show prompt if not already shown in this session
    if (typeof window === 'undefined') return undefined;
    if (sessionStorage.getItem('a2hsPromptShown')) return undefined;

    let timer;
    if (isInstallable && !isInstalled) {
      timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('a2hsPromptShown', 'true');
      }, 3000); // Show after 3 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isInstallable, isInstalled]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    dismissPrompt();
  };

  const handleInstall = () => {
    installApp();
    setOpen(false);
  };

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          left: { xs: 8, sm: '50%' },
          transform: { xs: 'none', sm: 'translateX(-50%)' },
          right: { xs: 8, sm: 'auto' },
          bottom: { xs: 80, sm: 24 },
          width: { xs: 'calc(100% - 16px)', sm: 400, md: 480 },
          maxWidth: { xs: '100%', sm: 600 },
          p: 0,
          m: 0,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight="bold">
              Add to Home Screen
            </Typography>
            <IconButton size="small" onClick={handleClose} edge="end">
              <Iconify icon="eva:close-fill" width={20} height={20} />
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Install this app on your device for quick access and a better experience.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="eva:download-fill" width={20} height={20} />}
            onClick={handleInstall}
            sx={{ alignSelf: 'flex-end', mt: 1 }}
          >
            Install App
          </Button>
        </Box>
      </Snackbar>
    </ClickAwayListener>
  );
}
