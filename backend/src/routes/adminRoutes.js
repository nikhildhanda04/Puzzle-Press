import { Router } from 'express'
import { getAnalytics } from '../controllers/adminAnalyticsController.js'
import {
  createIssue,
  generateIssueSection,
  listAdminIssues,
  publishIssue,
  updateIssue,
  updatePuzzle,
} from '../controllers/adminIssueController.js'
import { createMedia, listMedia } from '../controllers/adminMediaController.js'
import { listPrompts, updatePrompt } from '../controllers/adminPromptController.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const adminRoutes = Router()

adminRoutes.use(requireAdmin)

adminRoutes.get('/issues', asyncHandler(listAdminIssues))
adminRoutes.post('/issues', asyncHandler(createIssue))
adminRoutes.patch('/issues/:id', asyncHandler(updateIssue))
adminRoutes.patch('/issues/:issueId/puzzles/:puzzleId', asyncHandler(updatePuzzle))
adminRoutes.post('/issues/:id/generate/:section', asyncHandler(generateIssueSection))
adminRoutes.post('/issues/:id/publish', asyncHandler(publishIssue))

adminRoutes.get('/prompts', asyncHandler(listPrompts))
adminRoutes.patch('/prompts/:id', asyncHandler(updatePrompt))

adminRoutes.get('/media', asyncHandler(listMedia))
adminRoutes.post('/media', asyncHandler(createMedia))

adminRoutes.get('/analytics', asyncHandler(getAnalytics))
