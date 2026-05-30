export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  brand_catalog_id?: string | null;
  model_catalog_id?: string | null;
  plate: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
