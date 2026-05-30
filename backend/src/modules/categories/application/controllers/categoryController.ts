import { Request, Response } from 'express';
import CategoryRepositoryPg from '../../infrastructure/adapters/pg/CategoryRepositoryPg';
import CategoryService from '../../domain/services/CategoryService';
import { createCategorySchema, updateCategorySchema } from '../validators/categorySchemas';

const repo = new CategoryRepositoryPg();
const service = new CategoryService(repo);

/**
 * list
 * Lista todas las categorías.
 */
const list = async (_req: Request, res: Response) => {
  try {
    const onlyActive = String(_req.query.active || '').toLowerCase() === 'true';
    const allItems = await service.listCategories();
    const items = onlyActive ? allItems.filter((it: any) => Boolean(it.is_active)) : allItems;
    // Return paginated-style envelope to match frontend expectations
    const pagination = { page: 1, limit: items.length, total: items.length, totalPages: 1 };
    res.json({ success: true, message: 'Categories listed', data: items, pagination });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * create
 * Crea una nueva categoría validando con `createCategorySchema`.
 */
const create = async (req: Request, res: Response) => {
  try {
    const parsed = createCategorySchema.parse(req.body);
    const created = await service.createCategory(parsed as any);
    res.status(201).json({ success: true, message: 'Category created', data: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * update
 * Actualiza una categoría por id.
 */
const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateCategorySchema.parse(req.body);
    const updated = await service.updateCategory(id, parsed as any);
    res.json({ success: true, message: 'Category updated', data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * remove
 * Elimina una categoría por id.
 */
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
