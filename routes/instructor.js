import express from 'express';
import { deleteWithdrawalRequest, getPayoutHistory, getPayoutSummary, requestWithdrawal } from '../controller/instructor.js';
import { isAuth } from '../middlewares/isAuth.js';

const router = express.Router();

router.get('/summary', isAuth, getPayoutSummary);
router.post('/request', isAuth, requestWithdrawal);
router.get('/history', isAuth, getPayoutHistory);
router.delete('/request/:id', isAuth, deleteWithdrawalRequest);

export default router;
