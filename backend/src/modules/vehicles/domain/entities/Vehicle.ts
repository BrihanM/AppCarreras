export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  plate: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
