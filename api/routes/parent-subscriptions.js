"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const stripe_1 = __importDefault(require("stripe"));
const router = (0, express_1.Router)();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
});
function authenticateParent(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.userType !== 'parent') {
            return res.status(403).json({ error: 'Access denied. Parent account required.' });
        }
        req.parent = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
router.get('/plans', async (req, res) => {
    try {
        const { data: plans, error } = await supabase_js_1.supabase
            .from('parent_subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true });
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json({ plans });
        return;
    }
    catch (error) {
        console.error('Get subscription plans error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/current', authenticateParent, async (req, res) => {
    try {
        const { data: subscription, error } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select(`
        *,
        plan:parent_subscription_plans!inner(*)
      `)
            .eq('parent_user_id', req.parent.userId)
            .single();
        if (error) {
            res.status(404).json({ error: 'Subscription not found' });
            return;
        }
        res.json({ subscription });
        return;
    }
    catch (error) {
        console.error('Get current subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/subscribe', authenticateParent, async (req, res) => {
    try {
        const { planId, paymentMethodId, billingCycle } = req.body;
        if (!planId || !billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
            res.status(400).json({ error: 'Plan ID and billing cycle are required' });
            return;
        }
        const { data: plan, error: planError } = await supabase_js_1.supabase
            .from('parent_subscription_plans')
            .select('*')
            .eq('id', planId)
            .eq('is_active', true)
            .single();
        if (planError || !plan) {
            res.status(404).json({ error: 'Subscription plan not found' });
            return;
        }
        const { data: parentUser, error: userError } = await supabase_js_1.supabase
            .from('parent_users')
            .select('*')
            .eq('id', req.parent.userId)
            .single();
        if (userError || !parentUser) {
            res.status(404).json({ error: 'Parent user not found' });
            return;
        }
        const { data: currentSubscription } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select('*')
            .eq('parent_user_id', req.parent.userId)
            .single();
        const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
        const priceId = billingCycle === 'monthly' ? plan.stripe_price_monthly_id : plan.stripe_price_yearly_id;
        try {
            let customerId = currentSubscription?.stripe_customer_id;
            let subscription;
            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: parentUser.email,
                    name: `${parentUser.first_name} ${parentUser.last_name}`,
                    phone: parentUser.phone,
                    metadata: {
                        parent_user_id: req.parent.userId,
                        user_type: 'parent',
                    },
                });
                customerId = customer.id;
            }
            if (paymentMethodId) {
                await stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId,
                });
                await stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId,
                    },
                });
            }
            if (price > 0) {
                subscription = await stripe.subscriptions.create({
                    customer: customerId,
                    items: [{ price: priceId }],
                    payment_behavior: 'default_incomplete',
                    expand: ['latest_invoice.payment_intent'],
                    metadata: {
                        parent_user_id: req.parent.userId,
                        plan_id: planId,
                    },
                });
            }
            const currentPeriodStart = new Date();
            const currentPeriodEnd = new Date();
            if (billingCycle === 'monthly') {
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            }
            else {
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            }
            const subscriptionData = {
                parent_user_id: req.parent.userId,
                plan_id: planId,
                status: price > 0 ? 'active' : 'trial',
                current_period_start: currentPeriodStart,
                current_period_end: currentPeriodEnd,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription?.id,
                auto_renew: true,
                updated_at: new Date(),
            };
            let result;
            if (currentSubscription) {
                const { data, error } = await supabase_js_1.supabase
                    .from('parent_subscriptions')
                    .update(subscriptionData)
                    .eq('parent_user_id', req.parent.userId)
                    .select(`
            *,
            plan:parent_subscription_plans!inner(*)
          `)
                    .single();
                if (error)
                    throw error;
                result = data;
            }
            else {
                const { data, error } = await supabase_js_1.supabase
                    .from('parent_subscriptions')
                    .insert({
                    ...subscriptionData,
                    created_at: new Date(),
                })
                    .select(`
            *,
            plan:parent_subscription_plans!inner(*)
          `)
                    .single();
                if (error)
                    throw error;
                result = data;
            }
            await supabase_js_1.supabase
                .from('parent_activity_logs')
                .insert({
                parent_user_id: req.parent.userId,
                action: 'subscription_created',
                resource_type: 'parent_subscription',
                resource_id: result.id,
                details: {
                    plan_id: planId,
                    billing_cycle: billingCycle,
                    price,
                },
            });
            res.json({
                message: 'Subscription created successfully',
                subscription: result,
                clientSecret: subscription?.latest_invoice?.payment_intent?.client_secret,
            });
            return;
        }
        catch (stripeError) {
            console.error('Stripe error:', stripeError);
            res.status(400).json({
                error: stripeError.message || 'Payment processing failed'
            });
            return;
        }
    }
    catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/cancel', authenticateParent, async (req, res) => {
    try {
        const { data: subscription, error: subscriptionError } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select('*')
            .eq('parent_user_id', req.parent.userId)
            .single();
        if (subscriptionError || !subscription) {
            res.status(404).json({ error: 'Subscription not found' });
            return;
        }
        if (subscription.stripe_subscription_id) {
            try {
                await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                    cancel_at_period_end: true,
                });
            }
            catch (stripeError) {
                console.error('Stripe cancel error:', stripeError);
            }
        }
        const { data: updatedSubscription, error } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .update({
            status: 'cancelled',
            cancelled_at: new Date(),
            auto_renew: false,
            updated_at: new Date(),
        })
            .eq('parent_user_id', req.parent.userId)
            .select(`
        *,
        plan:parent_subscription_plans!inner(*)
      `)
            .single();
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.userId,
            action: 'subscription_cancelled',
            resource_type: 'parent_subscription',
            resource_id: subscription.id,
        });
        res.json({
            message: 'Subscription cancelled successfully',
            subscription: updatedSubscription,
        });
    }
    catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
        res.status(400).json({ error: 'Missing signature or webhook secret' });
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
    }
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                if (subscription.metadata.parent_user_id) {
                    const periodStart = new Date(subscription.current_period_start * 1000);
                    const periodEnd = new Date(subscription.current_period_end * 1000);
                    await supabase_js_1.supabase
                        .from('parent_subscriptions')
                        .update({
                        status: subscription.status,
                        current_period_start: periodStart,
                        current_period_end: periodEnd,
                        stripe_subscription_id: subscription.id,
                        updated_at: new Date(),
                    })
                        .eq('parent_user_id', subscription.metadata.parent_user_id);
                }
                break;
            case 'customer.subscription.deleted':
                const deletedSubscription = event.data.object;
                if (deletedSubscription.metadata.parent_user_id) {
                    await supabase_js_1.supabase
                        .from('parent_subscriptions')
                        .update({
                        status: 'cancelled',
                        cancelled_at: new Date(),
                        auto_renew: false,
                        updated_at: new Date(),
                    })
                        .eq('parent_user_id', deletedSubscription.metadata.parent_user_id);
                }
                break;
            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                if (invoice.subscription && invoice.customer) {
                    console.log('Payment succeeded for subscription:', invoice.subscription);
                }
                break;
            case 'invoice.payment_failed':
                const failedInvoice = event.data.object;
                if (failedInvoice.subscription && failedInvoice.customer) {
                    console.log('Payment failed for subscription:', failedInvoice.subscription);
                }
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
        return;
    }
    catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
//# sourceMappingURL=parent-subscriptions.js.map