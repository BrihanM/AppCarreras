export interface Account {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  photo?: string | null;
  last_connection?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
