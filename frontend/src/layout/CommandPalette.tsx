import { useEffect, useMemo, useRef, useState } from 'react';
import { Empty, Input, Modal, Tag, theme } from 'antd';
import { EnterOutlined, SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { ReactNode } from 'react';
import type { ShellMenuItem } from './ProAppShell';

export interface CommandPaletteEntry {
  key: string;
  label: string;
  group?: string;
  icon?: ReactNode;
}

const SCORE_CONTINUE_MATCH = 1;
const SCORE_SPACE_WORD_JUMP = 0.9;
const SCORE_NON_SPACE_WORD_JUMP = 0.8;
const SCORE_CHARACTER_JUMP = 0.17;
const PENALTY_SKIPPED = 0.999;
const PENALTY_DISTANCE_FROM_START = 0.9;
const PENALTY_NOT_COMPLETE = 0.99;
const SPACE_REGEXP = /[\s-]/;
const GAP_REGEXP = /[\\/_+.#"@[({&]/;

export function commandScore(text: string, query: string): number {
  if (!query) return 1;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return 1;

  let score = 0;
  let textIndex = 0;
  let lastMatchIndex = -1;

  for (let queryIndex = 0; queryIndex < normalizedQuery.length; queryIndex += 1) {
    const char = normalizedQuery[queryIndex];
    if (char === ' ') continue;

    let matched = false;
    while (textIndex < normalizedText.length) {
      const candidate = normalizedText[textIndex];
      if (candidate === char) {
        const previous = lastMatchIndex >= 0 ? normalizedText[lastMatchIndex] : null;
        if (lastMatchIndex === textIndex - 1 && lastMatchIndex >= 0) {
          score += SCORE_CONTINUE_MATCH;
        } else if (lastMatchIndex < 0) {
          score += SCORE_SPACE_WORD_JUMP * PENALTY_DISTANCE_FROM_START ** textIndex;
        } else if (previous && SPACE_REGEXP.test(previous)) {
          score += SCORE_SPACE_WORD_JUMP;
        } else if (previous && GAP_REGEXP.test(previous)) {
          score += SCORE_NON_SPACE_WORD_JUMP;
        } else {
          score += SCORE_CHARACTER_JUMP;
        }
        lastMatchIndex = textIndex;
        textIndex += 1;
        matched = true;
        break;
      }
      score *= PENALTY_SKIPPED;
      textIndex += 1;
    }

    if (!matched) return 0;
  }

  if (normalizedText === normalizedQuery) score *= 1;
  else if (normalizedText.startsWith(normalizedQuery)) score *= PENALTY_NOT_COMPLETE;
  return score / normalizedQuery.length;
}

const menuLabel = (item: ShellMenuItem): string => {
  if (typeof item.name === 'string' || typeof item.name === 'number') return String(item.name);
  return item.key ?? item.path;
};

export function flattenMenuItems(items: ShellMenuItem[]): CommandPaletteEntry[] {
  const entries: CommandPaletteEntry[] = [];
  const walk = (nodes: ShellMenuItem[], group?: string) => {
    nodes.forEach((node) => {
      if (node.children?.length) {
        walk(node.children, menuLabel(node));
        return;
      }
      entries.push({
        key: node.key ?? node.path,
        label: menuLabel(node),
        group,
        icon: node.icon,
      });
    });
  };
  walk(items);
  return entries;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  entries: CommandPaletteEntry[];
  onSelect: (key: string) => void;
}

export default function CommandPalette({ open, onClose, entries, onSelect }: CommandPaletteProps) {
  const { token } = theme.useToken();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<InputRef | null>(null);

  const results = useMemo(() => {
    const keyword = query.trim();
    if (!keyword) return entries.map((entry) => ({ entry, score: 1 }));
    return entries
      .map((entry) => {
        const labelScore = commandScore(entry.label, keyword);
        const groupScore = entry.group ? commandScore(entry.group, keyword) * 0.6 : 0;
        return { entry, score: Math.max(labelScore, groupScore) };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [entries, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const handleSelect = (key: string) => {
    onSelect(key);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) handleSelect(target.entry.key);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={560}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible) {
          inputRef.current?.focus();
        }
      }}
      styles={{ body: { padding: 0 } }}
      style={{ top: 88 }}
    >
      <div onKeyDown={handleKeyDown}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <Input
            ref={inputRef}
            autoFocus
            allowClear
            variant="borderless"
            size="large"
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="搜索页面、功能，回车直达"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
          {results.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的页面或功能" style={{ padding: 24 }} />
          ) : (
            results.map(({ entry }, index) => {
              const active = index === activeIndex;
              const showGroup = index === 0 || results[index - 1].entry.group !== entry.group;
              return (
                <div key={`${entry.group ?? ''}-${entry.key}`}>
                  {showGroup && entry.group && (
                    <div
                      style={{
                        padding: '8px 18px 4px',
                        fontSize: 12,
                        color: token.colorTextTertiary,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {entry.group}
                    </div>
                  )}
                  <div
                    data-index={index}
                    role="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(entry.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      margin: '0 8px',
                      padding: '9px 10px',
                      borderRadius: token.borderRadius,
                      cursor: 'pointer',
                      background: active ? token.colorPrimaryBg : 'transparent',
                      color: active ? token.colorPrimary : token.colorText,
                    }}
                  >
                    <span style={{ width: 18, display: 'flex', justifyContent: 'center', color: 'inherit' }}>
                      {entry.icon ?? <SearchOutlined />}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.label}
                    </span>
                    {entry.group && !showGroup && <Tag bordered={false}>{entry.group}</Tag>}
                    {active && <EnterOutlined style={{ color: token.colorTextTertiary }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            color: token.colorTextTertiary,
            fontSize: 12,
          }}
        >
          <span>↑↓ 选择 · ↵ 打开 · esc 关闭</span>
          <span>{results.length} 项</span>
        </div>
      </div>
    </Modal>
  );
}
