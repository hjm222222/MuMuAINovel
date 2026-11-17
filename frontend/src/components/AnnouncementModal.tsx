import { Modal, Button, Space, theme } from 'antd';

interface AnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onDoNotShowToday: () => void;
  onNeverShow: () => void;
}

const NOTICE_ITEMS = [
  {
    title: '站点性质',
    content: '本站是公益性质的 AI 小说创作工具，只提供创作功能，不设书城、阅读、评论、付费会员与打赏，不向用户收取任何费用。',
  },
  {
    title: '依法使用',
    content: '请遵守《中华人民共和国网络安全法》《网络信息内容生态治理规定》《出版管理条例》等法律法规以及你所在地区的相关规定。',
  },
  {
    title: '禁止内容',
    content: '不得利用本站创作、导入、存储或传播违法违规信息，包括危害国家安全、泄露国家秘密、煽动民族仇恨与地域歧视、淫秽色情、暴力恐怖、赌博诈骗、侵犯他人隐私与名誉、侵犯著作权等内容。',
  },
  {
    title: '内容责任',
    content: '作品由创作者本人完成并承担全部责任。AI 生成内容仅作辅助参考，请经人工审校后再对外发布或商用。',
  },
  {
    title: '版权归属',
    content: '作品著作权归创作者本人所有；请勿导入或上传你未获得授权的第三方作品。',
  },
  {
    title: '未成年人保护',
    content: '未成年人应在监护人指导下使用本站，不得生成不适宜其年龄的内容。',
  },
  {
    title: '模型与费用',
    content: '本站不承担模型调用费用，模型服务与 API Key 由你自行配置和保管；平台对密钥加密存储，接口只返回掩码，不回显明文。',
  },
  {
    title: '数据与隐私',
    content: '你可以随时在「设置 - 数据与隐私」中导出或删除自己的创作数据。',
  },
  {
    title: '违规处理',
    content: '对违法违规内容，本站有权删除相关内容并停止提供服务；情节严重的，将依法向有关部门报告。',
  },
  {
    title: '免责声明',
    content: '因用户违反法律法规或本须知造成的任何后果，由用户自行承担。',
  },
];

export default function AnnouncementModal({ visible, onClose, onDoNotShowToday, onNeverShow }: AnnouncementModalProps) {
  const { token } = theme.useToken();
  const alphaColor = (color: string, alpha: number) => `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(0)}%, transparent)`;

  const handleDoNotShowToday = () => {
    onDoNotShowToday();
    onClose();
  };

  const handleNeverShow = () => {
    onNeverShow();
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{
          fontSize: '20px',
          fontWeight: 600,
          color: token.colorPrimary,
          textAlign: 'center',
        }}>
          使用须知与合规承诺
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            onClick={handleDoNotShowToday}
            size="large"
            style={{
              borderRadius: '8px',
              height: '40px',
              fontSize: '14px',
            }}
          >
            今日不再提示
          </Button>
          <Button
            type="primary"
            onClick={handleNeverShow}
            size="large"
            style={{
              borderRadius: '8px',
              height: '40px',
              fontSize: '14px',
              background: token.colorPrimary,
              borderColor: token.colorPrimary,
              boxShadow: `0 8px 20px ${alphaColor(token.colorPrimary, 0.32)}`,
            }}
          >
            同意并继续
          </Button>
        </Space>
      }
      width={700}
      centered
      styles={{
        body: {
          padding: '20px',
          background: token.colorBgContainer,
          maxHeight: '62vh',
          overflowY: 'auto',
        },
        header: {
          background: `linear-gradient(135deg, ${alphaColor(token.colorPrimary, 0.1)} 0%, ${alphaColor(token.colorBgContainer, 0.98)} 100%)`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '16px 24px',
        },
        footer: {
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: '16px 24px',
        },
      }}
    >
      <div>
        <p style={{
          marginBottom: '14px',
          fontSize: '14px',
          color: token.colorTextSecondary,
          lineHeight: '1.7',
        }}>
          本站是公益性质的 AI 小说创作工具站点，请阅读以下条款后再继续使用。
        </p>

        <ol style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '14px',
          lineHeight: '1.75',
          color: token.colorText,
        }}>
          {NOTICE_ITEMS.map((item) => (
            <li key={item.title} style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 600 }}>{item.title}：</span>
              <span style={{ color: token.colorTextSecondary }}>{item.content}</span>
            </li>
          ))}
        </ol>

        <div style={{
          marginTop: '16px',
          padding: '10px 12px',
          background: token.colorFillTertiary,
          borderRadius: '8px',
          border: `1px solid ${token.colorBorderSecondary}`,
          fontSize: '13px',
          color: token.colorTextSecondary,
          lineHeight: '1.6',
        }}>
          点击「同意并继续」表示你已阅读并同意上述条款，此后不再弹出本提示；选择「今日不再提示」则当天内不再展示。
        </div>
      </div>
    </Modal>
  );
}
