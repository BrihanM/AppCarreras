export type ChallengeState = 'pending' | 'accepted' | 'rejected' | 'completed';

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id?: string | null;
  competition_category_id?: string | null;
  career_type?: string | null;
  challenger_vehicle_id: string;
  challenged_vehicle_id?: string | null;
  state: ChallengeState;
  winner_id?: string | null;
  agreed_location?: string | null;
  agreed_date?: string | null; // ISO date string
  notes?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChallengeRoute {
  challenge_id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  route_geometry?: unknown;
  provider?: string | null;
}
