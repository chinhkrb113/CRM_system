import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { leadRoutes } from './lead.routes';
import { interactionRoutes } from './interaction.routes';
import { appointmentRoutes } from './appointment.routes';
import { paymentRoutes } from './payment.routes';
import { aiRoutes } from './ai.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM API Core is healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);
router.use('/interactions', interactionRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/ai', aiRoutes);

export { router as apiRoutes };