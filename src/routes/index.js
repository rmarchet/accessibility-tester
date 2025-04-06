import { Router } from 'express'
import AccessibilityController from '../controllers/accessibilityController'
import AccessibilityService from '../services/accessibilityService'

const router = Router()
const accessibilityService = new AccessibilityService()
const accessibilityController = new AccessibilityController(accessibilityService)

router.post(
  '/test', 
  (req, res) => accessibilityController.testAccessibility(req, res)
)

export default router
