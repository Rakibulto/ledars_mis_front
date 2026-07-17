import 'src/global.css';

import Script from 'next/script';

import axios, { endpoints } from 'src/utils/axios';

import { primary } from 'src/theme/core/palette';
import { LocalizationProvider } from 'src/locales';
import { schemeConfig } from 'src/theme/scheme-config';
import { ThemeProvider } from 'src/theme/theme-provider';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { ErrorBoundary } from 'src/components/error-boundary';
import { A2HSPrompt, A2HSProvider } from 'src/components/a2hs';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import ProjectProvider from 'src/auth/context/project-provider';
import { AuthProvider as JwtAuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

const AuthProvider = JwtAuthProvider;

function getInitColorSchemeScript({
  attribute = 'data-color-scheme',
  defaultMode = 'system',
  defaultLightColorScheme = 'light',
  defaultDarkColorScheme = 'dark',
  modeStorageKey = 'mui-mode',
  colorSchemeStorageKey = 'mui-color-scheme',
  colorSchemeNode = 'document.documentElement',
}) {
  let setter = '';
  let normalizedAttribute = attribute;

  if (attribute === 'class') {
    normalizedAttribute = '.%s';
  }

  if (attribute === 'data') {
    normalizedAttribute = '[data-%s]';
  }

  if (normalizedAttribute.startsWith('.')) {
    const selector = normalizedAttribute.substring(1);

    setter += `${colorSchemeNode}.classList.remove('${selector}'.replace('%s', light), '${selector}'.replace('%s', dark));`;
    setter += `${colorSchemeNode}.classList.add('${selector}'.replace('%s', colorScheme));`;
  }

  const matches = normalizedAttribute.match(/\[([^[\]]+)\]/);

  if (matches) {
    const [attr, value] = matches[1].split('=');

    if (!value) {
      setter += `${colorSchemeNode}.removeAttribute('${attr}'.replace('%s', light));`;
      setter += `${colorSchemeNode}.removeAttribute('${attr}'.replace('%s', dark));`;
    }

    setter += `${colorSchemeNode}.setAttribute('${attr}'.replace('%s', colorScheme), ${value ? `${value}.replace('%s', colorScheme)` : '""'});`;
  } else if (normalizedAttribute !== '.%s') {
    setter += `${colorSchemeNode}.setAttribute('${normalizedAttribute}', colorScheme);`;
  }

  return `(function(){try{let colorScheme='';const mode=localStorage.getItem('${modeStorageKey}')||'${defaultMode}';const dark=localStorage.getItem('${colorSchemeStorageKey}-dark')||'${defaultDarkColorScheme}';const light=localStorage.getItem('${colorSchemeStorageKey}-light')||'${defaultLightColorScheme}';if(mode==='system'){const mql=window.matchMedia('(prefers-color-scheme: dark)');colorScheme=mql.matches?dark:light;}if(mode==='light'){colorScheme=light;}if(mode==='dark'){colorScheme=dark;}if(colorScheme){${setter}}}catch(e){}})();`;
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: primary.main,
};

export async function generateMetadata() {
  try {
    const res = await axios.get(endpoints.companyInfo);
    const companyName = res?.data?.company_name || 'Leadars Management NGO HRM';

    return {
      title: companyName,
      description: 'Management Information System for Ledars Management NGO',
      manifest: '/manifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: companyName,
      },
      formatDetection: {
        telephone: false,
      },
      icons: {
        shortcut: res?.data?.favicon || '/icons/logo.png',
        apple: [
          { url: res?.data?.logo || '/icons/apple-touch-icon.png' },
          { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    };
  } catch (err) {
    return {
      title: 'Ledars Management NGO HRM',
      description: 'Management Information System for Ledars Management NGO',
      manifest: '/manifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Ledars Management NGO HRM',
      },
      formatDetection: {
        telephone: false,
      },
      icons: {
        shortcut: '/icons/icon-192x192.png',
        apple: [
          { url: '/icons/apple-touch-icon.png' },
          { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
    };
  }
}

export default async function RootLayout({ children }) {
  let companyInfo = null;
  try {
    const res = await axios.get(endpoints.companyInfo);
    companyInfo = res.data;
  } catch (err) {
    companyInfo = null; // fallback to defaults below
  }

  const companyName = companyInfo?.company_name ?? 'Ledars Management NGO HRM';
  const faviconUrl = companyInfo?.favicon ?? '/favicon.ico';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{companyName}</title>
        <meta name="application-name" content={companyName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={companyName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={primary.main} />
        <link rel="icon" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={companyInfo?.logo ?? '/icons/apple-touch-icon.png'} />
        <link rel="manifest" href="/manifest" />
      </head>
      <body>
        <Script id="mui-color-scheme-init" strategy="beforeInteractive">
          {getInitColorSchemeScript({
            attribute: schemeConfig.colorSchemeSelector,
            defaultMode: schemeConfig.defaultMode,
            modeStorageKey: schemeConfig.modeStorageKey,
          })}
        </Script>

        <LocalizationProvider>
          <ProjectProvider>
            <AuthProvider>
              <SettingsProvider settings={defaultSettings}>
                <ThemeProvider>
                  <MotionLazy>
                    <ErrorBoundary>
                      <A2HSProvider>
                        <Snackbar />
                        <ProgressBar />
                        <SettingsDrawer />
                        <A2HSPrompt />
                        {children}
                      </A2HSProvider>
                    </ErrorBoundary>
                  </MotionLazy>
                </ThemeProvider>
              </SettingsProvider>
            </AuthProvider>
          </ProjectProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
