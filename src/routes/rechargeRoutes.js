const express = require('express');
const router = express.Router();
const { updateQuantityBySubscriptionId, getSubscriptionById, addProductToNextOrder, testCustomerAccess } = require('../controllers/rechargeController');

// GET /api/recharge/:subscriptionId
router.get('/:subscriptionId', getSubscriptionById);

// PUT /api/recharge/:subscriptionId/quantity
router.put('/:subscriptionId/quantity', updateQuantityBySubscriptionId);

// POST /api/recharge/order/:order_id/next-order
router.post('/charge/:charge_id/next-order', addProductToNextOrder);

// GET /api/recharge/test-customer/:customer_id (for debugging)
router.get('/test-customer/:customer_id', testCustomerAccess);

module.exports = router;