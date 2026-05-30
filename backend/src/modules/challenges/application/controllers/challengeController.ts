import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ChallengeRepositoryPg from '../../infrastructure/adapters/pg/ChallengeRepositoryPg';
import ChallengeService from '../../domain/services/ChallengeService';
import { createChallengeSchema, completeChallengeSchema, acceptChallengeSchema } from '../validators/challengeSchemas';
import { pool } from '../../infrastructure/db';

const repo = new ChallengeRepositoryPg();
const service = new ChallengeService(repo);

const ensureAdmin = (req: Request): boolean => {
  const auth = (req as any).user;
  if (auth && auth.role) return auth.role === 'admin';
  return auth && auth.username === 'admin';
};

const resolveRequesterUserId = async (req: Request): Promise<string | null> => {
  const authId = (req as any).user?.id ? String((req as any).user.id) : '';
  if (!authId) return null;
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 OR account_id = $1 LIMIT 1', [authId]);
  return rows[0]?.id || null;
};

/**
 * create
 * Crea un `Challenge` validando con `createChallengeSchema`.
 */
const create = async (req: Request, res: Response) => {
  try {
    // DEBUG: log incoming body to investigate Zod validation failures
    // Remove this log after troubleshooting
    // eslint-disable-next-line no-console
    console.log('[challenges.create] body:', JSON.stringify(req.body));
    const parsed = createChallengeSchema.parse(req.body);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = {
      ...parsed,
      challenger_id: requesterUserId,
    };
    const created = await service.createChallenge(payload as any);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof ZodError) {
      // Zod exposes `issues` with detailed validation errors
      return res.status(400).json({ error: err.issues });
    }
    res.status(400).json({ error: err.message });
  }
};

/**
 * list
 * Endpoint para listar challenges con paginación simples: `?limit=&page=`
 */
