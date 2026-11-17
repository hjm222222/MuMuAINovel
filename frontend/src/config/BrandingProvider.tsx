import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { siteApi } from '../services/api';
import { BrandingContext, DEFAULT_BRANDING } from './brandingContext';
import type { BrandingConfig } from '../types';

const HEX_COLOR_PATTERN = /^#([\da-fA-F]{3}|[\da-fA-F]{6})$/;

export const isValidHexColor = (value: string): boolean => HEX_COLOR_PATTERN.test(value.trim());

export const BrandingProvider = ({ children }: PropsWithChildren) => {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await siteApi.getBranding();
        if (!active || !result) return;
        setBranding({
          ...DEFAULT_BRANDING,
          ...result,
          primary_color: isValidHexColor(result.primary_color) ? result.primary_color : DEFAULT_BRANDING.primary_color,
          accent_color: isValidHexColor(result.accent_color) ? result.accent_color : DEFAULT_BRANDING.accent_color,
        });
      } catch {
        // 保留默认品牌配置
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${branding.app_name} · ${branding.slogan}`;
    }
  }, [branding.app_name, branding.slogan]);

  const value = useMemo(() => ({ branding, loading }), [branding, loading]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};
