import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Progress, Segmented, Space, Statistic, Tag, Tooltip, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { settingsApi } from '../services/api';
import type { UsageSummary } from '../types';

const formatTokens = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
};

const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}min`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
};

type ModelRow = UsageSummary['by_model'][number];
type SceneRow = UsageSummary['by_scene'][number];
type RecentRow = UsageSummary['recent'][number];

export default function UsageDashboard() {
  const { token } = theme.useToken();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async (range: number) => {
    setLoading(true);
    try {
      const data = await settingsApi.getUsageSummary({ days: range, limit: 100 });
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(days);
  }, [days, loadSummary]);

  const modelTotal = useMemo(
    () => (summary?.by_model || []).reduce((acc, item) => acc + item.total_tokens, 0),
    [summary]
  );
  const sceneTotal = useMemo(
    () => (summary?.by_scene || []).reduce((acc, item) => acc + item.total_tokens, 0),
    [summary]
  );
  const dailyMax = useMemo(
    () => Math.max(1, ...(summary?.daily || []).map((item) => item.total_tokens)),
    [summary]
  );

  const dailySeries = useMemo(() => {
    const map = new Map((summary?.daily || []).map((item) => [item.date, item]));
    const series: Array<{ date: string; calls: number; total_tokens: number }> = [];
    const today = new Date();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const hit = map.get(key);
      series.push({ date: key, calls: hit?.calls || 0, total_tokens: hit?.total_tokens || 0 });
    }
    return series;
  }, [summary, days]);
  const successRate = useMemo(() => {
    const recent = summary?.recent || [];
    if (recent.length === 0) return null;
    const ok = recent.filter((item) => item.success).length;
    return Math.round((ok / recent.length) * 100);
  }, [summary]);

  const modelColumns: ProColumns<ModelRow>[] = [
    { title: '模型', dataIndex: 'model', ellipsis: true, render: (_, row) => row.model || '未知模型' },
    { title: '调用次数', dataIndex: 'calls', width: 100, align: 'right', sorter: (a, b) => a.calls - b.calls },
    {
      title: '总 Token',
      dataIndex: 'total_tokens',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.total_tokens - b.total_tokens,
      render: (_, row) => formatTokens(row.total_tokens),
    },
    {
      title: '占比',
      dataIndex: 'share',
      width: 150,
      render: (_, row) => (
        <Progress
          percent={modelTotal ? Math.round((row.total_tokens / modelTotal) * 100) : 0}
          size="small"
          strokeColor={token.colorPrimary}
        />
      ),
    },
  ];

  const sceneColumns: ProColumns<SceneRow>[] = [
    { title: '场景', dataIndex: 'scene', ellipsis: true, render: (_, row) => row.scene || '未标注' },
    { title: '调用次数', dataIndex: 'calls', width: 100, align: 'right', sorter: (a, b) => a.calls - b.calls },
    {
      title: '总 Token',
      dataIndex: 'total_tokens',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.total_tokens - b.total_tokens,
      render: (_, row) => formatTokens(row.total_tokens),
    },
    {
      title: '占比',
      dataIndex: 'share',
      width: 150,
      render: (_, row) => (
        <Progress
          percent={sceneTotal ? Math.round((row.total_tokens / sceneTotal) * 100) : 0}
          size="small"
          strokeColor={token.colorSuccess}
        />
      ),
    },
  ];

  const recentColumns: ProColumns<RecentRow>[] = [
    {
      title: '时间',
      dataIndex: 'created_at',
      width: 160,
      render: (_, row) =>
        row.created_at ? new Date(row.created_at).toLocaleString('zh-CN', { hour12: false }) : '—',
    },
    { title: '场景', dataIndex: 'scene', width: 140, ellipsis: true, render: (_, row) => row.scene || '未标注' },
    { title: '模型', dataIndex: 'model', ellipsis: true, render: (_, row) => row.model || '未知模型' },
    {
      title: 'Token',
      dataIndex: 'total_tokens',
      width: 110,
      align: 'right',
      render: (_, row) => (
        <Tooltip title={`输入 ${row.prompt_tokens} / 输出 ${row.completion_tokens}`}>
          {formatTokens(row.total_tokens)}
        </Tooltip>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      width: 90,
      align: 'right',
      render: (_, row) => formatDuration(row.duration_ms),
    },
    {
      title: '状态',
      dataIndex: 'success',
      width: 80,
      render: (_, row) =>
        row.success ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
    },
  ];

  const hasData = !!summary && summary.totals.calls > 0;

  return (
    <div style={{ padding: '20px 24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div className="app-eyebrow" style={{ color: token.colorTextTertiary, fontSize: 12, letterSpacing: '0.12em' }}>
            USAGE
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: 22 }}>用量统计</h2>
        </div>
        <Space wrap>
          <Segmented
            value={days}
            onChange={(value) => setDays(value as number)}
            options={[
              { label: '近 7 天', value: 7 },
              { label: '近 30 天', value: 30 },
              { label: '近 90 天', value: 90 },
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadSummary(days)}>
            刷新
          </Button>
        </Space>
      </div>

      {!hasData && !loading ? (
        <Card>
          <Empty description="还没有用量记录">
            <span style={{ color: token.colorTextSecondary }}>
              在「API 设置」中配置自己的模型 Key 并开始创作后，这里会显示调用次数与 Token 消耗。
            </span>
          </Empty>
        </Card>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <Card loading={loading} size="small">
              <Statistic title="调用次数" value={summary?.totals.calls ?? 0} />
            </Card>
            <Card loading={loading} size="small">
              <Statistic
                title="总 Token"
                value={formatTokens(summary?.totals.total_tokens ?? 0)}
                suffix={
                  <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                    输入 {formatTokens(summary?.totals.prompt_tokens ?? 0)} / 输出{' '}
                    {formatTokens(summary?.totals.completion_tokens ?? 0)}
                  </span>
                }
              />
            </Card>
            <Card loading={loading} size="small">
              <Statistic
                title="平均耗时"
                value={formatDuration(summary?.totals.avg_duration_ms ?? 0)}
                suffix={
                  <span style={{ fontSize: 12, color: token.colorTextTertiary }}>
                    累计 {formatDuration(summary?.totals.total_duration_ms ?? 0)}
                  </span>
                }
              />
            </Card>
            <Card loading={loading} size="small">
              <Statistic
                title="最近成功率"
                value={successRate === null ? '—' : successRate}
                suffix={successRate === null ? undefined : '%'}
              />
              <div style={{ fontSize: 12, color: token.colorTextTertiary, marginTop: 4 }}>
                基于最近 {summary?.recent.length ?? 0} 次调用
              </div>
            </Card>
          </div>

          <Card
            size="small"
            title="每日 Token 消耗"
            style={{ marginBottom: 16 }}
            extra={<span style={{ fontSize: 12, color: token.colorTextTertiary }}>峰值 {formatTokens(dailyMax)}</span>}
          >
            {dailySeries.every((item) => item.total_tokens === 0) ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该区间没有记录" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingTop: 8, overflowX: 'auto' }}>
                {dailySeries.map((item) => {
                  const height = Math.max(4, Math.round((item.total_tokens / dailyMax) * 100));
                  return (
                    <Tooltip
                      key={item.date}
                      title={`${item.date} · ${item.calls} 次 · ${item.total_tokens.toLocaleString()} Token`}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 6,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          height: '100%',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            height: `${height}%`,
                            borderRadius: 4,
                            background: `linear-gradient(180deg, ${token.colorPrimary}, ${token.colorPrimaryBorder})`,
                            opacity: item.total_tokens > 0 ? 1 : 0.25,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 10,
                            color: token.colorTextTertiary,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.date.slice(5)}
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </Card>

          <Card size="small" title="按模型" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
            <ProTable<ModelRow>
              rowKey={(row) => row.model}
              dataSource={summary?.by_model || []}
              columns={modelColumns}
              search={false}
              options={false}
              toolBarRender={false}
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无模型记录" /> }}
            />
          </Card>

          <Card size="small" title="按场景" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
            <ProTable<SceneRow>
              rowKey={(row) => row.scene}
              dataSource={summary?.by_scene || []}
              columns={sceneColumns}
              search={false}
              options={false}
              toolBarRender={false}
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无场景记录" /> }}
            />
          </Card>

          <Card size="small" title="最近调用" styles={{ body: { padding: 0 } }}>
            <ProTable<RecentRow>
              rowKey={(row) => row.id}
              dataSource={summary?.recent || []}
              columns={recentColumns}
              search={false}
              options={{ reload: false, density: false, setting: false }}
              toolBarRender={false}
              pagination={{ defaultPageSize: 10, showSizeChanger: false }}
              size="small"
              scroll={{ x: 720 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无调用记录" /> }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
