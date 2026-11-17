import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Spin, Button, Space, theme } from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  BookOutlined,
  // ToolOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ApartmentOutlined,
  BankOutlined,
  EditOutlined,
  FundOutlined,
  TrophyOutlined,
  BulbOutlined,
  CloudOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';
import { useCharacterSync, useOutlineSync, useChapterSync } from '../store/hooks';
import { projectApi } from '../services/api';
import ThemeSwitch from '../components/ThemeSwitch';
import { useThemeMode } from '../theme/useThemeMode';
import { useBranding } from '../config/brandingContext';
import { getStoredSidebarCollapsed, setStoredSidebarCollapsed } from '../utils/sidebarState';
import FloatingTaskPanel from '../components/FloatingTaskPanel';
import ProjectAgentPanel from '../components/project-agent/ProjectAgentPanel';
import { eventBus, EventNames } from '../store/eventBus';
import ProAppShell from '../layout/ProAppShell';
import type { ShellMenuItem } from '../layout/ProAppShell';

// 判断是否为移动端
const isMobile = () => window.innerWidth <= 768;

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => getStoredSidebarCollapsed());
  const [mobile, setMobile] = useState(isMobile());
  const [agentDrawerVisible, setAgentDrawerVisible] = useState(false);
  const [agentLayout, setAgentLayout] = useState({ expanded: true, width: 410 });
  const handleAgentLayoutChange = useCallback((expanded: boolean, width: number) => {
    setAgentLayout(current => (
      current.expanded === expanded && current.width === width ? current : { expanded, width }
    ));
  }, []);
  const { token } = theme.useToken();
  const { branding } = useBranding();
  const alphaColor = (color: string, alpha: number) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(0)}%, transparent)`;
  const { mode, resolvedMode, setMode } = useThemeMode();
  const cycleThemeMode = () => {
    const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(nextMode);
  };
  const collapsedThemeIcon = mode === 'light' ? <BulbOutlined /> : mode === 'dark' ? <MoonOutlined /> : <CloudOutlined />;
  const headerHeight = mobile ? 56 : 70;

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setStoredSidebarCollapsed(collapsed);
  }, [collapsed]);
  const {
    currentProject,
    setCurrentProject,
    clearProjectData,
    loading,
    setLoading,
    outlines,
    characters,
    chapters,
  } = useStore();

  // 使用同步 hooks
  const { refreshCharacters } = useCharacterSync();
  const { refreshOutlines } = useOutlineSync();
  const { refreshChapters } = useChapterSync();

  useEffect(() => {
    const handleAgentDataChanged = (payload?: unknown) => {
      if (!projectId || !payload || typeof payload !== 'object') return;
      const resources = (payload as { resources?: string[] }).resources || [];
      const refreshes: Promise<unknown>[] = [];
      if (resources.includes('projects')) {
        refreshes.push(projectApi.getProject(projectId).then(setCurrentProject));
      }
      if (resources.includes('outlines')) refreshes.push(refreshOutlines(projectId));
      if (resources.includes('characters')) refreshes.push(refreshCharacters(projectId));
      if (resources.includes('chapters')) refreshes.push(refreshChapters(projectId));
      void Promise.all(refreshes);
    };
    eventBus.on(EventNames.AGENT_DATA_CHANGED, handleAgentDataChanged);
    const handleTaskSettled = (payload?: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const data = payload as { projectId?: string };
      if (data.projectId && data.projectId !== projectId) return;
      handleAgentDataChanged(payload);
    };
    eventBus.on(EventNames.BACKGROUND_TASK_SETTLED, handleTaskSettled);
    return () => {
      eventBus.off(EventNames.AGENT_DATA_CHANGED, handleAgentDataChanged);
      eventBus.off(EventNames.BACKGROUND_TASK_SETTLED, handleTaskSettled);
    };
  }, [projectId, refreshChapters, refreshCharacters, refreshOutlines, setCurrentProject]);

  useEffect(() => {
    const loadProjectData = async (id: string) => {
      try {
        setLoading(true);
        // 加载项目基本信息
        const project = await projectApi.getProject(id);
        setCurrentProject(project);

        // 并行加载其他数据
        await Promise.all([
          refreshOutlines(id),
          refreshCharacters(id),
          refreshChapters(id),
        ]);
      } catch (error) {
        console.error('加载项目数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectData(projectId);
    }

    return () => {
      clearProjectData();
    };
  }, [projectId, clearProjectData, setLoading, setCurrentProject, refreshOutlines, refreshCharacters, refreshChapters]);

  // 移除事件监听，避免无限循环
  // Hook 内部已经更新了 store，不需要再次刷新

  const projectMenuItem = (key: string, label: string, icon: ReactNode) => ({
    path: `/project/${projectId}/${key}`,
    key,
    name: label,
    icon,
  });

  const shellMenuItems: ShellMenuItem[] = [
    {
      path: '/project/manage',
      key: 'manage',
      name: '创作管理',
      children: [
        projectMenuItem('world-setting', '世界设定', <GlobalOutlined />),
        projectMenuItem('characters', '角色管理', <TeamOutlined />),
        projectMenuItem('organizations', '组织管理', <BankOutlined />),
        projectMenuItem('careers', '职业管理', <TrophyOutlined />),
        projectMenuItem('relationships', '关系管理', <ApartmentOutlined />),
        projectMenuItem('outline', '大纲管理', <FileTextOutlined />),
        projectMenuItem('chapters', '章节管理', <BookOutlined />),
        projectMenuItem('chapter-analysis', '剧情分析', <FundOutlined />),
        projectMenuItem('foreshadows', '伏笔管理', <BulbOutlined />),
      ],
    },
    {
      path: '/project/tools',
      key: 'tools',
      name: '创作工具',
      children: [
        projectMenuItem('writing-styles', '写作风格', <EditOutlined />),
        projectMenuItem('skill-chat', 'Skill 工具箱', <ThunderboltOutlined />),
        projectMenuItem('skill-manage', 'Skill 管理', <SettingOutlined />),
      ],
    },
  ];

  // 根据当前路径动态确定选中的菜单项
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/world-setting')) return 'world-setting';
    if (path.includes('/careers')) return 'careers';
    if (path.includes('/relationships')) return 'relationships';
    if (path.includes('/organizations')) return 'organizations';
    if (path.includes('/outline')) return 'outline';
    if (path.includes('/characters')) return 'characters';
    if (path.includes('/chapter-analysis')) return 'chapter-analysis';
    if (path.includes('/foreshadows')) return 'foreshadows';
    if (path.includes('/chapters')) return 'chapters';
    if (path.includes('/writing-styles')) return 'writing-styles';
    if (path.includes('/skill-chat')) return 'skill-chat';
    if (path.includes('/skill-manage')) return 'skill-manage';
    // if (path.includes('/polish')) return 'polish';
    return 'world-setting'; // 默认选中世界设定
  }, [location.pathname]);

  if (loading || !currentProject) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const renderBrand = (isCollapsed: boolean) => (
    <div style={{
      height: headerHeight,
      display: 'flex',
      alignItems: 'center',
      padding: isCollapsed ? 0 : '0 18px',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      justifyContent: isCollapsed ? 'center' : 'space-between',
      gap: 8,
    }}>
      {isCollapsed ? (
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={() => setCollapsed(false)}
          style={{
            color: token.colorTextSecondary,
            width: '100%',
            height: '100%',
            padding: 0,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              width: 32,
              height: 32,
              background: `linear-gradient(140deg, ${token.colorPrimary} 0%, ${alphaColor(token.colorPrimary, 0.72)} 100%)`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorWhite,
              fontSize: 15,
              boxShadow: `0 8px 16px -10px ${alphaColor(token.colorPrimary, 0.9)}`,
            }}>
              <BookOutlined />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                className="app-display"
                style={{
                  color: token.colorText,
                  fontWeight: 600,
                  fontSize: 15,
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {branding.app_name}
              </span>
              <span style={{ fontSize: 10, letterSpacing: '0.18em', color: token.colorTextTertiary, textTransform: 'uppercase' }}>
                Writing Studio
              </span>
            </div>
          </div>
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={() => setCollapsed(true)}
            style={{
              color: token.colorTextTertiary,
              width: 30,
              height: 30,
              padding: 0,
              flexShrink: 0
            }}
          />
        </>
      )}
    </div>
  );

  const renderSiderFooter = (isCollapsed: boolean) => (
    <div style={{
      padding: isCollapsed ? '12px 8px' : '12px',
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    }}>
      {isCollapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Button
            type="text"
            icon={collapsedThemeIcon}
            onClick={cycleThemeMode}
            title={`主题模式：${mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}（点击切换）`}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: alphaColor(token.colorBgContainer, 0.65),
              border: `1px solid ${token.colorBorder}`,
              color: token.colorText,
              padding: 0,
            }}
          />
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: alphaColor(token.colorBgContainer, 0.65),
              border: `1px solid ${token.colorBorder}`,
              color: token.colorText,
              padding: 0,
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: token.colorTextTertiary }}>
            <span>主题模式</span>
            <span>{resolvedMode === 'dark' ? '深色' : '浅色'}</span>
          </div>
          <ThemeSwitch block />
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            block
            style={{
              color: token.colorText,
              height: 40,
              justifyContent: 'flex-start',
              padding: '0 12px'
            }}
          >
            返回主页
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ProAppShell
        title={branding.app_name}
        logo={<img src="/logo.svg" alt={branding.app_name} style={{ width: 28, height: 28, display: 'block' }} />}
        menuItems={shellMenuItems}
        menuType="group"
        selectedKeys={[selectedKey]}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        onMenuClick={(key) => {
          const target = shellMenuItems
            .flatMap((group) => group.children ?? [group])
            .find((item) => item.key === key);
          if (target) {
            navigate(target.path);
          }
        }}
        brand={renderBrand}
        siderFooter={renderSiderFooter}
        headerHeight={headerHeight}
        contentOverflow="hidden"
        headerLeft={
          mobile ? (
            <h2 style={{
              margin: 0,
              color: token.colorText,
              fontSize: 15,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {currentProject.title}
            </h2>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/')}
                style={{ color: token.colorTextTertiary, paddingInline: 6, height: 30 }}
              >
                书房
              </Button>
              <span style={{ width: 1, height: 16, background: token.colorBorderSecondary }} />
              <h2
                className="app-display"
                style={{
                  margin: 0,
                  color: token.colorText,
                  fontSize: 17,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '34vw',
                }}
              >
                {currentProject.title}
              </h2>
            </div>
          )
        }
        headerRight={
          mobile ? (
            <Space size={2}>
              <Button
                type="text"
                icon={<img src="/logo.svg" alt={branding.app_name} style={{ width: 20, height: 20, display: 'block' }} />}
                onClick={() => setAgentDrawerVisible(true)}
                style={{ color: token.colorTextSecondary, width: 36, height: 36 }}
              />
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/')}
                style={{
                  fontSize: '14px',
                  color: token.colorTextSecondary,
                  height: '36px',
                  padding: '0 6px',
                }}
              >
                主页
              </Button>
            </Space>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              {[
                { label: '大纲', value: outlines.length, unit: '条' },
                { label: '角色', value: characters.length, unit: '个' },
                { label: '章节', value: chapters.length, unit: '章' },
                { label: '已写', value: currentProject.current_words, unit: '字' },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 2,
                    paddingLeft: index === 0 ? 0 : 18,
                    borderLeft: index === 0 ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                    cursor: 'default',
                  }}
                >
                  <span style={{
                    fontSize: '11px',
                    color: token.colorTextTertiary,
                    letterSpacing: '0.08em',
                    lineHeight: 1
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: token.colorText,
                    lineHeight: 1.2,
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {item.value > 10000 ? (item.value / 10000).toFixed(1) + 'w' : item.value}
                    <span style={{ fontSize: '10px', marginLeft: '2px', color: token.colorTextTertiary, fontWeight: 400 }}>{item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )
        }
      >
        <div style={{
          background: token.colorBgLayout,
          padding: mobile ? 12 : 24,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: token.colorBgContainer,
            padding: 0,
            borderRadius: mobile ? '8px' : '12px',
            boxShadow: `0 8px 24px ${alphaColor(token.colorText, 0.08)}`,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row'
          }}>
            <div style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: mobile ? 12 : 24,
            }}>
              <Outlet />
            </div>
            {projectId && (
              <ProjectAgentPanel
                projectId={projectId}
                mobile={mobile}
                mobileOpen={agentDrawerVisible}
                onMobileClose={() => setAgentDrawerVisible(false)}
                onExpandedChange={handleAgentLayoutChange}
              />
            )}
          </div>
        </div>
      </ProAppShell>

      {/* 悬浮任务框 */}
      {projectId && (
        <FloatingTaskPanel
          projectId={projectId}
          rightOffset={mobile ? 23 : (agentLayout.expanded ? agentLayout.width + 35 : 70)}
        />
      )}
    </>
  );
}
