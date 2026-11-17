"""AI 用量记录服务：仅统计 token 与耗时，不做计费。"""
from __future__ import annotations

import logging
from contextvars import ContextVar
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_usage import AIUsageRecord

logger = logging.getLogger(__name__)

# 请求级场景标签，由中间件根据请求路径写入
current_usage_scene: ContextVar[Optional[str]] = ContextVar("current_usage_scene", default=None)

# 请求路径前缀 -> 用量场景标签
SCENE_BY_PATH_PREFIX = (
    ("/api/chapters", "章节创作"),
    ("/api/outlines", "大纲生成"),
    ("/api/characters", "角色生成"),
    ("/api/careers", "职业生成"),
    ("/api/organizations", "组织生成"),
    ("/api/relationships", "关系生成"),
    ("/api/polish", "文本润色"),
    ("/api/wizard", "向导生成"),
    ("/api/inspiration", "灵感创作"),
    ("/api/skills", "技能调用"),
    ("/api/project-agent", "项目助手"),
    ("/api/book-import", "拆书导入"),
    ("/api/foreshadow", "伏笔管理"),
    ("/api/memories", "记忆管理"),
)


def scene_from_path(path: str) -> Optional[str]:
    """根据请求路径推断用量场景标签。"""
    if not path:
        return None
    for prefix, scene in SCENE_BY_PATH_PREFIX:
        if path.startswith(prefix):
            return scene
    return None


async def record_ai_usage(
    db: AsyncSession,
    *,
    user_id: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    scene: Optional[str] = None,
    project_id: Optional[str] = None,
    prompt_tokens: Optional[int] = None,
    completion_tokens: Optional[int] = None,
    total_tokens: Optional[int] = None,
    duration_ms: Optional[int] = None,
    success: bool = True,
    commit: bool = True,
) -> Optional[AIUsageRecord]:
    """写入一条用量记录；写入失败不影响主流程。"""
    if not user_id:
        return None

    record = AIUsageRecord(
        user_id=user_id,
        project_id=project_id,
        scene=scene,
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens or 0,
        completion_tokens=completion_tokens or 0,
        total_tokens=total_tokens or 0,
        duration_ms=duration_ms,
        success=success,
    )
    try:
        db.add(record)
        if commit:
            await db.commit()
        else:
            await db.flush()
        return record
    except Exception as exc:
        logger.warning(f"记录AI用量失败（已忽略）: {exc}")
        if commit:
            try:
                await db.rollback()
            except Exception:
                pass
        return None


async def get_usage_summary(
    db: AsyncSession,
    *,
    user_id: str,
    days: int = 30,
    limit: int = 50,
) -> Dict[str, Any]:
    """统计用户用量：总量、按天、按模型、按场景与最近记录。"""
    days = max(1, min(int(days or 30), 365))
    since = datetime.now() - timedelta(days=days)

    total_result = await db.execute(
        select(
            func.count(AIUsageRecord.id),
            func.coalesce(func.sum(AIUsageRecord.prompt_tokens), 0),
            func.coalesce(func.sum(AIUsageRecord.completion_tokens), 0),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0),
            func.coalesce(func.avg(AIUsageRecord.duration_ms), 0),
            func.coalesce(func.sum(AIUsageRecord.duration_ms), 0),
        ).where(
            AIUsageRecord.user_id == user_id,
            AIUsageRecord.created_at >= since,
        )
    )
    total_row = total_result.one()
    call_count = int(total_row[0] or 0)
    prompt_tokens = int(total_row[1] or 0)
    completion_tokens = int(total_row[2] or 0)
    total_tokens = int(total_row[3] or 0)
    avg_duration = int(total_row[4] or 0)
    total_duration = int(total_row[5] or 0)

    daily_rows = await db.execute(
        select(
            func.date(AIUsageRecord.created_at),
            func.count(AIUsageRecord.id),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0),
        )
        .where(
            AIUsageRecord.user_id == user_id,
            AIUsageRecord.created_at >= since,
        )
        .group_by(func.date(AIUsageRecord.created_at))
        .order_by(func.date(AIUsageRecord.created_at))
    )
    daily: List[Dict[str, Any]] = [
        {
            "date": str(row[0]),
            "calls": int(row[1] or 0),
            "total_tokens": int(row[2] or 0),
        }
        for row in daily_rows.all()
    ]

    model_rows = await db.execute(
        select(
            AIUsageRecord.model,
            func.count(AIUsageRecord.id),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0),
        )
        .where(
            AIUsageRecord.user_id == user_id,
            AIUsageRecord.created_at >= since,
        )
        .group_by(AIUsageRecord.model)
        .order_by(func.sum(AIUsageRecord.total_tokens).desc())
    )
    by_model: List[Dict[str, Any]] = [
        {
            "model": row[0] or "未知模型",
            "calls": int(row[1] or 0),
            "total_tokens": int(row[2] or 0),
        }
        for row in model_rows.all()
    ]

    scene_rows = await db.execute(
        select(
            AIUsageRecord.scene,
            func.count(AIUsageRecord.id),
            func.coalesce(func.sum(AIUsageRecord.total_tokens), 0),
        )
        .where(
            AIUsageRecord.user_id == user_id,
            AIUsageRecord.created_at >= since,
        )
        .group_by(AIUsageRecord.scene)
        .order_by(func.count(AIUsageRecord.id).desc())
    )
    by_scene: List[Dict[str, Any]] = [
        {
            "scene": row[0] or "未标注场景",
            "calls": int(row[1] or 0),
            "total_tokens": int(row[2] or 0),
        }
        for row in scene_rows.all()
    ]

    recent_result = await db.execute(
        select(AIUsageRecord)
        .where(AIUsageRecord.user_id == user_id)
        .order_by(AIUsageRecord.created_at.desc())
        .limit(max(1, min(int(limit or 50), 200)))
    )
    recent = [
        {
            "id": row.id,
            "scene": row.scene,
            "model": row.model,
            "provider": row.provider,
            "prompt_tokens": row.prompt_tokens or 0,
            "completion_tokens": row.completion_tokens or 0,
            "total_tokens": row.total_tokens or 0,
            "duration_ms": row.duration_ms or 0,
            "success": bool(row.success),
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in recent_result.scalars().all()
    ]

    return {
        "days": days,
        "totals": {
            "calls": call_count,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "avg_duration_ms": avg_duration,
            "total_duration_ms": total_duration,
        },
        "daily": daily,
        "by_model": by_model,
        "by_scene": by_scene,
        "recent": recent,
    }
