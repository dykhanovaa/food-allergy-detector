// frontend/src/types/index.ts
export type Scan = {
  id: number;
  image_url: string | null;
  product_name: string;
  ingredients: string[];
  detected_allergens: string[];
  is_safe: boolean;
  created_at: string; // ISO-строка
};

export type PaginatedScans = {
  items: Scan[];
  total: number;
  page: number;
  size: number;
  pages: number;
};