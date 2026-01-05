from server.models import db, SystemSettings

SYSTEM_SETTING_DEFAULTS = {
    'premium_report_cost': 1,
    'referral_bonus_credits': 1,
    'syrian_apps_count': 20,
}

def get_setting(key: str, default=None):
    """
    Get a system setting value by key.
    Returns the setting value, or default if not found.
    """
    setting = SystemSettings.query.filter_by(key=key).first()
    if setting and setting.value is not None:
        return setting.value
    if default is not None:
        return default
    return SYSTEM_SETTING_DEFAULTS.get(key)

def get_setting_int(key: str, default=None) -> int:
    """
    Get a system setting value as integer.
    Returns the setting value as int, or default if not found or invalid.
    """
    value = get_setting(key, default)
    try:
        return int(value)
    except (ValueError, TypeError):
        if default is not None:
            return int(default)
        return int(SYSTEM_SETTING_DEFAULTS.get(key, 0))

def get_premium_report_cost() -> int:
    """Get the credit cost for generating a premium report."""
    return get_setting_int('premium_report_cost', 1)

def get_referral_bonus_credits() -> int:
    """Get the number of credits awarded for successful referral."""
    return get_setting_int('referral_bonus_credits', 1)

def set_setting(key: str, value: str, description: str = None):
    """
    Set a system setting value.
    Creates the setting if it doesn't exist.
    """
    setting = SystemSettings.query.filter_by(key=key).first()
    if not setting:
        setting = SystemSettings(key=key, value=value, description=description)
        db.session.add(setting)
    else:
        setting.value = value
        if description:
            setting.description = description
    db.session.commit()
    return setting
