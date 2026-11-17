"""用户自带 API Key 的加密存储与脱敏工具。

密钥在数据库中以密文保存，接口只返回掩码值；运行时按需解密，
历史明文数据保持兼容读取。
"""
import base64
import hashlib
import logging
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings as app_settings

logger = logging.getLogger(__name__)

CIPHER_PREFIX = "enc:v1:"
MASK_SEPARATOR = "***"


def _get_cipher() -> Optional[Fernet]:
    """构建 Fernet 实例；未配置密钥时返回 None。"""
    raw_key = app_settings.CREDENTIAL_ENCRYPTION_KEY or app_settings.SESSION_SECRET_KEY
    if not raw_key:
        return None
    digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def is_encrypted(value: Optional[str]) -> bool:
    """判断字符串是否为密文。"""
    return bool(value) and value.startswith(CIPHER_PREFIX)


def encryption_enabled() -> bool:
    """判断当前部署是否启用了密钥加密。"""
    return _get_cipher() is not None


def encrypt_secret(plain_text: Optional[str]) -> str:
    """加密敏感配置；未启用加密时保留原值并记录告警。"""
    if not plain_text:
        return ""
    if is_encrypted(plain_text):
        return plain_text
    cipher = _get_cipher()
    if cipher is None:
        logger.warning("未配置 CREDENTIAL_ENCRYPTION_KEY 或 SESSION_SECRET_KEY，敏感配置将以明文保存")
        return plain_text
    token = cipher.encrypt(plain_text.encode("utf-8")).decode("utf-8")
    return f"{CIPHER_PREFIX}{token}"


def decrypt_secret(stored_value: Optional[str]) -> str:
    """解密敏感配置，兼容历史明文数据。"""
    if not stored_value:
        return ""
    if not is_encrypted(stored_value):
        return stored_value
    cipher = _get_cipher()
    if cipher is None:
        logger.error("敏感配置为密文，但服务端缺少解密密钥")
        return ""
    try:
        payload = stored_value[len(CIPHER_PREFIX):].encode("utf-8")
        return cipher.decrypt(payload).decode("utf-8")
    except (InvalidToken, ValueError):
        logger.error("敏感配置解密失败，请检查加密密钥是否发生变化")
        return ""


def mask_secret(plain_text: Optional[str]) -> str:
    """生成展示用掩码，例如 sk-abc***wxyz。"""
    if not plain_text:
        return ""
    text = plain_text.strip()
    if len(text) <= 4:
        return MASK_SEPARATOR
    if len(text) <= 8:
        return f"{text[:2]}{MASK_SEPARATOR}{text[-2:]}"
    return f"{text[:6]}{MASK_SEPARATOR}{text[-4:]}"


def mask_stored_secret(stored_value: Optional[str]) -> str:
    """对数据库中保存的敏感配置生成掩码展示值。"""
    return mask_secret(decrypt_secret(stored_value))


def is_masked_placeholder(value: Optional[str]) -> bool:
    """判断前端回传的值是否为掩码占位符。"""
    return bool(value) and MASK_SEPARATOR in value


def prepare_secret_for_storage(
    incoming: Optional[str],
    current_stored: Optional[str],
) -> str:
    """保存敏感配置：掩码值视为未修改，空字符串表示清空。"""
    if incoming is None:
        return current_stored or ""
    if incoming == "":
        return ""
    current_plain = decrypt_secret(current_stored)
    if current_plain and incoming == mask_secret(current_plain):
        return current_stored or ""
    return encrypt_secret(incoming)


def resolve_secret_for_runtime(
    incoming: Optional[str],
    current_stored: Optional[str],
) -> str:
    """运行时取值：空值或掩码占位符时回退到已保存的密钥。"""
    if incoming and not is_masked_placeholder(incoming):
        return decrypt_secret(incoming)
    return decrypt_secret(current_stored)
