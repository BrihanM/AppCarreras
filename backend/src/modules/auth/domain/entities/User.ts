export interface User {
  id: string;
  name: string;
  local_zone?: string | null;
  city_area?: string | null;
  state_zone?: string | null;
  country_zone?: string | null;
  rank?: string | null;
  category_id?: string | null;
  victories?: number;
  defeats?: number;
  consecutive_challenges?: number;
  state?: string | null;
  account_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
