import { Router } from 'express'
import {
  confirmUnsubscribe,
  createSubscriber,
  getLatestIssue,
  getPublishedIssue,
  listPublishedIssues,
  showUnsubscribe,
} from '../controllers/publicController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'

export const publicRoutes = Router()

publicRoutes.get('/issues/latest', asyncHandler(getLatestIssue))
publicRoutes.get('/issues', asyncHandler(listPublishedIssues))
publicRoutes.get('/issues/:slug', asyncHandler(getPublishedIssue))
publicRoutes.post('/subscribers', asyncHandler(createSubscriber))
publicRoutes.get('/unsubscribe', asyncHandler(showUnsubscribe))
publicRoutes.post('/unsubscribe', asyncHandler(confirmUnsubscribe))
