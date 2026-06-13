import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validateBody } from '../middleware/validate.js';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  onboardSchema,
  updateVehicleSchema,
} from '../schemas/vehicle.schema.js';
import * as vehiclesService from '../services/vehicles.service.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeHistory, serializeVehicle } from '../utils/serialize.js';

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticate);

vehiclesRouter.get('/', async (req, res) => {
  const params = listVehiclesQuerySchema.parse(req.query);
  const { vehicles, total } = await vehiclesService.listVehicles(params);
  res.json({
    data: vehicles.map(serializeVehicle),
    meta: { page: params.page, limit: params.limit, total },
  });
});

vehiclesRouter.post(
  '/',
  requireRole('admin'),
  validateBody(createVehicleSchema),
  async (req, res) => {
    const vehicle = await vehiclesService.createVehicle(req.body);
    res.status(201).json({ vehicle: serializeVehicle(vehicle) });
  },
);

vehiclesRouter.post('/onboard', validateBody(onboardSchema), async (req, res) => {
  const vehicle = await vehiclesService.onboardByQrCode(req.body.qr_code_id);
  if (!vehicle) {
    throw ApiError.notFound('No vehicle matches this QR code', 'unknown_qr_code');
  }
  res.json({ vehicle: serializeVehicle(vehicle) });
});

vehiclesRouter.get('/:id', async (req, res) => {
  const vehicle = await vehiclesService.getVehicle(String(req.params.id));
  res.json({ vehicle: serializeVehicle(vehicle) });
});

vehiclesRouter.patch('/:id', validateBody(updateVehicleSchema), async (req, res) => {
  const vehicle = await vehiclesService.updateVehicle(String(req.params.id), req.body, req.user!);
  res.json({ vehicle: serializeVehicle(vehicle) });
});

vehiclesRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  await vehiclesService.deleteVehicle(String(req.params.id));
  res.status(204).end();
});

vehiclesRouter.get('/:id/history', async (req, res) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '50'), 10) || 50));
  const { entries, total } = await vehiclesService.getVehicleHistory(String(req.params.id), page, limit);
  res.json({ data: entries.map(serializeHistory), meta: { page, limit, total } });
});
