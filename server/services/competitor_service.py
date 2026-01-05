import requests
import json
from functools import lru_cache

COMPETITOR_FILE_URLS = {
    "delivery": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Delivery.txt",
    "beautyecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceBeauty.txt",
    "clothesecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceClothes.txt",
    "electronicsecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceElectronics.txt",
    "foodecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceFood.txt",
    "medicineecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceMedicine.txt",
    "stuffecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceStuff.txt",
    "supermarketecommerce": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceSupermarket.txt",
    "generalhealth": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Health.txt",
    "joboppurtunity": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/JobOppurtunity.txt",
    "sellrentcars": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/SellRent%20Cars.txt",
    "sellrentrealestate": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/SellRentRealestate.txt",
    "servicestaxi": "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Taxi.txt",
}

DEFAULT_COMPETITOR_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ada7a5a5c2551f351100ff/a53e045a5c2551f351100ff/a53e045a7_Competitor.txt"


def fetch_competitor_data(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        text = response.text.strip()
        if text.startswith('['):
            return json.loads(text)
        return []
    except Exception as e:
        print(f"Error fetching competitor data from {url}: {e}")
        return []


def get_competitor_file_url(industry):
    if not industry:
        return DEFAULT_COMPETITOR_URL
    normalized = str(industry).lower().replace(" ", "").replace("-", "").replace("_", "")
    return COMPETITOR_FILE_URLS.get(normalized, DEFAULT_COMPETITOR_URL)


def simplify_competitor_data(raw_data):
    simplified = []
    for item in raw_data:
        if not isinstance(item, dict):
            continue
        
        app_name = item.get("App Name", item.get("appName", item.get("name", "")))
        if not app_name:
            continue
        
        features_raw = item.get("Features", item.get("features", {})) or {}
        enabled_features = []
        if isinstance(features_raw, dict):
            for feature_name, value in features_raw.items():
                if value == "TRUE" or value is True or value == 1 or value == "true":
                    enabled_features.append(feature_name)
        elif isinstance(features_raw, list):
            enabled_features = features_raw
        
        social_raw = item.get("Social Media Links:", item.get("Social Media Links", item.get("social", {}))) or {}
        if not isinstance(social_raw, dict):
            social_raw = {}
        social = {
            "facebook": social_raw.get("Facebook") if social_raw.get("Facebook") else None,
            "instagram": social_raw.get("Instagram") if social_raw.get("Instagram") else None,
            "linkedin": social_raw.get("LinkedIn") if social_raw.get("LinkedIn") else None,
            "whatsapp": social_raw.get("Whatsapp") if social_raw.get("Whatsapp") else None,
            "telegram": social_raw.get("Telegram") if social_raw.get("Telegram") else None,
        }
        
        app_links_raw = item.get("App Links:", item.get("App Links", item.get("app_links", {}))) or {}
        if not isinstance(app_links_raw, dict):
            app_links_raw = {}
        app_links = {
            "android": app_links_raw.get("Andriod App") or app_links_raw.get("android") or None,
            "ios": app_links_raw.get("iPhone App") or app_links_raw.get("ios") or None,
            "website": app_links_raw.get("Website") or app_links_raw.get("website") or None,
        }
        
        cities = item.get("Cities", item.get("cities", [])) or []
        if isinstance(cities, str):
            cities = [c.strip() for c in cities.split(",") if c.strip()]
        
        simplified.append({
            "name": app_name,
            "features": enabled_features,
            "social": social,
            "app_links": app_links,
            "cities": cities if cities else [],
        })
    
    return simplified


def get_competitors_for_analysis(industry=None):
    url = get_competitor_file_url(industry)
    raw_data = fetch_competitor_data(url)
    return simplify_competitor_data(raw_data)


def format_competitors_for_prompt(competitors):
    if not competitors:
        return "No competitor data available for this industry."
    
    lines = []
    for i, comp in enumerate(competitors, 1):
        lines.append(f"\n--- Competitor {i}: {comp['name']} ---")
        
        if comp.get('features'):
            features_str = ", ".join(comp['features'][:15])
            if len(comp['features']) > 15:
                features_str += f" (+{len(comp['features']) - 15} more)"
            lines.append(f"Features: {features_str}")
        
        if comp.get('cities'):
            lines.append(f"Operating Cities: {', '.join(comp['cities'])}")
        
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
