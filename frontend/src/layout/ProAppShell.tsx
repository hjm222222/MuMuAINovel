import { useEffect, useState } from 'react';
import { Button, theme } from 'antd';
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface ShellMenuItem {
  path: string;
  name: string;
  key?: string;
  icon?: ReactNode;
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
  children,
}: ProAppShellProps) {
  const location = useLocation();
  const { token } = theme.useToken();
  const isMobile = window.innerWidth <= 768;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      menuProps={{
        onClick: ({ key, domEvent }) => {
          domEvent.preventDefault();
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>{headerRight}</div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
      </div>
    </ProLayout>
  );
}
