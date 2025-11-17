"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const subscriptionService_js_1 = require("../services/subscriptionService.js");
const tenant_js_1 = require("../middleware/tenant.js");
const router = (0, express_1.Router)();
router.use(tenant_js_1.extractTenant);
router.use(tenant_js_1.requireAuth);
router.get('/plans', async (req, res) => {
    try {
        const { data: plans, error } = await supabase_js_1.supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch subscription plans'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: plans || []
        });
    }
    catch (error) {
        console.error('Plans fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/current', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: subscription, error } = await supabase_js_1.supabase
            .from('tenant_subscriptions')
            .select(`
        *,
        subscription_plans!inner(name, price, max_users, features)
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error || !subscription) {
            res.status(404).json({
                success: false,
                error: 'No subscription found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: subscription
        });
    }
    catch (error) {
        console.error('Subscription fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/usage', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const usage = await subscriptionService_js_1.subscriptionService.getSubscriptionUsage(tenantId);
        res.status(200).json({
            success: true,
            data: usage
        });
    }
    catch (error) {
        console.error('Usage fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { plan_id, payment_method_id } = req.body || {};
        if (!plan_id) {
            res.status(400).json({
                success: false,
                error: 'Plan ID is required'
            });
            return;
        }
        const { data: existingSubscription } = await supabase_js_1.supabase
            .from('tenant_subscriptions')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .single();
        if (existingSubscription) {
            res.status(409).json({
                success: false,
                error: 'Tenant already has an active subscription'
            });
            return;
        }
        const subscription = await subscriptionService_js_1.subscriptionService.createSubscription(tenantId, plan_id, payment_method_id);
        res.status(201).json({
            success: true,
            data: subscription
        });
    }
    catch (error) {
        console.error('Subscription creation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create subscription'
        });
    }
});
router.put('/plan', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { plan_id } = req.body || {};
        if (!plan_id) {
            res.status(400).json({
                success: false,
                error: 'Plan ID is required'
            });
            return;
        }
        const limitCheck = await subscriptionService_js_1.subscriptionService.checkSubscriptionLimits(tenantId);
        if (limitCheck.exceeded) {
            res.status(400).json({
                success: false,
                error: limitCheck.message
            });
            return;
        }
        const subscription = await subscriptionService_js_1.subscriptionService.updateSubscriptionPlan(tenantId, plan_id);
        res.status(200).json({
            success: true,
            data: subscription
        });
    }
    catch (error) {
        console.error('Subscription update error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update subscription'
        });
    }
});
router.delete('/', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        await subscriptionService_js_1.subscriptionService.cancelSubscription(tenantId);
        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    }
    catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to cancel subscription'
        });
    }
});
router.post('/setup-intent', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: tenant } = await supabase_js_1.supabase
            .from('tenants')
            .select('stripe_customer_id')
            .eq('id', tenantId)
            .single();
        if (!tenant?.stripe_customer_id) {
            res.status(400).json({
                success: false,
                error: 'No Stripe customer found for tenant'
            });
            return;
        }
        const setupIntent = await subscriptionService_js_1.subscriptionService.createSetupIntent(tenant.stripe_customer_id);
        res.status(200).json({
            success: true,
            data: {
                client_secret: setupIntent.client_secret
            }
        });
    }
    catch (error) {
        console.error('Setup intent creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/payment-methods', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: tenant } = await supabase_js_1.supabase
            .from('tenants')
            .select('stripe_customer_id')
            .eq('id', tenantId)
            .single();
        if (!tenant?.stripe_customer_id) {
            res.status(200).json({
                success: true,
                data: []
            });
            return;
        }
        const paymentMethods = await subscriptionService_js_1.subscriptionService.getPaymentMethods(tenant.stripe_customer_id);
        res.status(200).json({
            success: true,
            data: paymentMethods
        });
    }
    catch (error) {
        console.error('Payment methods fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/payment-methods/:id', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const paymentMethodId = req.params.id;
        await subscriptionService_js_1.subscriptionService.deletePaymentMethod(paymentMethodId);
        res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    }
    catch (error) {
        console.error('Payment method deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/billing-history', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: tenant } = await supabase_js_1.supabase
            .from('tenants')
            .select('stripe_customer_id')
            .eq('id', tenantId)
            .single();
        if (!tenant?.stripe_customer_id) {
            res.status(200).json({
                success: true,
                data: []
            });
            return;
        }
        const billingHistory = await subscriptionService_js_1.subscriptionService.getBillingHistory(tenant.stripe_customer_id);
        res.status(200).json({
            success: true,
            data: billingHistory
        });
    }
    catch (error) {
        console.error('Billing history fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map