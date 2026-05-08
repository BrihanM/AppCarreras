import ICategoryRepository from '../ports/ICategoryRepository';
import { CompetitionCategory } from '../entities/CompetitionCategory';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

class CategoryService {
  private repo: ICategoryRepository;

  constructor(repo: ICategoryRepository) {
    this.repo = repo;
  }

  async createCategory(attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const id = attrs.id || uuidv4();
    const toCreate: Partial<CompetitionCategory> = { ...attrs, id, is_active: attrs.is_active ?? true };
    const created = await this.repo.create(toCreate);
    try { const io = getIo(); if (io) io.emit('category:created', created); } catch (e) {}
    return created;
  }

  async listCategories(): Promise<CompetitionCategory[]> {
    return this.repo.findAll();
  }

  async getCategory(id: string): Promise<CompetitionCategory | null> {
    return this.repo.findById(id);
  }

  async updateCategory(id: string, attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const updated = await this.repo.update(id, attrs);
    try { const io = getIo(); if (io) io.emit('category:updated', updated); } catch (e) {}
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const cat = await this.repo.findById(id);
    await this.repo.delete(id);
    try { const io = getIo(); if (io && cat) io.emit('category:deleted', cat); } catch (e) {}
    return;
  }
}

export default CategoryService;
