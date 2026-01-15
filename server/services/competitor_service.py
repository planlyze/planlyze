SYRIAN_COMPETITORS = [
    {
        "name": "Wadily",
        "features": ["On-Demand Delivery", "Vehicle Selection", "Appointment Scheduling", "Real-time Tracking", "Large-Scale Logistics"],
        "social": {"facebook": "https://facebook.com/wadily", "instagram": "https://instagram.com/wadily", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.rightware.wadily", "ios": None, "website": "https://wadily.com"},
        "cities": ["Dubai", "Abu Dhabi", "Sharjah"]
    },
    {
        "name": "Postajji",
        "features": ["Multi-Vendor Shopping", "Order Management", "Live Tracking", "Store Categorization", "Express Delivery"],
        "social": {"facebook": "https://facebook.com/postajji", "instagram": "https://instagram.com/postajji", "whatsapp": None, "telegram": "https://t.me/postajji"},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.syweb.postajji", "ios": "https://apps.apple.com/app/postajji/id6746733875", "website": "https://postajji.com"},
        "cities": ["Damascus", "Aleppo", "Homs", "Lattakia"]
    },
    {
        "name": "Mawshili",
        "features": ["Web-to-App Interface", "Service Directory", "Push Notifications", "Biometric Login", "Native Navigation"],
        "social": {"facebook": "https://facebook.com/mawshili", "instagram": None, "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=io.gonative.android.kyxdym", "ios": None, "website": "https://mawshili.com"},
        "cities": ["All Syria"]
    },
    {
        "name": "Wassili",
        "features": ["Business Logistics", "Order Dispatch", "Admin Dashboard", "Fleet Management", "Rider Integration"],
        "social": {"facebook": "https://facebook.com/wassili", "instagram": None, "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.innovsoft.wassili", "ios": None, "website": None},
        "cities": ["Damascus", "Rif Dimashq"]
    },
    {
        "name": "Target Market",
        "features": ["Grocery Browsing", "Rapid Delivery", "Barcode Scanner", "Voucher Wallet", "Real-Time Tracking"],
        "social": {"facebook": "https://facebook.com/TargetMarketApp", "instagram": "https://instagram.com/target_market", "whatsapp": None, "telegram": "https://t.me/TargetMarketBot"},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.DotCode.TargetMarket", "ios": None, "website": "https://target-market.net"},
        "cities": ["Damascus", "Aleppo", "Lattakia"]
    },
    {
        "name": "Movo",
        "features": ["Food Delivery", "Pharmacy Access", "Order Tracking", "International Payments", "Address Management"],
        "social": {"facebook": "https://facebook.com/movoapp", "instagram": "https://instagram.com/movo.app", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.movo.movouser", "ios": "https://apps.apple.com/app/movo-delivery/id1487602510", "website": "https://movo-app.com"},
        "cities": ["Damascus", "Homs", "Aleppo", "Lattakia"]
    },
    {
        "name": "BeeOrder",
        "features": ["Restaurant Marketplace", "Smart Search", "Voucher Wallet", "Loyalty System", "Live Order Tracking"],
        "social": {"facebook": "https://facebook.com/beeorder", "instagram": "https://instagram.com/beeorder", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.beeorder.customer", "ios": "https://apps.apple.com/app/beeorder/id1143890251", "website": "https://beeorder.com"},
        "cities": ["Damascus", "Aleppo", "Homs", "Tartous", "Lattakia"]
    },
    {
        "name": "Khalifa Meat",
        "features": ["Fresh Meat Catalog", "Custom Cuts", "Secure Payments", "Recipe Suggestions", "Holiday Pre-ordering"],
        "social": {"facebook": "https://facebook.com/khalifameat", "instagram": "https://instagram.com/khalifameat", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.khalifameat.khalifa", "ios": None, "website": "https://khalifameat.com"},
        "cities": ["Damascus"]
    },
    {
        "name": "Kammun",
        "features": ["Grocery E-commerce", "Cash on Delivery", "Workplace Delivery", "Personalized Discounts", "Price Monitoring"],
        "social": {"facebook": "https://facebook.com/kammunapp", "instagram": "https://instagram.com/kammun.app", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.kammun.app", "ios": None, "website": "https://kammun.com"},
        "cities": ["Damascus", "Aleppo"]
    },
    {
        "name": "DigiShi",
        "features": ["E-Retail Marketplace", "Integrated Supermarket", "Free Delivery Thresholds", "After-Sales Support", "Flash Deals"],
        "social": {"facebook": "https://facebook.com/digishi.sy", "instagram": "https://instagram.com/digishi.sy", "whatsapp": None, "telegram": "https://t.me/digishi"},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.digishi.android", "ios": None, "website": "https://digishi.net"},
        "cities": ["All Syria"]
    },
    {
        "name": "Harbuk",
        "features": ["Regional Marketplace", "Buyer Community", "Wishlist Management", "Universal Cart", "Flash Deals"],
        "social": {"facebook": "https://facebook.com/harbuk", "instagram": "https://instagram.com/harbuk", "whatsapp": None, "telegram": None},
        "app_links": {"android": "https://play.google.com/store/apps/details?id=com.c_od_e.harbukcom", "ios": None, "website": "https://harbuk.com"},
        "cities": ["Damascus", "Aleppo", "Homs"]
    }
]


def get_competitors_for_analysis(industry=None):
    return SYRIAN_COMPETITORS


def format_competitors_for_prompt(competitors):
    if not competitors:
        return "No competitor data available."
    
    lines = []
    for i, comp in enumerate(competitors, 1):
        lines.append(f"\n--- Competitor {i}: {comp['name']} ---")
        
        if comp.get('features'):
            features_str = ", ".join(comp['features'][:15])
            if len(comp['features']) > 15:
                features_str += f" (+{len(comp['features']) - 15} more)"
            lines.append(f"Features: {features_str}")
        
        if comp.get('cities'):
            cities = comp['cities'] if isinstance(comp['cities'], list) else [comp['cities']]
            lines.append(f"Operating Cities: {', '.join(cities)}")
        
        links = []
        if comp.get('app_links', {}).get('android'):
            links.append(f"Android: {comp['app_links']['android']}")
        if comp.get('app_links', {}).get('ios'):
            links.append(f"iOS: {comp['app_links']['ios']}")
        if comp.get('app_links', {}).get('website'):
            links.append(f"Website: {comp['app_links']['website']}")
        if links:
            lines.append(f"App Links: {'; '.join(links)}")
        
        social_links = []
        social = comp.get('social', {})
        if social.get('facebook'):
            social_links.append(f"Facebook: {social['facebook']}")
        if social.get('instagram'):
            social_links.append(f"Instagram: {social['instagram']}")
        if social.get('whatsapp'):
            social_links.append(f"WhatsApp: {social['whatsapp']}")
        if social.get('telegram'):
            social_links.append(f"Telegram: {social['telegram']}")
        if social_links:
            lines.append(f"Social: {'; '.join(social_links)}")
    
    return "\n".join(lines)
