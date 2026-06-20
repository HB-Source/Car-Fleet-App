import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireVerifiedEmail } from '../middleware/requireVerifiedEmail.js';
import { requireMfaVerified } from '../middleware/requireMfaVerified.js';
import { validateBody } from '../middleware/validate.js';
import {
  createVehicleSchema,
  createEventSchema,
  listVehiclesQuerySchema,
  onboardSchema,
  updateVehicleSchema,
} from '../schemas/vehicle.schema.js';
import * as vehiclesService from '../services/vehicles.service.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeEvent, serializeHistory, serializeVehicle } from '../utils/serialize.js';

export const vehiclesRouter = Router();

// Every fleet route requires a verified, MFA-satisfied session.
vehiclesRouter.use(authenticate, requireVerifiedEmail, requireMfaVerified);

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
  requireRole('admin', 'manager'),
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

// --- Vehicle events (manual passport history) ---
vehiclesRouter.get('/:id/events', async (req, res) => {
  const events = await vehiclesService.listVehicleEvents(String(req.params.id));
  res.json({ data: events.map(serializeEvent) });
});

vehiclesRouter.post('/:id/events', validateBody(createEventSchema), async (req, res) => {
  const event = await vehiclesService.addVehicleEvent(String(req.params.id), req.body, req.user!);
  res.status(201).json({ event: serializeEvent(event) });
});

vehiclesRouter.delete('/:id/events/:eventId', async (req, res) => {
  await vehiclesService.deleteVehicleEvent(
    String(req.params.id),
    String(req.params.eventId),
    req.user!,
  );
  res.status(204).end();
});

// --- Per-vehicle QR code ---
vehiclesRouter.get('/:id/qr', async (req, res) => {
  const qr = await vehiclesService.getVehicleQr(String(req.params.id));
  res.json(qr);
});
