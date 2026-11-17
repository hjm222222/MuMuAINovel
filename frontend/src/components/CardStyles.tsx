import type { CSSProperties } from 'react';

const bookshelfBaseShadow =
  '0 1px 2px color-mix(in srgb, var(--ant-color-text) 6%, transparent), 0 14px 30px -22px color-mix(in srgb, var(--ant-color-text) 45%, transparent)';

const bookshelfHoverShadow =
  '0 2px 6px color-mix(in srgb, var(--ant-color-text) 8%, transparent), 0 26px 48px -26px color-mix(in srgb, var(--ant-color-text) 55%, transparent)';

const bookshelfNewBaseShadow =
  '0 1px 2px color-mix(in srgb, var(--ant-color-primary) 8%, transparent), 0 14px 30px -24px color-mix(in srgb, var(--ant-color-primary) 45%, transparent)';

const bookshelfNewHoverShadow =
  '0 2px 6px color-mix(in srgb, var(--ant-color-primary) 12%, transparent), 0 24px 44px -26px color-mix(in srgb, var(--ant-color-primary) 55%, transparent)';

const promptTemplateBaseShadow =
  '0 1px 2px color-mix(in srgb, var(--ant-color-text) 6%, transparent), 0 12px 26px -20px color-mix(in srgb, var(--ant-color-text) 45%, transparent)';

// BookshelfPage 样式（书架/书本卡片）
export const bookshelfCardStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px 18px',
    padding: '8px 0 16px',
    alignItems: 'stretch',
  } as CSSProperties,

  projectCard: {
    height: '100%',
    borderRadius: '14px 18px 18px 14px',
    overflow: 'hidden',
    background: 'var(--ant-color-bg-container)',
    boxShadow: bookshelfBaseShadow,
    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease',
    border: '1px solid color-mix(in srgb, var(--ant-color-text) 9%, transparent)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  } as CSSProperties,

  newProjectCard: {
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--ant-color-primary) 4%, var(--ant-color-bg-container)) 0%, var(--ant-color-bg-container) 62%)',
    boxShadow: bookshelfNewBaseShadow,
    border: '1px dashed color-mix(in srgb, var(--ant-color-primary) 30%, var(--ant-color-border) 70%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
    position: 'relative',
  } as CSSProperties,
};

export const bookshelfCardHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.dataset.cardStyle !== 'bookshelf-book') {
      return;
    }

    if (target.dataset.bookKind === 'new') {
      target.style.transform = 'translateY(-4px)';
      target.style.boxShadow = bookshelfNewHoverShadow;
      target.style.borderColor = 'color-mix(in srgb, var(--ant-color-primary) 45%, var(--ant-color-border) 55%)';
      target.style.background = 'linear-gradient(180deg, color-mix(in srgb, var(--ant-color-primary) 7%, var(--ant-color-bg-container)) 0%, var(--ant-color-bg-container) 68%)';
      return;
    }

    target.style.transform = 'translateY(-5px)';
    target.style.boxShadow = bookshelfHoverShadow;
    target.style.borderColor = 'color-mix(in srgb, var(--ant-color-primary) 26%, var(--ant-color-border) 74%)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.dataset.cardStyle !== 'bookshelf-book') {
      return;
    }

    const isNewBook = target.dataset.bookKind === 'new';
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = isNewBook ? bookshelfNewBaseShadow : bookshelfBaseShadow;
    target.style.borderColor = isNewBook
      ? 'color-mix(in srgb, var(--ant-color-primary) 30%, var(--ant-color-border) 70%)'
      : 'color-mix(in srgb, var(--ant-color-text) 9%, transparent)';
    if (isNewBook) {
      target.style.background = 'linear-gradient(180deg, color-mix(in srgb, var(--ant-color-primary) 4%, var(--ant-color-bg-container)) 0%, var(--ant-color-bg-container) 62%)';
    }
  },
};

// PromptTemplates 页面卡片样式
export const promptTemplateCardStyles = {
  templateCard: {
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid color-mix(in srgb, var(--ant-color-text) 8%, transparent)',
    background: 'var(--ant-color-bg-container)',
    boxShadow: promptTemplateBaseShadow,
    transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease',
  } as CSSProperties,
};

export const promptTemplateCardHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(-4px)';
    target.style.boxShadow = '0 2px 6px color-mix(in srgb, var(--ant-color-text) 8%, transparent), 0 22px 40px -26px color-mix(in srgb, var(--ant-color-text) 50%, transparent)';
    target.style.borderColor = 'color-mix(in srgb, var(--ant-color-primary) 24%, transparent)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translateY(0)';
    target.style.boxShadow = promptTemplateBaseShadow;
    target.style.borderColor = 'color-mix(in srgb, var(--ant-color-text) 8%, transparent)';
  },
};

export const promptTemplateGridConfig = {
  xs: 24,
  sm: 12,
  lg: 8,
  xl: 6,
};

// WorldSetting 页面卡片样式
export const worldSettingCardStyles = {
  sectionCard: {
    borderRadius: 16,
    border: '1px solid color-mix(in srgb, var(--ant-color-text) 8%, transparent)',
    boxShadow: '0 1px 2px color-mix(in srgb, var(--ant-color-text) 5%, transparent), 0 14px 30px -24px color-mix(in srgb, var(--ant-color-text) 45%, transparent)',
    background: 'var(--ant-color-bg-container)',
    transition: 'box-shadow 0.24s ease, border-color 0.24s ease',
  } as CSSProperties,
};

// Characters 页面（CharacterCard + 网格）样式
export const characterCardStyles = {
  characterCard: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 12,
  } as CSSProperties,

  organizationCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--ant-color-bg-layout)',
    borderRadius: 12,
  } as CSSProperties,

  nameEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  descriptionBlock: {
    marginTop: 12,
    maxHeight: 200,
    overflow: 'hidden',
  } as CSSProperties,
};

export const charactersPageGridConfig = {
  gutter: 0,
  xs: 24,
  sm: 12,
  md: 12,
  lg: 6,
  xl: 6,
  xxl: 5,
};

// 页面通用文本样式（仅用于信息展示，不与卡片结构耦合）
export const commonTextStyles = {
  label: {
    fontSize: 12,
    color: 'color-mix(in srgb, var(--ant-color-text) 55%, transparent)',
  } as CSSProperties,

  value: {
    fontSize: 14,
    color: 'var(--ant-color-text)',
  } as CSSProperties,

  description: {
    fontSize: 12,
    color: 'color-mix(in srgb, var(--ant-color-text) 55%, transparent)',
    lineHeight: 1.6,
  } as CSSProperties,
};
