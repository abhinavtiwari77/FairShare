import { Router } from 'express'
import healthRoutes from './health.js'
import authRoutes from './auth.routes.js'
import groupsRoutes from './groups.routes.js'
import usersRoutes from './users.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/groups', groupsRoutes)
router.use('/users', usersRoutes)

export default router
