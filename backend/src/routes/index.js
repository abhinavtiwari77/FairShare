import { Router } from 'express'
import healthRoutes from './health.js'
import authRoutes from './auth.routes.js'
import groupsRoutes from './groups.routes.js'
import usersRoutes from './users.routes.js'
import expensesRoutes, { globalExpenseRoutes } from './expenses.routes.js'
import balanceRoutes from './balances.routes.js'
import userBalanceRoutes from './userBalances.routes.js'
import settlementRoutes from './settlements.routes.js'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/groups', groupsRoutes)
router.use('/users', usersRoutes)
router.use('/groups/:groupId/expenses', expensesRoutes)
router.use('/groups/:groupId/balances', balanceRoutes)
router.use('/groups/:groupId/settlements', settlementRoutes)
router.use('/users/me/balances', userBalanceRoutes)
router.use('/expenses', globalExpenseRoutes)

export default router
