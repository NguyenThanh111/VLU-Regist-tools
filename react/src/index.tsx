import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, Theme, ThemeProvider, adaptV4Theme, createTheme } from '@mui/material/styles';

import { SnackbarProvider } from 'notistack';
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga4';
import { ThemeMode, useThemeMode } from './themeMode';
import { buildTracker } from './tracker';
import { checkAdBlocker } from './tracking.utils';
import { useDrawerStore, useUtilsStore } from './zus';

import App from './views/App';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


export const tracker = buildTracker();
checkAdBlocker().then((hasAdBlocker) => {
  tracker.updateProperty('hasAdBlocker', hasAdBlocker);
  tracker.updateProperty('leftDrawerInitiallyOpen', useDrawerStore.getState().isDrawerOpen);
  useUtilsStore.setState({ hasAdBlocker });
});

ReactGA.initialize('G-HK94GQMRY2');

export const THEME_PALETTES: Record<ThemeMode, object> = {
  light: {
    palette: {
      mode: 'light',
      primary: { main: '#7e2a33' },
      secondary: { main: '#1c4e80' },
      background: { default: '#fafaf8', paper: '#ffffff' },
      text: { primary: '#20242a', secondary: '#5c6470' },
    },
  },
  dark: {
    palette: {
      mode: 'dark',
      primary: { main: '#c64a57' },
      secondary: { main: '#5b93d8' },
      background: { default: '#0a1628', paper: '#0f1d33' },
      text: { primary: '#e2e8f0', secondary: '#8fa3bd' },
    },
  },
};

const FONT_SANS = `"Be Vietnam Pro", "Inter", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
  'Noto Color Emoji'`;

function buildTheme(mode: ThemeMode) {
  return createTheme(
    adaptV4Theme({
      ...THEME_PALETTES[mode],
      typography: {
        fontFamily: FONT_SANS,
        h4: { fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontWeight: 600 },
        h5: { fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontWeight: 600 },
        h6: { fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontWeight: 600 },
        subtitle1: { fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontWeight: 600 },
        subtitle2: { fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif', fontWeight: 600 },
      },
    }),
  );
}

function Root() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.render(
  <SnackbarProvider>
    <StyledEngineProvider injectFirst>
      <Root />
    </StyledEngineProvider>
  </SnackbarProvider>,
  document.getElementById('root'),
);