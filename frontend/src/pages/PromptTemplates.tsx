import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Modal,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
  message,
  theme
} from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PromptTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_content: string;
  description: string;
  category: string;
  parameters: string;
  is_active: boolean;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryGroup {
  category: string;
  count: number;
  templates: PromptTemplate[];
}

interface PromptRow extends PromptTemplate {
  source: 'system' | 'custom';
  status: 'active' | 'inactive';
  variables: string[];
}

const VARIABLE_PATTERN = /\{([^{}\s]+)\}/g;

const extractVariables = (content?: string): string[] => {
  if (!content) return [];
  const found = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1]);
  }
  return Array.from(found);
};

const toRows = (groups: CategoryGroup[]): PromptRow[] =>
  groups.flatMap((group) =>
    group.templates.map((template) => ({
      ...template,
      source: template.is_system_default ? 'system' : 'custom',
      status: template.is_system_default || template.is_active ? 'active' : 'inactive',
      variables: extractVariables(template.template_content)
    }))
  );

export default function PromptTemplates() {
  const { token } = theme.useToken();
  const [modal, contextHolder] = Modal.useModal();
  const actionRef = useRef<ActionType | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptRow | null>(null);

  const isMobile = window.innerWidth <= 768;

  const loadCategories = useCallback(async () => {
    const response = await axios.get<CategoryGroup[]>('/api/prompt-templates/categories');
    setCategories(response.data);
    return response.data;
  }, []);

  useEffect(() => {
    loadCategories().catch(() => {
      /* 分类仅用于筛选项，失败时由表格 request 再次提示 */
    });
  }, [loadCategories]);

  const reloadTable = () => {
    actionRef.current?.reload();
    loadCategories().catch(() => undefined);
  };

  const handleEdit = (template: PromptRow) => {
    setEditingTemplate({ ...template });
    setEditorVisible(true);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    try {
      setSaving(true);
      const createsAccountCopy = editingTemplate.is_system_default;
      await axios.post('/api/prompt-templates', {
        template_key: editingTemplate.template_key,
        template_name: editingTemplate.template_name,
        template_content: editingTemplate.template_content,
        description: editingTemplate.description,
        category: editingTemplate.category,
        parameters: editingTemplate.parameters,
        is_active: editingTemplate.is_active
      });
      message.success(createsAccountCopy ? '已保存为当前账户的自定义副本' : '保存成功');
      setEditorVisible(false);
      reloadTable();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (template: PromptRow) => {
    modal.confirm({
      title: '确认重置',
      content: `确定要删除「${template.template_name}」的账户自定义副本并恢复系统默认吗？这不会影响其他账户。`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await axios.post(`/api/prompt-templates/${template.template_key}/reset`);
          message.success('已重置为系统默认');
          reloadTable();
        } catch (error: unknown) {
          const err = error as { response?: { data?: { detail?: string } } };
          message.error(err.response?.data?.detail || '重置失败');
        }
      }
    });
  };

  const handleToggleActive = async (template: PromptRow, checked: boolean) => {
    try {
      await axios.put(`/api/prompt-templates/${template.template_key}`, {
        is_active: checked
      });
      actionRef.current?.reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || '操作失败');
    }
  };

  const handleCopy = async (template: PromptRow) => {
    try {
      await navigator.clipboard.writeText(template.template_content || '');
      message.success('模板内容已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动选择内容');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.post('/api/prompt-templates/export');
      const stats = response.data.statistics;

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-templates-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      if (stats) {
        message.success(
          `成功导出 ${stats.total} 个提示词配置（${stats.customized} 个自定义，${stats.system_default} 个系统默认）`,
          5
        );
      } else {
        message.success('导出成功');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || '导出失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const response = await axios.post('/api/prompt-templates/import', data);

      const result = response.data;
      const stats = result.statistics;

      let successMsg = '导入成功！\n';
      if (stats) {
        successMsg += `• 保持系统默认：${stats.kept_system_default} 个\n`;
        successMsg += `• 创建/更新自定义：${stats.created_or_updated} 个`;

        if (stats.converted_to_custom > 0) {
          successMsg += `\n• 检测到修改（已转为自定义）：${stats.converted_to_custom} 个`;
        }
      }

      if (result.converted_templates && result.converted_templates.length > 0) {
        modal.info({
          title: '导入完成',
          width: 600,
          centered: true,
          content: (
            <div>
              <p style={{ marginBottom: 16 }}>{successMsg}</p>
              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>以下模板内容与系统默认不一致，已转为自定义：</p>
              <ul style={{ marginLeft: 20 }}>
                {result.converted_templates.map((t: { template_key: string; template_name: string }) => (
                  <li key={t.template_key}>
                    {t.template_name} ({t.template_key})
                  </li>
                ))}
              </ul>
            </div>
          ),
          okText: '确定'
        });
      } else {
        message.success(successMsg, 5);
      }

      reloadTable();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      message.error(err.response?.data?.detail || '导入失败');
    }
    return false;
  };

  const categoryValueEnum = useMemo(() => {
    const entries: Record<string, { text: string }> = {};
    categories.forEach((group) => {
      entries[group.category] = { text: `${group.category} (${group.count})` };
    });
    return entries;
  }, [categories]);

  const columns: ProColumns<PromptRow>[] = [
      {
        title: '模板名称',
        dataIndex: 'template_name',
        copyable: true,
        ellipsis: true,
        width: 260,
        render: (_, record) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Text strong ellipsis style={{ fontSize: 14 }}>
              {record.template_name}
            </Text>
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {record.description || '暂无描述'}
            </Text>
          </div>
        )
      },
      {
        title: '模板键',
        dataIndex: 'template_key',
        copyable: true,
        ellipsis: true,
        width: 180,
        hideInSearch: true,
        responsive: ['lg'],
        render: (_, record) => (
          <Text code style={{ fontSize: 12 }}>
            {record.template_key}
          </Text>
        )
      },
      {
        title: '分类',
        dataIndex: 'category',
        valueType: 'select',
        width: 130,
        valueEnum: categoryValueEnum,
        render: (_, record) => <Tag bordered={false}>{record.category}</Tag>
      },
      {
        title: '来源',
        dataIndex: 'source',
        valueType: 'select',
        width: 110,
        valueEnum: {
          system: { text: '系统默认', status: 'Default' },
          custom: { text: '账户自定义', status: 'Processing' }
        },
        render: (_, record) =>
          record.source === 'system' ? (
            <Tag bordered={false}>系统默认</Tag>
          ) : (
            <Tag bordered={false} color="processing">
              账户自定义
            </Tag>
          )
      },
      {
        title: '变量',
        dataIndex: 'variables',
        width: 200,
        hideInSearch: true,
        responsive: ['xl'],
        render: (_, record) =>
          record.variables.length ? (
            <Space size={[4, 4]} wrap>
              {record.variables.slice(0, 4).map((name) => (
                <Tag key={name} bordered={false} color="gold" style={{ marginInlineEnd: 0 }}>
                  {`{${name}}`}
                </Tag>
              ))}
              {record.variables.length > 4 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  +{record.variables.length - 4}
                </Text>
              )}
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          )
      },
      {
        title: '状态',
        dataIndex: 'status',
        valueType: 'select',
        width: 120,
        valueEnum: {
          active: { text: '已启用', status: 'Success' },
          inactive: { text: '已禁用', status: 'Default' }
        },
        render: (_, record) =>
          record.source === 'system' ? (
            <Tag bordered={false} color="success">
              始终启用
            </Tag>
          ) : (
            <Space size={8}>
              <Switch
                size="small"
                checked={record.is_active}
                onChange={(checked) => handleToggleActive(record, checked)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.is_active ? '已启用' : '已禁用'}
              </Text>
            </Space>
          )
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        valueType: 'dateTime',
        width: 170,
        sorter: true,
        hideInSearch: true,
        responsive: ['md']
      },
      {
        title: '操作',
        valueType: 'option',
        width: 150,
        fixed: 'right',
        render: (_, record) => [
          <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>,
          <Button key="preview" type="link" size="small" icon={<EyeOutlined />} onClick={() => setPreviewTemplate(record)}>
            预览
          </Button>,
          <Button key="copy" type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>
            复制
          </Button>,
          <Button key="reset" type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleReset(record)}>
            重置
          </Button>
        ]
      }
  ];

  return (
    <>
      {contextHolder}
      <div
        style={{
          padding: isMobile ? '16px 12px 24px' : '20px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 12 : 16,
          background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 22%)`,
          minHeight: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div className="app-eyebrow" style={{ color: token.colorTextTertiary }}>
              Prompt Library
            </div>
            <h2 className="app-display" style={{ margin: '2px 0 4px', fontSize: isMobile ? 20 : 24, color: token.colorText }}>
              <FileSearchOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
              提示词模板
            </h2>
            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13 }}>
              按账户隔离的自定义 AI 生成提示词，支持导入导出与变量占位符
            </Text>
          </div>
          <Space wrap size={8}>
            <Upload accept=".json" showUploadList={false} beforeUpload={handleImport}>
              <Button icon={<UploadOutlined />} size={isMobile ? 'small' : 'middle'}>
                导入配置
              </Button>
            </Upload>
            <Button icon={<DownloadOutlined />} size={isMobile ? 'small' : 'middle'} onClick={handleExport}>
              导出配置
            </Button>
          </Space>
        </div>

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="编辑系统默认模板会创建仅当前账户生效的自定义副本；使用 {variable_name} 表示变量占位符，重置可恢复系统默认。"
          style={{ borderRadius: 10, padding: '6px 12px' }}
        />

        <ProTable<PromptRow>
          actionRef={actionRef}
          rowKey="template_key"
          columns={columns}
          headerTitle="模板列表"
          size={isMobile ? 'small' : 'middle'}
          scroll={isMobile ? { x: 860 } : undefined}
          search={{ labelWidth: 80, defaultCollapsed: false }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, size: isMobile ? 'small' : 'default' }}
          options={{ density: true, reload: true, setting: true, fullScreen: false }}
          dateFormatter="string"
          cardProps={{ style: { borderRadius: 12 } }}
          request={async (params, sort) => {
            try {
              const groups = await loadCategories();
              let rows = toRows(groups);

              const keyword = String(params.template_name ?? '').trim().toLowerCase();
              if (keyword) {
                rows = rows.filter(
                  (row) =>
                    row.template_name.toLowerCase().includes(keyword) ||
                    row.template_key.toLowerCase().includes(keyword) ||
                    (row.description ?? '').toLowerCase().includes(keyword)
                );
              }
              if (params.category) {
                rows = rows.filter((row) => row.category === params.category);
              }
              if (params.source) {
                rows = rows.filter((row) => row.source === params.source);
              }
              if (params.status) {
                rows = rows.filter((row) => row.status === params.status);
              }

              const sortDirection = sort?.updated_at;
              if (sortDirection) {
                const factor = sortDirection === 'ascend' ? 1 : -1;
                rows = [...rows].sort(
                  (a, b) => (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) * factor
                );
              } else {
                rows = [...rows].sort(
                  (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                );
              }

              const current = params.current ?? 1;
              const pageSize = params.pageSize ?? 10;
              const start = (current - 1) * pageSize;

              return {
                data: rows.slice(start, start + pageSize),
                total: rows.length,
                success: true
              };
            } catch (error: unknown) {
              const err = error as { response?: { data?: { detail?: string } } };
              message.error(err.response?.data?.detail || '加载失败');
              return { data: [], total: 0, success: false };
            }
          }}
        />
      </div>

      <Modal
        title={`编辑模板: ${editingTemplate?.template_name ?? ''}`}
        open={editorVisible}
        onCancel={() => setEditorVisible(false)}
        onOk={handleSave}
        width={isMobile ? '100%' : 900}
        centered={!isMobile}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        style={isMobile ? { top: 0, paddingBottom: 0, maxWidth: '100vw' } : undefined}
        styles={
          isMobile
            ? {
                body: {
                  maxHeight: 'calc(100vh - 110px)',
                  overflowY: 'auto',
                  padding: '16px'
                }
              }
            : undefined
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>模板名称</label>
            <Input
              value={editingTemplate?.template_name || ''}
              onChange={(e) =>
                setEditingTemplate((prev) => (prev ? { ...prev, template_name: e.target.value } : null))
              }
              placeholder="输入模板名称"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>描述</label>
            <TextArea
              value={editingTemplate?.description || ''}
              onChange={(e) =>
                setEditingTemplate((prev) => (prev ? { ...prev, description: e.target.value } : null))
              }
              rows={2}
              placeholder="简要描述模板用途"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>模板内容</label>
            <TextArea
              value={editingTemplate?.template_content || ''}
              onChange={(e) =>
                setEditingTemplate((prev) => (prev ? { ...prev, template_content: e.target.value } : null))
              }
              rows={isMobile ? 15 : 20}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="输入提示词模板内容..."
            />
          </div>

          <Alert
            message="提示：使用 {variable_name} 格式表示变量占位符"
            type="info"
            showIcon
            style={{ borderRadius: 8 }}
          />
        </Space>
      </Modal>

      <Modal
        title={previewTemplate?.template_name}
        open={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => previewTemplate && handleCopy(previewTemplate)}>
            复制内容
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              if (previewTemplate) {
                setPreviewTemplate(null);
                handleEdit(previewTemplate);
              }
            }}
          >
            编辑
          </Button>
        ]}
        width={isMobile ? '100%' : 820}
        centered={!isMobile}
        style={isMobile ? { top: 0, maxWidth: '100vw' } : undefined}
      >
        {previewTemplate && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space wrap size={[6, 6]}>
              <Tag bordered={false}>{previewTemplate.category}</Tag>
              <Tag bordered={false} color={previewTemplate.source === 'system' ? 'default' : 'processing'}>
                {previewTemplate.source === 'system' ? '系统默认' : '账户自定义'}
              </Tag>
              <Tag bordered={false} color={previewTemplate.status === 'active' ? 'success' : 'default'}>
                {previewTemplate.status === 'active' ? '已启用' : '已禁用'}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {previewTemplate.template_key}
              </Text>
            </Space>
            {previewTemplate.variables.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  变量
                </Text>
                <div style={{ marginTop: 6 }}>
                  <Space size={[4, 4]} wrap>
                    {previewTemplate.variables.map((name) => (
                      <Tag key={name} bordered={false} color="gold">
                        {`{${name}}`}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>
            )}
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {previewTemplate.description || '暂无描述'}
            </Paragraph>
            <pre
              style={{
                margin: 0,
                maxHeight: '48vh',
                overflow: 'auto',
                padding: 16,
                borderRadius: 10,
                background: token.colorFillQuaternary,
                border: `1px solid ${token.colorBorderSecondary}`,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 12.5,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {previewTemplate.template_content}
            </pre>
          </Space>
        )}
      </Modal>
    </>
  );
}