const list = async (req: Request, res: Response) => {
  try {
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const includeOpen = req.query.include_open !== 'false';
    // Join users to include challenger/challenged names and normalize keys to camelCase
    const q = `
          SELECT c.*, u1.name AS challenger_name, u2.name AS challenged_name,
            cc.name AS competition_category_name,
             v1.plate AS challenger_plate, v2.plate AS challenged_plate
            , cr.origin_lat, cr.origin_lng, cr.destination_lat, cr.destination_lng,
            cr.route_geometry, cr.provider AS route_provider
      FROM challenges c
      LEFT JOIN users u1 ON u1.id = c.challenger_id
      LEFT JOIN users u2 ON u2.id = c.challenged_id
          LEFT JOIN competition_categories cc ON cc.id = c.competition_category_id
      LEFT JOIN vehicles v1 ON v1.id = c.challenger_vehicle_id
      LEFT JOIN vehicles v2 ON v2.id = c.challenged_vehicle_id
          LEFT JOIN challenge_routes cr ON cr.challenge_id = c.id
      WHERE (
        c.challenger_id = $1
        OR c.challenged_id = $1
        OR (${includeOpen ? "(c.challenged_id IS NULL AND c.state = 'pending')" : 'FALSE'})
      )
      ORDER BY c.created_at DESC LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(q, [requesterUserId, limit, offset]);

    // Normalize snake_case DB rows to frontend-friendly camelCase and map `state` -> `status`
    const data = rows.map((r: any) => ({
      id: r.id,
      challengerId: r.challenger_id,
      challengedId: r.challenged_id,
      competitionCategoryId: r.competition_category_id,
      competitionCategoryName: r.competition_category_name,
      challengerVehicleId: r.challenger_vehicle_id,
      challengedVehicleId: r.challenged_vehicle_id,
      careerType: r.career_type,
      status: r.state,
      winnerId: r.winner_id,
      agreedLocation: r.agreed_location,
      agreedDate: r.agreed_date,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      challengerName: r.challenger_name,
      challengedName: r.challenged_name,
      challengerPlate: r.challenger_plate,
      challengedPlate: r.challenged_plate,
      isOpen: !r.challenged_id,
      route: r.origin_lat != null && r.origin_lng != null && r.destination_lat != null && r.destination_lng != null
        ? {
            origin_lat: Number(r.origin_lat),
            origin_lng: Number(r.origin_lng),
            destination_lat: Number(r.destination_lat),
            destination_lng: Number(r.destination_lng),
            route_geometry: r.route_geometry,
            provider: r.route_provider,
          }
        : undefined,
    }));

    res.json({ success: true, message: 'Challenges listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * listTrackOptions
 * Devuelve pistas/rutas predefinidas basadas en rutas ya guardadas en DB.
 */
const listTrackOptions = async (_req: Request, res: Response) => {
  try {
    const catalogQuery = `
      SELECT
        rt.id,
        rt.name,
        rt.city,
        rt.country,
        rt.agreed_location,
        rt.competition_category_id,
        cc.name AS competition_category_name,
        rt.origin_lat,
        rt.origin_lng,
        rt.destination_lat,
        rt.destination_lng,
        rt.route_geometry,
        rt.provider
      FROM race_tracks rt
      LEFT JOIN competition_categories cc ON cc.id = rt.competition_category_id
      WHERE rt.is_active = TRUE
      ORDER BY rt.city ASC, rt.name ASC
      LIMIT 300
    `;

    const catalogRows = await pool.query(catalogQuery).catch(() => ({ rows: [] as any[] }));

    if (catalogRows.rows.length > 0) {
      const catalogData = catalogRows.rows.map((r: any) => ({
        id: String(r.id),
        locationName: `${r.name} (${r.city}, ${r.country})`,
        competitionCategoryId: r.competition_category_id,
        competitionCategoryName: r.competition_category_name,
        route: {
          origin_lat: Number(r.origin_lat),
          origin_lng: Number(r.origin_lng),
          destination_lat: Number(r.destination_lat),
          destination_lng: Number(r.destination_lng),
          route_geometry: r.route_geometry,
          provider: r.provider,
        },
      }));

      return res.json({ success: true, message: 'Track options listed', data: catalogData });
    }

    const q = `
      SELECT DISTINCT ON (
        LOWER(COALESCE(c.agreed_location, '')),
        cr.origin_lat,
        cr.origin_lng,
        cr.destination_lat,
        cr.destination_lng
      )
        c.id AS source_challenge_id,
        COALESCE(NULLIF(TRIM(c.agreed_location), ''), CONCAT('Pista ', SUBSTRING(c.id::text, 1, 8))) AS location_name,
        c.competition_category_id,
        cc.name AS competition_category_name,
        cr.origin_lat,
        cr.origin_lng,
        cr.destination_lat,
        cr.destination_lng,
        cr.route_geometry,
        cr.provider
      FROM challenges c
      INNER JOIN challenge_routes cr ON cr.challenge_id = c.id
      LEFT JOIN competition_categories cc ON cc.id = c.competition_category_id
      WHERE cr.origin_lat IS NOT NULL
        AND cr.origin_lng IS NOT NULL
        AND cr.destination_lat IS NOT NULL
        AND cr.destination_lng IS NOT NULL
      ORDER BY
        LOWER(COALESCE(c.agreed_location, '')),
        cr.origin_lat,
        cr.origin_lng,
        cr.destination_lat,
        cr.destination_lng,
        c.created_at DESC
      LIMIT 200
    `;

    const { rows } = await pool.query(q);

    const data = rows.map((r: any) => ({
      id: String(r.source_challenge_id),
      locationName: r.location_name,
      competitionCategoryId: r.competition_category_id,
      competitionCategoryName: r.competition_category_name,
      route: {
        origin_lat: Number(r.origin_lat),
        origin_lng: Number(r.origin_lng),
        destination_lat: Number(r.destination_lat),
        destination_lng: Number(r.destination_lng),
        route_geometry: r.route_geometry,
        provider: r.provider,
      },
    }));

    res.json({ success: true, message: 'Track options listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * accept
 * Acepta un `Challenge` por id.
 */
const accept = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = acceptChallengeSchema.parse(req.body || {});
    const updated = await service.acceptChallenge(id, requesterUserId, parsed.challenged_vehicle_id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * rejectChallenge
 * Rechaza un `Challenge` por id.
 */
const rejectChallenge = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await service.rejectChallenge(id, requesterUserId);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * complete
 * Completa un `Challenge` indicando el `winner_id`.
 */
const complete = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    // Accept both snake_case `winner_id` and camelCase `winnerId` from clients
    const body = {
      winner_id: (req.body && (req.body.winner_id || req.body.winnerId)) || undefined,
      notes: req.body && req.body.notes,
    };
    // DEBUG: log incoming complete requests
    // eslint-disable-next-line no-console
    console.log('[challenges.complete] id:', id, 'body:', JSON.stringify(body));
    const parsed = completeChallengeSchema.parse(body);
    const updated = await service.completeChallenge(id, parsed.winner_id);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    // eslint-disable-next-line no-console
    console.error('[challenges.complete] error:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminList
 * Lista retos para administración con filtros.
 */
const adminList = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;

    const state = req.query.status ? String(req.query.status) : null;
    const userId = req.query.user_id ? String(req.query.user_id) : null;
    const search = req.query.search ? String(req.query.search) : null;

    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (state) {
      if (state === 'active') {
        whereParts.push(`c.state IN ('pending','accepted')`);
      } else {
        whereParts.push(`c.state = $${idx++}`);
        values.push(state);
      }
    }
    if (userId) {
      whereParts.push(`(c.challenger_id = $${idx} OR c.challenged_id = $${idx})`);
      values.push(userId);
      idx += 1;
    }
    if (search) {
      whereParts.push(`(u1.name ILIKE $${idx} OR u2.name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx += 1;
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const q = `
      SELECT
        c.*, u1.name AS challenger_name, u2.name AS challenged_name,
        cc.name AS competition_category_name,
        v1.plate AS challenger_plate, v2.plate AS challenged_plate
        , cr.origin_lat, cr.origin_lng, cr.destination_lat, cr.destination_lng,
        cr.route_geometry, cr.provider AS route_provider
      FROM challenges c
      LEFT JOIN users u1 ON u1.id = c.challenger_id
      LEFT JOIN users u2 ON u2.id = c.challenged_id
      LEFT JOIN competition_categories cc ON cc.id = c.competition_category_id
      LEFT JOIN vehicles v1 ON v1.id = c.challenger_vehicle_id
      LEFT JOIN vehicles v2 ON v2.id = c.challenged_vehicle_id
      LEFT JOIN challenge_routes cr ON cr.challenge_id = c.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const { rows } = await pool.query(q, values);
    const data = rows.map((r: any) => ({
      id: r.id,
      challengerId: r.challenger_id,
      challengedId: r.challenged_id,
      competitionCategoryId: r.competition_category_id,
      competitionCategoryName: r.competition_category_name,
      challengerVehicleId: r.challenger_vehicle_id,
      challengedVehicleId: r.challenged_vehicle_id,
      status: r.state,
      winnerId: r.winner_id,
      agreedLocation: r.agreed_location,
      agreedDate: r.agreed_date,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      challengerName: r.challenger_name,
      challengedName: r.challenged_name,
      challengerPlate: r.challenger_plate,
      challengedPlate: r.challenged_plate,
      route: r.origin_lat != null && r.origin_lng != null && r.destination_lat != null && r.destination_lng != null
        ? {
            origin_lat: Number(r.origin_lat),
            origin_lng: Number(r.origin_lng),
            destination_lat: Number(r.destination_lat),
            destination_lng: Number(r.destination_lng),
            route_geometry: r.route_geometry,
            provider: r.route_provider,
          }
        : undefined,
    }));

    res.json({ success: true, message: 'Admin challenges listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminUpdate
 * Actualiza estado/datos de un reto desde panel admin.
 */
const adminUpdate = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const allowedStates = ['pending', 'accepted', 'rejected', 'completed'];
    const payload: any = {};
    if (typeof req.body.status !== 'undefined') payload.state = req.body.status;
    if (typeof req.body.state !== 'undefined') payload.state = req.body.state;
    if (typeof req.body.winnerId !== 'undefined') payload.winner_id = req.body.winnerId;
    if (typeof req.body.winner_id !== 'undefined') payload.winner_id = req.body.winner_id;
    if (typeof req.body.notes !== 'undefined') payload.notes = req.body.notes;
    if (typeof req.body.agreedLocation !== 'undefined') payload.agreed_location = req.body.agreedLocation;
    if (typeof req.body.agreed_location !== 'undefined') payload.agreed_location = req.body.agreed_location;
    if (typeof req.body.agreedDate !== 'undefined') payload.agreed_date = req.body.agreedDate;
    if (typeof req.body.agreed_date !== 'undefined') payload.agreed_date = req.body.agreed_date;

    if (payload.state && !allowedStates.includes(String(payload.state))) {
      return res.status(400).json({ error: 'Invalid challenge status' });
    }

    const updated = await repo.update(id, payload);
    res.json({ success: true, message: 'Challenge updated', data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminDelete
 * Elimina un reto desde panel admin.
 */
const adminDelete = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    await repo.delete(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  create,
  list,
  listTrackOptions,
  accept,
  reject: rejectChallenge,
  complete,
  adminList,
  adminUpdate,
  adminDelete,
};
