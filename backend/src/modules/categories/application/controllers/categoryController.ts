import { Request, Response } from 'express';
import CategoryRepositoryPg from '../../infrastructure/adapters/pg/CategoryRepositoryPg';
import CategoryService from '../../domain/services/CategoryService';
import { createCategorySchema, updateCategorySchema } from '../validators/categorySchemas';

const repo = new CategoryRepositoryPg();
const service = new CategoryService(repo);

const list = async (_req: Request, res: Response) => {
  try {
    const items = await service.listCategories();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const create = async (req: Request, res: Response) => {
  try {
    const parsed = createCategorySchema.parse(req.body);
    const created = await service.createCategory(parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateCategorySchema.parse(req.body);
    const updated = await service.updateCategory(id, parsed as any);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteCategory(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { list, create, update, remove };
