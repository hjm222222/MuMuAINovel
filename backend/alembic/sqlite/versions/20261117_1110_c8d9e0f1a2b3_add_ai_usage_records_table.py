"""新增AI用量记录表

Revision ID: c8d9e0f1a2b3
Revises: b7c8d9e0f1a2
Create Date: 2026-11-17 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ai_usage_records',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=50), nullable=False, comment='用户ID'),
        sa.Column('project_id', sa.String(length=36), nullable=True, comment='项目ID'),
        sa.Column('scene', sa.String(length=50), nullable=True, comment='调用场景，如章节生成'),
        sa.Column('provider', sa.String(length=50), nullable=True, comment='API提供商'),
        sa.Column('model', sa.String(length=100), nullable=True, comment='模型名称'),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True, server_default='0', comment='输入token数'),
        sa.Column('completion_tokens', sa.Integer(), nullable=True, server_default='0', comment='输出token数'),
        sa.Column('total_tokens', sa.Integer(), nullable=True, server_default='0', comment='总token数'),
        sa.Column('duration_ms', sa.Integer(), nullable=True, comment='调用耗时(毫秒)'),
        sa.Column('success', sa.Boolean(), nullable=False, server_default='1', comment='是否成功'),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.func.now(), comment='创建时间'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ai_usage_records_user_id', 'ai_usage_records', ['user_id'])
    op.create_index('ix_ai_usage_records_project_id', 'ai_usage_records', ['project_id'])
    op.create_index('ix_ai_usage_records_created_at', 'ai_usage_records', ['created_at'])
    op.create_index('idx_ai_usage_user_created', 'ai_usage_records', ['user_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('idx_ai_usage_user_created', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_created_at', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_project_id', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_user_id', table_name='ai_usage_records')
    op.drop_table('ai_usage_records')
