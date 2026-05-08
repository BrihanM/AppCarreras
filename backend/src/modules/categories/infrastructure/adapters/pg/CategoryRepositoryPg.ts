import ICategoryRepository from '../../../domain/ports/ICategoryRepository';
import { CompetitionCategory } from '../../../domain/entities/CompetitionCategory';
import { pool } from '../../db';

class CategoryRepositoryPg implements ICategoryRepository {
  async create(c: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const q = `INSERT INTO competition_categories (id,name,description,is_active) VALUES ($1,$2,$3,$4) RETURNING *`;
    const values = [c.id, c.name, c.description || null, c.is_active ?? true];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async findById(id: string): Promise<CompetitionCategory | null> {
    const { rows } = await pool.query('SELECT * FROM competition_categories WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findAll(): Promise<CompetitionCategory[]> {
    const { rows } = await pool.query('SELECT * FROM competition_categories ORDER BY name ASC');
    return rows;
  }

  async update(id: string, attrs: Partial<CompetitionCategory>): Promise<CompetitionCategory> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Category not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `UPDATE competition_categories SET name=$1,description=$2,is_active=$3,updated_at=NOW() WHERE id=$4 RETURNING *`;
    const values = [updated.name, updated.description || null, updated.is_active ?? true, id];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM competition_categories WHERE id = $1', [id]);
  }
}

export default CategoryRepositoryPg;
