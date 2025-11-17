"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const subscriptionService_1 = require("../services/subscriptionService");
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
});
router.post('/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !endpointSecret) {
        res.status(400).json({
            success: false,
            error: 'Missing Stripe signature or webhook secret'
        });
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).json({
            success: false,
            error: 'Invalid signature'
        });
        return;
    }
    try {
        await subscriptionService_1.subscriptionService.handleWebhookEvent(event);
        switch (event.type) {
            case 'customer.subscription.created':
                console.log('✅ Subscription created:', event.data.object.id);
                break;
            case 'customer.subscription.updated':
                console.log('✅ Subscription updated:', event.data.object.id);
                break;
            case 'customer.subscription.deleted':
                console.log('✅ Subscription cancelled:', event.data.object.id);
                break;
            case 'invoice.payment_succeeded':
                console.log('✅ Payment succeeded:', event.data.object.id);
                break;
            case 'invoice.payment_failed':
                console.log('❌ Payment failed:', event.data.object.id);
                break;
            default:
                console.log(`Received event: ${event.type}`);
        }
        res.status(200).json({
            success: true,
            received: true
        });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
});
router.post('/test', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        res.status(403).json({
            success: false,
            error: 'Test endpoint only available in development'
        });
        return;
    }
    try {
        const { event_type, data } = req.body;
        const mockEvent = {
            type: event_type,
            data: { object: data },
            id: `evt_${Date.now()}`,
            object: 'event',
            api_version: '2023-10-16',
            created: Math.floor(Date.now() / 1000),
            livemode: false,
            pending_webhooks: 0,
            request: {
                id: `req_${Date.now()}`,
                idempotency_key: null
            }
        };
        await subscriptionService_1.subscriptionService.handleWebhookEvent(mockEvent);
        res.status(200).json({
            success: true,
            message: 'Test webhook processed successfully'
        });
    }
    catch (error) {
        console.error('Error processing test webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Test webhook processing failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map