import { CompetitionCategory } from '../entities/CompetitionCategory';

export default interface ICategoryRepository {
  create(c: Partial<CompetitionCategory>): Promise<CompetitionCategory>;
  findById(id: string): Promise<CompetitionCategory | null>;
  findAll(): Promise<CompetitionCategory[]>;
  update(id: string, attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory>;
  delete(id: string): Promise<void>;
}
