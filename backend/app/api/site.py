"""站点公共配置 API：品牌信息与合规声明。"""
from fastapi import APIRouter

from app.config import settings

router = APIRouter(prefix="/site", tags=["站点配置"])


@router.get("/branding", summary="获取站点品牌与合规配置")
async def get_branding():
    """返回前端渲染所需的品牌信息，均可由环境变量覆盖。"""
    return {
        "app_name": settings.app_name,
        "slogan": settings.app_slogan,
        "description": settings.app_description,
        "primary_color": settings.brand_primary_color,
        "accent_color": settings.brand_accent_color,
        "footer_note": settings.brand_footer_note,
        "upstream_name": settings.upstream_name,
        "upstream_url": settings.upstream_url,
        "license": settings.license_name,
        "license_url": settings.license_url,
        "ai_content_notice": settings.ai_content_notice,
        "version": settings.app_version,
    }
