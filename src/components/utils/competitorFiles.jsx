
import { INDUSTRIES } from "@/components/constants/industries";

// Public files (already uploaded in your storage)
export const DEFAULT_COMPETITOR_FILE_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ada7a5a5c2551f351100ff/a53e045a5c2551f351100ff/a53e045a7_Competitor.txt";

export const DELIVERY_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Delivery.txt";

export const Ecommerce_Beauty_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceBeauty.txt";

export const Ecommerce_Clothes_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceClothes.txt";

export const Ecommerce_Electronics_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceElectronics.txt";

export const Ecommerce_Food_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceFood.txt";

export const Ecommerce_Medicine_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceMedicine.txt";

export const Ecommerce_Stuff_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceStuff.txt";

export const Ecommerce_Supermarket_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/EcommerceSupermarket.txt";

export const Health_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Health.txt";

export const Job_Oppurtunity_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/JobOppurtunity.txt";

export const Sell_Rent_Cars_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/SellRent%20Cars.txt";

export const Sell_Rent_Realestate_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/SellRentRealestate.txt";

export const Taxi_COMPETITOR_FILE_URL =
  "https://lwlovtaqjmglpdnzqxty.supabase.co/storage/v1/object/public/Planlyze/Taxi.txt";


// Map industries to their specific files (extensible)
const INDUSTRY_FILE_MAP = {
  Delivery: DELIVERY_COMPETITOR_FILE_URL,
  BeautyEcommerce: Ecommerce_Beauty_COMPETITOR_FILE_URL,
  ClothesEcommerce: Ecommerce_Clothes_COMPETITOR_FILE_URL,
  ElectronicsEcommerce: Ecommerce_Electronics_COMPETITOR_FILE_URL,
  FoodEcommerce: Ecommerce_Food_COMPETITOR_FILE_URL,
  MedicineEcommerce: Ecommerce_Medicine_COMPETITOR_FILE_URL,
  StuffEcommerce: Ecommerce_Stuff_COMPETITOR_FILE_URL,
  SupermarketEcommerce: Ecommerce_Supermarket_COMPETITOR_FILE_URL,
  GeneralHealth: Health_COMPETITOR_FILE_URL,
  JobOppurtunity: Job_Oppurtunity_COMPETITOR_FILE_URL,
  SellRentCars: Sell_Rent_Cars_COMPETITOR_FILE_URL,
  ServicesTaxi:Taxi_COMPETITOR_FILE_URL,
  SellRentRealestate: Sell_Rent_Realestate_COMPETITOR_FILE_URL
  
};

/**
 * Returns the appropriate competitor file URL for a given industry.
 * - Validates the industry against the INDUSTRIES static list.
 * - Uses a specific file when available (e.g., Delivery), otherwise falls back to a default dataset.
 */
export function getCompetitorFileUrl(industry) {
  const input = String(industry || "").toLowerCase();
  const valid = new Set(INDUSTRIES.map(i => String(i.value).toLowerCase()));

  if (!valid.has(input)) return DEFAULT_COMPETITOR_FILE_URL;

  // Normalize mapping keys to lowercase so values like "ClothesEcommerce" work when lowercased
  const normalizedMap = Object.entries(INDUSTRY_FILE_MAP).reduce((acc, [k, v]) => {
    acc[k.toLowerCase()] = v;
    return acc;
  }, {});

  return normalizedMap[input] || DEFAULT_COMPETITOR_FILE_URL;
}
