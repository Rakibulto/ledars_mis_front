'use client';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
// import Link from '@mui/material/Link';
// import { paths } from 'src/routes/paths';
// import { RouterLink } from 'src/routes/components';
import { useColorScheme } from '@mui/material/styles';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';
import { BaseOption } from 'src/components/settings/drawer/base-option';

import { Main, CompactContent } from './main';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';

// ----------------------------------------------------------------------

export function SimpleLayout({ sx, children, header, content }) {
  const layoutQuery = 'md';

  const settings = useSettingsContext();

  const { mode, setMode } = useColorScheme();

  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={
        <HeaderSection
          layoutQuery={layoutQuery}
          slotProps={{ container: { maxWidth: false } }}
          sx={header?.sx}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
            leftArea: <Logo />,
            rightArea: (
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 1.5 }}>
                {/* -- Help link -- */}
                {/* <Link
                  href={paths.faqs}
                  component={RouterLink}
                  color="inherit"
                  sx={{ typography: 'subtitle2' }}
                >
                  Need help?
                </Link> */}
                {/* -- Settings button -- */}
                <BaseOption
                  selected={settings.colorScheme === 'dark'}
                  onClick={() => {
                    settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
                    setMode(mode === 'light' ? 'dark' : 'light');
                  }}
                />
              </Box>
            ),
          }}
        />
      }
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{
        '--layout-simple-content-compact-width': '448px',
      }}
      sx={sx}
    >
      <Main>
        {content?.compact ? (
          <CompactContent layoutQuery={layoutQuery}>{children}</CompactContent>
        ) : (
          children
        )}
      </Main>
    </LayoutSection>
  );
}
