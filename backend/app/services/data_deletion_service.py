"""用户数据删除服务：支持删除创作数据与全部账号数据。"""
from __future__ import annotations

from typing import Dict, List

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base
from app.models.project import Project

# 创作数据删除时保留的账号与个人配置表
PRESERVED_TABLES = {
    "users",
    "user_passwords",
    "settings",
    "writing_styles",
    "prompt_templates",
    "mcp_plugins",
    "prompt_workshop_items",
    "prompt_submissions",
    "prompt_workshop_likes",
    "announcements",
}


async def _project_ids(db: AsyncSession, user_id: str) -> List[str]:
    result = await db.execute(select(Project.id).where(Project.user_id == user_id))
    return list(result.scalars().all())


async def _delete_project_scoped(db: AsyncSession, project_ids: List[str]) -> Dict[str, int]:
    deleted: Dict[str, int] = {}
    if not project_ids:
        return deleted

    # 显式清理带 project_id 的关联表，避免依赖数据库级联行为
    for table in reversed(Base.metadata.sorted_tables):
        if "project_id" not in table.c:
            continue
        result = await db.execute(delete(table).where(table.c.project_id.in_(project_ids)))
        count = result.rowcount or 0
        if count:
            deleted[table.name] = deleted.get(table.name, 0) + count

    await db.execute(delete(Project).where(Project.id.in_(project_ids)))
    deleted["projects"] = len(project_ids)
    return deleted


async def delete_creative_data(db: AsyncSession, user_id: str) -> Dict[str, int]:
    """删除用户全部创作数据（项目及其关联数据、用量记录），保留账号与个人设置。"""
    project_ids = await _project_ids(db, user_id)
    deleted = await _delete_project_scoped(db, project_ids)

    # 用户级统计数据（无外键约束）
    for table in reversed(Base.metadata.sorted_tables):
        if "user_id" not in table.c or table.name in PRESERVED_TABLES:
            continue
        result = await db.execute(delete(table).where(table.c.user_id == user_id))
        count = result.rowcount or 0
        if count:
            deleted[table.name] = deleted.get(table.name, 0) + count

    await db.commit()
    return deleted


async def delete_all_data(db: AsyncSession, user_id: str) -> Dict[str, int]:
    """删除创作数据与账号数据（含账号本身）。"""
    deleted = await delete_creative_data(db, user_id)

    for table in reversed(Base.metadata.sorted_tables):
        if "user_id" not in table.c:
            continue
        result = await db.execute(delete(table).where(table.c.user_id == user_id))
        count = result.rowcount or 0
        if count:
            deleted[table.name] = deleted.get(table.name, 0) + count

    await db.commit()
    return deleted
