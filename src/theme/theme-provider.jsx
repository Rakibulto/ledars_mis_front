'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

import { defaultSettings, useSettingsContext } from 'src/components/settings';

import { createTheme } from './create-theme';

// ----------------------------------------------------------------------

export function ThemeProvider({ children }) {
  const settings = useSettingsContext();

  const theme = createTheme(settings);

  return (
    <AppRouterCacheProvider options={{ key: 'css' }}>
      <MuiThemeProvider theme={theme} defaultMode={defaultSettings.colorScheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
}
