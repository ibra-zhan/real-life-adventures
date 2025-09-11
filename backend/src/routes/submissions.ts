// Quest Submission Routes with Media Integration
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultLimiter, uploadLimiter } from '../middleware/rateLimiter';
import { submitQuestWithMedia, getSubmissionById, updateSubmission, deleteSubmission } from '../controllers/submissionController';

const router = Router();

// All submission routes require authentication
router.use(authenticate);

// Submit quest with media files
router.post('/', uploadLimiter, submitQuestWithMedia);

// Get submission by ID
router.get('/:id', defaultLimiter, getSubmissionById);

// Update submission
router.put('/:id', defaultLimiter, updateSubmission);

// Delete submission
router.delete('/:id', defaultLimiter, deleteSubmission);

export default router;
