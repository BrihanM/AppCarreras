import ICategoryRepository from '../ports/ICategoryRepository';
import { CompetitionCategory } from '../entities/CompetitionCategory';
import { v4 as uuidv4 } from 'uuid';

class CategoryService {
  private repo: ICategoryRepository;

  constructor(repo: ICategoryRepository) {
    this.repo = repo;
  }

  async createCategory(attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const id = attrs.id || uuidv4();
    const toCreate: Partial<CompetitionCategory> = { ...attrs, id, is_active: attrs.is_active ?? true };
    return this.repo.create(toCreate);
  }

  async listCategories(): Promise<CompetitionCategory[]> {
    return this.repo.findAll();
  }

  async getCategory(id: string): Promise<CompetitionCategory | null> {
    return this.repo.findById(id);
  }

  async updateCategory(id: string, attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    return this.repo.update(id, attrs);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}

export default CategoryService;
