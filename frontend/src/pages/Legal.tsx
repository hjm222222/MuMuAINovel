import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Tabs, Typography, Alert, Space, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../config/brandingContext';
import { userApi } from '../services/api';

const { Paragraph, Title, Text } = Typography;

const TAB_KEYS = ['privacy', 'terms', 'ai', 'data'] as const;
type TabKey = (typeof TAB_KEYS)[number];

const LegalTabs = {
  privacy: '隐私政策',
  terms: '用户协议',
  ai: 'AI 生成内容标识',
  data: '数据导出与删除',
};

export default function Legal() {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteCreativeData = async () => {
    setDeleting(true);
    try {
      const result = await userApi.deleteMyData('creative');
      message.success(result?.message || '创作数据已删除');
    } catch {
      message.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    try {
      await userApi.deleteMyData('all');
      message.success('账号及全部数据已删除，即将返回登录页');
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      message.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  };

  const renderPrivacy = () => (
    <>
      <Title level={4}>1. 我们收集哪些数据</Title>
      <Paragraph>
        {branding.app_name} 为自托管的开源软件，部署方决定实际的数据存储位置。默认情况下系统会收集：
      </Paragraph>
      <ul>
        <li>账号信息：用户名、显示名称、邮箱地址（若启用邮箱登录）。</li>
        <li>创作数据：项目设定、大纲、角色、章节正文、生成历史与用量统计。</li>
        <li>模型凭据：你填写的第三方 AI 服务商 API Key，加密后存储于数据库。</li>
        <li>运行日志：包含时间、接口路径与错误信息，用于排查故障。</li>
      </ul>
      <Title level={4}>2. 我们如何使用数据</Title>
      <Paragraph>
        数据仅用于提供创作功能：保存你的项目、生成内容、统计模型调用量。不用于广告投放，不向第三方出售。
        你的 API Key 仅用于向你自己选择的模型服务商发起请求。
      </Paragraph>
      <Title level={4}>3. 数据共享</Title>
      <Paragraph>
        除调用你配置的模型服务商、邮箱服务商（发送验证码）以及部署方的运维管理外，我们不会共享你的创作数据。
      </Paragraph>
      <Title level={4}>4. 数据保留与删除</Title>
      <Paragraph>
        数据在账号存续期间保留。你可以在「数据导出与删除」页删除创作数据，或注销账号并清除全部数据。
      </Paragraph>
      <Title level={4}>5. 你的权利</Title>
      <Paragraph>
        你可以随时导出全书稿件与项目 JSON 数据，也可以随时删除账号与数据。模型调用量统计支持按日查看。
      </Paragraph>
    </>
  );

  const renderTerms = () => (
    <>
      <Title level={4}>1. 服务性质</Title>
      <Paragraph>
        {branding.app_name} 是开源软件（{branding.license}），提供 AI 辅助创作工具，模型调用费用由用户自行承担。
        本服务不提供内容审核以外的任何内容保证，也不承诺生成内容的可用性。
      </Paragraph>
      <Title level={4}>2. 账号责任</Title>
      <Paragraph>
        你对自己的账号安全负责，包括妥善保管密码与 API Key。禁止利用本服务从事违法活动或侵犯他人权益的活动。
      </Paragraph>
      <Title level={4}>3. 知识产权</Title>
      <Paragraph>
        你创作的内容归你所有。生成内容的合法性由使用者负责，因生成内容引发的纠纷由使用者承担。
      </Paragraph>
      <Title level={4}>4. 免责条款</Title>
      <Paragraph>
        本服务按现状提供，不承诺无中断或零错误。部署方的运营主体、联系方式与管辖地信息以站点实际公示为准。
      </Paragraph>
      <Title level={4}>5. 开源许可</Title>
      <Paragraph>
        本项目基于{' '}
        <a href={branding.upstream_url} target="_blank" rel="noopener noreferrer">
          {branding.upstream_name}
        </a>{' '}
        修改，遵循 {branding.license} 协议，保留上游署名与许可证声明。
      </Paragraph>
    </>
  );

  const renderAiNotice = () => (
    <>
      <Alert type="warning" showIcon message={branding.ai_content_notice} style={{ marginBottom: 16 }} />
      <Title level={4}>AI 生成内容标识</Title>
      <Paragraph>
        系统生成的大纲、角色设定、章节正文等内容均由 AI 模型生成，属于合成内容，不代表事实陈述。
      </Paragraph>
      <ul>
        <li>发布或商用前请人工审校，核对事实、逻辑与合规要求。</li>
        <li>不同模型的输出质量存在差异，重要稿件建议多轮校对。</li>
        <li>章节页导出文件名与正文中建议保留 AI 辅助生成标识，便于内容来源追溯。</li>
      </ul>
      <Title level={4}>模型服务商</Title>
      <Paragraph>
        模型调用由你自己配置的 API Key 完成，数据流向取决于你选择的服务商与其隐私政策。
      </Paragraph>
    </>
  );

  const renderData = () => (
    <>
      <Title level={4}>导出数据</Title>
      <Paragraph>
        在章节页点击「导出全书」可导出 Markdown / TXT 稿件，在项目列表的「导出项目」中可导出包含全部结构的 JSON 文件。
      </Paragraph>
      <Title level={4}>删除数据</Title>
      <Paragraph>
        删除操作不可恢复，执行前请先导出需要保留的内容。删除创作数据会保留你的账号、密码与个人设置；
        删除全部数据会同时注销账号。
      </Paragraph>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Button danger loading={deleting} onClick={handleDeleteCreativeData}>
          删除全部创作数据
        </Button>
        <Button danger type="primary" loading={deleting} onClick={handleDeleteAllData}>
          注销账号并删除全部数据
        </Button>
      </Space>
    </>
  );

  const renderContent: Record<TabKey, ReactNode> = {
    privacy: renderPrivacy(),
    terms: renderTerms(),
    ai: renderAiNotice(),
    data: renderData(),
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>
      <Card>
        <Title level={3}>{branding.app_name} · 合规说明</Title>
        <Text type="secondary">{branding.slogan}</Text>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={TAB_KEYS.map((key) => ({
            key,
            label: LegalTabs[key],
            children: renderContent[key],
          }))}
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
}
