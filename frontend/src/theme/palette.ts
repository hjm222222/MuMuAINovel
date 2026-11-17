export interface AppPalette {
  ink: string;
  inkSoft: string;
  inkMuted: string;
  paper: string;
  paperDeep: string;
  surface: string;
  surfaceMuted: string;
  hairline: string;
  hairlineStrong: string;
  brand: string;
  brandDeep: string;
  clay: string;
  success: string;
  warning: string;
  danger: string;
  shadowSoft: string;
  shadowLift: string;
  displayFont: string;
  bodyFont: string;
}

const BODY_FONT =
  "'Inter', 'HarmonyOS Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, sans-serif";

const DISPLAY_FONT =
  "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', 'SimSun', Georgia, serif";

export const lightPalette: AppPalette = {
  ink: '#20262B',
  inkSoft: '#4C565E',
  inkMuted: '#8A939B',
  paper: '#F7F5F0',
  paperDeep: '#F1EEE7',
  surface: '#FFFFFF',
  surfaceMuted: '#FBF9F5',
  hairline: '#E9E4DA',
  hairlineStrong: '#DBD4C6',
  brand: '#2F6B63',
  brandDeep: '#24534D',
  clay: '#B5734C',
  success: '#3E7A5C',
  warning: '#B57A38',
  danger: '#B04A3F',
  shadowSoft: '0 1px 2px rgba(32, 38, 43, 0.05), 0 12px 28px -18px rgba(32, 38, 43, 0.28)',
  shadowLift: '0 2px 4px rgba(32, 38, 43, 0.06), 0 24px 48px -24px rgba(32, 38, 43, 0.36)',
  displayFont: DISPLAY_FONT,
  bodyFont: BODY_FONT,
};

export const darkPalette: AppPalette = {
  ink: '#E9EDF0',
  inkSoft: '#B3BCC4',
  inkMuted: '#7E8991',
  paper: '#0F1316',
  paperDeep: '#0B0E11',
  surface: '#161B20',
  surfaceMuted: '#1B2126',
  hairline: '#262E34',
  hairlineStrong: '#313B42',
  brand: '#6FA9A2',
  brandDeep: '#8ABFBA',
  clay: '#D0916A',
  success: '#67AE87',
  warning: '#D2A05E',
  danger: '#D37167',
  shadowSoft: '0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 28px -18px rgba(0, 0, 0, 0.65)',
  shadowLift: '0 2px 4px rgba(0, 0, 0, 0.45), 0 24px 48px -24px rgba(0, 0, 0, 0.75)',
  displayFont: DISPLAY_FONT,
  bodyFont: BODY_FONT,
};

export const getPalette = (mode: 'light' | 'dark'): AppPalette =>
  mode === 'dark' ? darkPalette : lightPalette;
