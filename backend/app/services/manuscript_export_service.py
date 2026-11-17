"""全书稿件导出服务：输出 Markdown / TXT 纯文本稿件。"""
from __future__ import annotations

import re
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chapter import Chapter
from app.models.character import Character
from app.models.outline import Outline
from app.models.project import Project

SUPPORTED_FORMATS = ("markdown", "txt")


def _sanitize_filename(title: str) -> str:
    """清理标题中的路径敏感字符。"""
    cleaned = re.sub(r'[\\/:*?"<>|\r\n]+', "", title or "").strip()
    cleaned = re.sub(r"\s+", "_", cleaned)
    return cleaned[:80] or "novel"


def _chapter_heading(chapter: Chapter, markdown: bool) -> str:
    title = (chapter.title or "").strip()
    if markdown:
        return f"## 第{chapter.chapter_number}章 {title}".rstrip()
    return f"第{chapter.chapter_number}章 {title}".rstrip()


def _build_appendix(
    project: Project,
    outlines: List[Outline],
    characters: List[Character],
    markdown: bool,
) -> List[str]:
    """构建附录：大纲与角色表。"""
    blocks: List[str] = []

    if outlines:
        heading = "## 附录一 · 大纲" if markdown else "附录一 · 大纲"
        blocks.append(heading)
        for outline in outlines:
            title = (outline.title or "").strip()
            summary = (outline.content or "").strip()
            if markdown:
                blocks.append(f"### {title}")
                if summary:
                    blocks.append(summary)
                blocks.append("")
            else:
                blocks.append(title)
                if summary:
                    blocks.append(summary)
                blocks.append("")

    if characters:
        heading = "## 附录二 · 角色表" if markdown else "附录二 · 角色表"
        blocks.append(heading)
        for character in characters:
            name = (character.name or "").strip()
            attributes: List[str] = []
            if character.age:
                attributes.append(f"年龄：{character.age}")
            if character.gender:
                attributes.append(f"性别：{character.gender}")
            if character.role_type:
                attributes.append(f"定位：{character.role_type}")
            if character.personality:
                attributes.append(f"性格：{character.personality}")
            if character.background:
                attributes.append(f"背景：{character.background}")
            if markdown:
                blocks.append(f"### {name}")
                blocks.extend(f"- {item}" for item in attributes)
                blocks.append("")
            else:
                blocks.append(name)
                blocks.extend(attributes)
                blocks.append("")

    return blocks


async def build_manuscript(
    db: AsyncSession,
    *,
    project: Project,
    format: str = "markdown",
    include_appendix: bool = True,
    include_draft: bool = True,
) -> Tuple[str, str]:
    """生成全书稿件，返回（文件内容, 文件名）。"""
    normalized_format = (format or "markdown").lower().strip()
    if normalized_format not in SUPPORTED_FORMATS:
        raise ValueError(f"不支持的导出格式: {format}")
    markdown = normalized_format == "markdown"

    chapter_result = await db.execute(
        select(Chapter)
        .where(Chapter.project_id == project.id)
        .order_by(Chapter.chapter_number, Chapter.sub_index)
    )
    chapters = list(chapter_result.scalars().all())
    if not include_draft:
        chapters = [chapter for chapter in chapters if (chapter.status or "") != "draft"]

    outlines: List[Outline] = []
    characters: List[Character] = []
    if include_appendix:
        outline_result = await db.execute(
            select(Outline)
            .where(Outline.project_id == project.id)
            .order_by(Outline.order_index)
        )
        outlines = list(outline_result.scalars().all())
        character_result = await db.execute(
            select(Character)
            .where(Character.project_id == project.id)
            .order_by(Character.created_at)
        )
        characters = list(character_result.scalars().all())

    total_words = sum(len(chapter.content or "") for chapter in chapters)
    blocks: List[str] = []

    if markdown:
        blocks.append(f"# {project.title}")
        blocks.append("")
        if project.description:
            blocks.append(f"> {project.description.strip()}")
            blocks.append("")
        blocks.append(f"> 章节数：{len(chapters)}　总字数：{total_words}")
        blocks.append("")
        blocks.append("---")
        blocks.append("")
    else:
        blocks.append(project.title)
        blocks.append("")
        if project.description:
            blocks.append(project.description.strip())
            blocks.append("")
        blocks.append(f"章节数：{len(chapters)}　总字数：{total_words}")
        blocks.append("")
        blocks.append("=" * 40)
        blocks.append("")

    for chapter in chapters:
        blocks.append(_chapter_heading(chapter, markdown))
        blocks.append("")
        content = (chapter.content or "").strip()
        if content:
            blocks.append(content)
        else:
            blocks.append("（本章暂无内容）" if markdown else "（本章暂无内容）")
        blocks.append("")

    if include_appendix:
        blocks.extend(_build_appendix(project, outlines, characters, markdown))

    extension = "md" if markdown else "txt"
    filename = f"{_sanitize_filename(project.title)}.{extension}"
    return "\n".join(blocks).rstrip() + "\n", filename


def get_manuscript_media_type(format: str) -> str:
    """按导出格式返回 Content-Type。"""
    return "text/markdown; charset=utf-8" if (format or "").lower() == "markdown" else "text/plain; charset=utf-8"


async def build_manuscript_for_user(
    db: AsyncSession,
    *,
    project_id: str,
    user_id: str,
    format: str = "markdown",
    include_appendix: bool = True,
    include_draft: bool = True,
) -> Optional[Tuple[str, str]]:
    """按用户权限生成全书稿件，项目不存在或无权访问时返回 None。"""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        return None

    return await build_manuscript(
        db,
        project=project,
        format=format,
        include_appendix=include_appendix,
        include_draft=include_draft,
    )
