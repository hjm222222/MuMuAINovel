import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import type { ThemeMode } from './themeStorage';
import { getPalette, type AppPalette } from './palette';

export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>;

const buildToken = (palette: AppPalette): ThemeConfig['token'] => ({
  colorPrimary: palette.brand,
  colorInfo: palette.brand,
  colorSuccess: palette.success,
  colorWarning: palette.warning,
  colorError: palette.danger,
  colorLink: palette.brand,
  colorTextBase: palette.ink,
  colorText: palette.ink,
  colorTextSecondary: palette.inkSoft,
  colorTextTertiary: palette.inkMuted,
  colorTextQuaternary: palette.inkMuted,
  colorBgBase: palette.paper,
  colorBgLayout: palette.paper,
  colorBgContainer: palette.surface,
  colorBgElevated: palette.surface,
  colorFillTertiary: palette.surfaceMuted,
  colorBorder: palette.hairlineStrong,
  colorBorderSecondary: palette.hairline,
  colorSplit: palette.hairline,
  borderRadius: 10,
  borderRadiusLG: 16,
  borderRadiusSM: 8,
  borderRadiusXS: 6,
  controlHeight: 38,
  controlHeightLG: 44,
  controlHeightSM: 30,
  fontSize: 14,
  lineHeight: 1.72,
  fontFamily: palette.bodyFont,
  fontWeightStrong: 600,
  wireframe: false,
  motionDurationMid: '0.22s',
  motionEaseInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  boxShadow: palette.shadowSoft,
  boxShadowSecondary: palette.shadowLift,
  boxShadowTertiary: palette.shadowSoft,
});

const buildComponents = (palette: AppPalette, alpha: (color: string, value: number) => string): ThemeConfig['components'] => ({
  Layout: {
    bodyBg: palette.paper,
    headerBg: palette.surface,
    siderBg: palette.surface,
    headerPadding: '0 24px',
    headerHeight: 64,
    triggerBg: palette.surfaceMuted,
  },
  Menu: {
    itemBg: 'transparent',
    subMenuItemBg: 'transparent',
    itemSelectedBg: alpha(palette.brand, 0.1),
    itemSelectedColor: palette.brand,
    itemHoverBg: alpha(palette.ink, 0.05),
    itemColor: palette.inkSoft,
    itemBorderRadius: 10,
    itemHeight: 42,
    itemMarginInline: 10,
    itemMarginBlock: 3,
    itemPaddingInline: 12,
    iconSize: 16,
    iconMarginInlineEnd: 10,
    collapsedIconSize: 18,
    activeBarWidth: 0,
    activeBarBorderWidth: 0,
    subMenuItemBorderRadius: 10,
  },
  Card: {
    borderRadiusLG: 16,
    paddingLG: 22,
    headerFontSize: 15,
    headerHeight: 52,
    headerBg: 'transparent',
    boxShadowTertiary: palette.shadowSoft,
    colorBorderSecondary: palette.hairline,
  },
  Button: {
    controlHeight: 38,
    borderRadius: 10,
    borderRadiusSM: 8,
    fontWeight: 500,
    paddingInline: 18,
    primaryShadow: `0 10px 22px -14px ${alpha(palette.brand, 0.85)}`,
    defaultShadow: 'none',
    dangerShadow: 'none',
    defaultBorderColor: palette.hairlineStrong,
    defaultColor: palette.ink,
    defaultBg: palette.surface,
    defaultHoverBg: palette.surfaceMuted,
    defaultHoverBorderColor: alpha(palette.brand, 0.45),
    defaultHoverColor: palette.brand,
  },
  Input: {
    controlHeight: 38,
    borderRadius: 10,
    paddingInline: 12,
    hoverBorderColor: alpha(palette.brand, 0.45),
    activeBorderColor: palette.brand,
    activeShadow: `0 0 0 3px ${alpha(palette.brand, 0.12)}`,
    colorBgContainer: palette.surface,
  },
  InputNumber: {
    controlHeight: 38,
    borderRadius: 10,
    hoverBorderColor: alpha(palette.brand, 0.45),
    activeBorderColor: palette.brand,
    activeShadow: `0 0 0 3px ${alpha(palette.brand, 0.12)}`,
  },
  Select: {
    controlHeight: 38,
    borderRadius: 10,
    optionSelectedBg: alpha(palette.brand, 0.1),
    optionSelectedColor: palette.brand,
    optionHeight: 34,
    optionPadding: '6px 12px',
  },
  Table: {
    headerBg: palette.surfaceMuted,
    headerColor: palette.inkSoft,
    headerSplitColor: 'transparent',
    borderColor: palette.hairline,
    rowHoverBg: alpha(palette.brand, 0.04),
    cellPaddingBlock: 14,
    cellPaddingInline: 16,
    headerBorderRadius: 12,
    footerBg: palette.surfaceMuted,
  },
  Tabs: {
    inkBarColor: palette.brand,
    itemColor: palette.inkSoft,
    itemSelectedColor: palette.ink,
    itemHoverColor: palette.brand,
    horizontalItemPadding: '10px 2px',
    horizontalItemGutter: 26,
    titleFontSize: 14,
    cardBg: palette.surfaceMuted,
  },
  Modal: {
    borderRadiusLG: 18,
    titleFontSize: 18,
    titleColor: palette.ink,
    contentBg: palette.surface,
    headerBg: palette.surface,
    footerBg: palette.surface,
  },
  Drawer: {
    colorBgElevated: palette.surface,
  },
  Tag: {
    borderRadiusSM: 6,
    defaultBg: palette.surfaceMuted,
    defaultColor: palette.inkSoft,
  },
  Tooltip: {
    colorBgSpotlight: palette.ink,
    colorTextLightSolid: palette.surface,
    borderRadius: 8,
  },
  Dropdown: {
    borderRadiusLG: 14,
    borderRadiusSM: 10,
    paddingBlock: 8,
    controlItemBgHover: alpha(palette.brand, 0.08),
  },
  Segmented: {
    trackBg: palette.surfaceMuted,
    itemSelectedBg: palette.surface,
    itemSelectedColor: palette.ink,
    itemColor: palette.inkSoft,
    trackPadding: 3,
    borderRadius: 10,
  },
  Divider: {
    colorSplit: palette.hairline,
  },
  Pagination: {
    itemActiveBg: alpha(palette.brand, 0.12),
    borderRadius: 8,
  },
  Empty: {
    colorTextDescription: palette.inkMuted,
  },
  Typography: {
    titleMarginTop: '0.9em',
    titleMarginBottom: '0.5em',
  },
});

const lightPalette = getPalette('light');
const darkPalette = getPalette('dark');

const toRgba = (hexColor: string, value: number): string => {
  const hex = hexColor.replace('#', '').trim();
  if (/^[\da-fA-F]{6}$/.test(hex)) {
    return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${value})`;
  }
  return `rgba(32, 38, 43, ${value})`;
};

const lightThemeConfig: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: buildToken(lightPalette),
  components: buildComponents(lightPalette, toRgba),
};

const darkThemeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: buildToken(darkPalette),
  components: buildComponents(darkPalette, toRgba),
};

export const getThemeConfig = (mode: ResolvedThemeMode): ThemeConfig => {
  return mode === 'dark' ? darkThemeConfig : lightThemeConfig;
};
