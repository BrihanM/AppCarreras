export type ChallengeState = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  career_type?: string | null;
  challenger_vehicle_id: string;
  challenged_vehicle_id: string;
  state: ChallengeState;
  winner_id?: string | null;
  agreed_location?: string | null;
  agreed_date?: string | null; // ISO date string
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}
