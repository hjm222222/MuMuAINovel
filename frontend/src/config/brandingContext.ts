import { createContext, useContext } from 'react';
import type { BrandingConfig } from '../types';

export const DEFAULT_BRANDING: BrandingConfig = {
  app_name: 'AI 小说创作台',
  slogan: '只做创作台的自托管 AI 小说工作台',
  description: '面向小说创作者的 AI 创作台：世界设定、大纲、角色、章节写作与全书导出。',
  primary_color: '#4D8088',
  accent_color: '#C08A6A',
  footer_note: '基于 MuMuAINovel 修改 · GPL v3',
  upstream_name: 'MuMuAINovel',
  upstream_url: 'https://github.com/xiamuceer-j/MuMuAINovel',
  license: 'GPL-3.0',
  license_url: 'https://www.gnu.org/licenses/gpl-3.0.html',
  ai_content_notice: '本站生成内容由 AI 辅助完成，请在发布或商用前进行人工审校。',
  version: '1.5.8',
};

export interface BrandingContextValue {
  branding: BrandingConfig;
  loading: boolean;
}

export const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  loading: false,
});

export const useBranding = (): BrandingContextValue => useContext(BrandingContext);
