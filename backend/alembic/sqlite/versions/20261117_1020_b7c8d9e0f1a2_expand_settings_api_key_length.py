"""扩展settings表密钥字段长度以支持密文存储

Revision ID: b7c8d9e0f1a2
Revises: 20260914_knowledge
Create Date: 2026-11-17 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = '20260914_knowledge'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.alter_column(
            'api_key',
            type_=sa.String(length=1000),
            existing_type=sa.String(length=500),
            existing_comment='API密钥',
        )
        batch_op.alter_column(
            'cover_api_key',
            type_=sa.String(length=1000),
            existing_type=sa.String(length=500),
            existing_comment='封面图片API密钥',
        )


def downgrade() -> None:
    with op.batch_alter_table('settings', schema=None) as batch_op:
        batch_op.alter_column(
            'api_key',
            type_=sa.String(length=500),
            existing_type=sa.String(length=1000),
            existing_comment='API密钥（密文存储）',
        )
        batch_op.alter_column(
            'cover_api_key',
            type_=sa.String(length=500),
            existing_type=sa.String(length=1000),
            existing_comment='封面图片API密钥（密文存储）',
        )
