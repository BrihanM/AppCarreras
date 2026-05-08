import { Challenge } from '../entities/Challenge';

export default interface IChallengeRepository {
  create(c: Partial<Challenge>): Promise<Challenge>;
  findById(id: string): Promise<Challenge | null>;
  update(id: string, attrs: Partial<Challenge>): Promise<Challenge>;
  listByUser(userId: string): Promise<Challenge[]>;
  delete(id: string): Promise<void>;
  existsActiveBetween(userA: string, userB: string): Promise<boolean>;
}
