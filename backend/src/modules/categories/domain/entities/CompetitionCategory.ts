export interface CompetitionCategory {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
