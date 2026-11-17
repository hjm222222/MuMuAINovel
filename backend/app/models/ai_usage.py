"""AI 用量记录数据模型"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Index, func
from app.database import Base
import uuid


class AIUsageRecord(Base):
    """AI 调用用量记录表（仅统计，不计费）"""
    __tablename__ = "ai_usage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(50), nullable=False, index=True, comment="用户ID")
    project_id = Column(String(36), index=True, comment="项目ID")
    scene = Column(String(50), comment="调用场景，如章节生成")
    provider = Column(String(50), comment="API提供商")
    model = Column(String(100), comment="模型名称")
    prompt_tokens = Column(Integer, default=0, comment="输入token数")
    completion_tokens = Column(Integer, default=0, comment="输出token数")
    total_tokens = Column(Integer, default=0, comment="总token数")
    duration_ms = Column(Integer, comment="调用耗时(毫秒)")
    success = Column(Boolean, default=True, server_default="1", nullable=False, comment="是否成功")
    created_at = Column(DateTime, server_default=func.now(), index=True, comment="创建时间")

    __table_args__ = (
        Index('idx_ai_usage_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        return f"<AIUsageRecord(id={self.id}, user_id={self.user_id}, total_tokens={self.total_tokens})>"
