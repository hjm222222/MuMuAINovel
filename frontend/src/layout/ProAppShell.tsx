import { useEffect, useMemo, useState } from 'react';
import { Button, theme } from 'antd';
import { MenuUnfoldOutlined, SearchOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import CommandPalette, { flattenMenuItems } from './CommandPalette';

export interface ShellMenuItem {
  path: string;
  name: ReactNode;
  key?: string;
  icon?: ReactNode;
  children?: ShellMenuItem[];
}

export interface ProAppShellProps {
  title: string;
  logo?: ReactNode;
  menuItems: ShellMenuItem[];
  selectedKeys: string[];
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  onMenuClick: (key: string) => void;
  brand?: (collapsed: boolean) => ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  headerHeight?: number;
  siderFooter?: (collapsed: boolean) => ReactNode;
  menuType?: 'group';
  contentOverflow?: 'auto' | 'hidden';
  children?: ReactNode;
}

const alphaColor = (color: string, alpha: number) =>
  `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(0)}%, transparent)`;

export default function ProAppShell({
  title,
  logo,
  menuItems,
  selectedKeys,
  collapsed,
  onCollapseChange,
  onMenuClick,
  brand,
  headerLeft,
  headerRight,
  headerHeight = 64,
  siderFooter,
  menuType,
  contentOverflow = 'auto',
  children,
}: ProAppShellProps) {
  const location = useLocation();
  const { token } = theme.useToken();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const paletteEntries = useMemo(() => flattenMenuItems(menuItems), [menuItems]);

  const hotkeyLabel = useMemo(() => {
    if (typeof navigator === 'undefined') return 'Ctrl K';
    return /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedKey = selectedKeys.join(',');
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [selectedKey]);

  return (
    <ProLayout
      title={title}
      logo={logo}
      layout="side"
      navTheme="light"
      siderWidth={216}
      fixSiderbar
      fixedHeader={false}
      headerRender={false}
      collapsedButtonRender={false}
      collapsed={isMobile ? !mobileMenuOpen : collapsed}
      onCollapse={(nextCollapsed: boolean) => {
        if (isMobile) {
          setMobileMenuOpen(!nextCollapsed);
          return;
        }
        onCollapseChange(nextCollapsed);
      }}
      location={location}
      route={{ routes: menuItems }}
      selectedKeys={selectedKeys}
      menu={menuType ? { type: menuType } : undefined}
      menuProps={{
        onClick: ({ key, domEvent }) => {
          domEvent.preventDefault();
          if (isMobile) {
            setMobileMenuOpen(false);
          }
          onMenuClick(String(key));
        },
      }}
      menuHeaderRender={() => (brand ? brand(collapsed) : null)}
      menuFooterRender={() => (siderFooter ? siderFooter(collapsed) : null)}
      contentStyle={{ padding: 0, margin: 0 }}
      style={{ height: '100vh', overflow: 'hidden' }}
      token={{
        header: {
          heightLayoutHeader: 56,
          colorBgHeader: 'transparent',
        },
        sider: {
          colorMenuBackground: token.colorBgContainer,
          colorTextMenu: token.colorText,
          colorTextMenuSelected: token.colorPrimary,
          colorTextMenuActive: token.colorPrimary,
          colorTextMenuItemHover: token.colorText,
          colorBgMenuItemSelected: token.colorPrimaryBg,
          colorBgMenuItemHover: token.colorFillTertiary,
          colorBgMenuItemActive: token.colorPrimaryBg,
        },
      }}
    >
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: headerHeight,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: isMobile ? '0 12px' : '0 28px',
            background: alphaColor(token.colorBgContainer, 0.86),
            backdropFilter: 'blur(18px) saturate(150%)',
            WebkitBackdropFilter: 'blur(18px) saturate(150%)',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={{ fontSize: 18, color: token.colorText, width: 36, height: 36 }}
              />
            )}
            {headerLeft}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
            {!isMobile && (
              <Button
                type="text"
                size="small"
                icon={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                onClick={() => setPaletteOpen(true)}
                style={{
                  color: token.colorTextTertiary,
                  background: token.colorFillQuaternary,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 999,
                  height: 30,
                  paddingInline: 12,
                  fontSize: 12,
                }}
              >
                搜索
                <span style={{ marginLeft: 8, opacity: 0.75 }}>{hotkeyLabel}</span>
              </Button>
            )}
            {headerRight}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: contentOverflow,
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        entries={paletteEntries}
        onSelect={(key) => {
          onMenuClick(key);
          if (isMobile) setMobileMenuOpen(false);
        }}
      />
    </ProLayout>
  );
}
