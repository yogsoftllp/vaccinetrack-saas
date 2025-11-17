"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const supabase_1 = require("../lib/supabase");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
});
class SubscriptionService {
    async createStripeCustomer(tenantId, email, name) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata: {
                    tenant_id: tenantId,
                },
            });
            await supabase_1.supabase
                .from('tenants')
                .update({ stripe_customer_id: customer.id })
                .eq('id', tenantId);
            return customer.id;
        }
        catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw new Error('Failed to create customer');
        }
    }
    async createSubscription(tenantId, planId, paymentMethodId) {
        try {
            const { data: tenant } = await supabase_1.supabase
                .from('tenants')
                .select('*')
                .eq('id', tenantId)
                .single();
            const { data: plan } = await supabase_1.supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', planId)
                .single();
            if (!tenant || !plan) {
                throw new Error('Tenant or plan not found');
            }
            let customerId = tenant.stripe_customer_id;
            if (!customerId) {
                customerId = await this.createStripeCustomer(tenantId, tenant.contact_email, tenant.name);
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
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: plan.stripe_price_id }],
                trial_period_days: plan.trial_period_days || 0,
                metadata: {
                    tenant_id: tenantId,
                    plan_id: planId,
                },
            });
            const subscriptionData = {
                tenant_id: tenantId,
                plan_id: planId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                trial_ends_at: subscription.trial_end
                    ? new Date(subscription.trial_end * 1000).toISOString()
                    : undefined,
                current_period_start: subscription.current_period_start
                    ? new Date(subscription.current_period_start * 1000).toISOString()
                    : undefined,
                current_period_end: subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000).toISOString()
                    : undefined,
            };
            const { data: tenantSubscription, error } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .insert(subscriptionData)
                .select()
                .single();
            if (error) {
                throw new Error('Failed to create subscription record');
            }
            return tenantSubscription;
        }
        catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }
    async updateSubscriptionPlan(tenantId, newPlanId) {
        try {
            const { data: currentSubscription } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single();
            if (!currentSubscription) {
                throw new Error('No active subscription found');
            }
            const { data: newPlan } = await supabase_1.supabase
                .from('subscription_plans')
                .select('*')
                .eq('id', newPlanId)
                .single();
            if (!newPlan) {
                throw new Error('New plan not found');
            }
            const subscription = await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
                items: [{ price: newPlan.stripe_price_id }],
                proration_behavior: 'create_prorations',
            });
            const { data: updatedSubscription, error } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .update({
                plan_id: newPlanId,
                updated_at: new Date().toISOString(),
            })
                .eq('id', currentSubscription.id)
                .select()
                .single();
            if (error || !updatedSubscription) {
                throw new Error('Failed to update subscription');
            }
            return updatedSubscription;
        }
        catch (error) {
            console.error('Error updating subscription plan:', error);
            throw error;
        }
    }
    async cancelSubscription(tenantId) {
        try {
            const { data: subscription } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single();
            if (!subscription) {
                throw new Error('No active subscription found');
            }
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true,
            });
            const { error } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
                .eq('id', subscription.id);
            if (error) {
                throw new Error('Failed to cancel subscription');
            }
        }
        catch (error) {
            console.error('Error cancelling subscription:', error);
            throw error;
        }
    }
    async handleWebhookEvent(event) {
        try {
            switch (event.type) {
                case 'customer.subscription.updated':
                case 'customer.subscription.created':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error('Error handling webhook event:', error);
            throw error;
        }
    }
    async handleSubscriptionUpdated(subscription) {
        const tenantId = subscription.metadata.tenant_id;
        const planId = subscription.metadata.plan_id;
        if (!tenantId || !planId) {
            console.error('Missing tenant_id or plan_id in subscription metadata');
            return;
        }
        const updateData = {
            status: subscription.status,
            current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : undefined,
            current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : undefined,
            trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : undefined,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase_1.supabase
            .from('tenant_subscriptions')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id);
        if (error) {
            console.error('Error updating subscription:', error);
        }
    }
    async handleSubscriptionDeleted(subscription) {
        const { error } = await supabase_1.supabase
            .from('tenant_subscriptions')
            .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .eq('stripe_subscription_id', subscription.id);
        if (error) {
            console.error('Error updating cancelled subscription:', error);
        }
    }
    async handlePaymentSucceeded(invoice) {
        if (invoice.subscription) {
            const subscriptionId = invoice.subscription;
            console.log(`Payment succeeded for subscription: ${subscriptionId}`);
            const { error } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .update({
                status: 'active',
                updated_at: new Date().toISOString(),
            })
                .eq('stripe_subscription_id', subscriptionId);
            if (error) {
                console.error('Error updating subscription after payment:', error);
            }
        }
    }
    async handlePaymentFailed(invoice) {
        if (invoice.subscription) {
            const subscriptionId = invoice.subscription;
            console.log(`Payment failed for subscription: ${subscriptionId}`);
            const { error } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
            })
                .eq('stripe_subscription_id', subscriptionId);
            if (error) {
                console.error('Error updating subscription after failed payment:', error);
            }
        }
    }
    async getSubscriptionUsage(tenantId) {
        try {
            const [{ count: totalUsers }, { count: totalPatients }, { count: totalAppointments }, { count: totalVaccinations }] = await Promise.all([
                supabase_1.supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabase_1.supabase.from('patients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabase_1.supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabase_1.supabase.from('vaccinations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            ]);
            const { data: subscription } = await supabase_1.supabase
                .from('tenant_subscriptions')
                .select(`
          *,
          subscription_plans!inner(max_users, name)
        `)
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single();
            return {
                totalUsers: totalUsers || 0,
                totalPatients: totalPatients || 0,
                totalAppointments: totalAppointments || 0,
                totalVaccinations: totalVaccinations || 0,
                maxUsers: subscription?.subscription_plans?.max_users || 0,
                userUsagePercentage: subscription?.subscription_plans?.max_users
                    ? Math.round(((totalUsers || 0) / subscription.subscription_plans.max_users) * 100)
                    : 0,
                planName: subscription?.subscription_plans?.name || 'Unknown',
            };
        }
        catch (error) {
            console.error('Error getting subscription usage:', error);
            throw error;
        }
    }
    async checkSubscriptionLimits(tenantId) {
        try {
            const usage = await this.getSubscriptionUsage(tenantId);
            if (usage.userUsagePercentage >= 100) {
                return {
                    exceeded: true,
                    message: 'User limit exceeded. Please upgrade your plan.',
                };
            }
            return { exceeded: false };
        }
        catch (error) {
            console.error('Error checking subscription limits:', error);
            return { exceeded: false };
        }
    }
    async createSetupIntent(customerId) {
        try {
            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                usage: 'off_session',
            });
            return setupIntent;
        }
        catch (error) {
            console.error('Error creating setup intent:', error);
            throw new Error('Failed to create setup intent');
        }
    }
    async getPaymentMethods(customerId) {
        try {
            const paymentMethods = await stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            console.error('Error fetching payment methods:', error);
            throw new Error('Failed to fetch payment methods');
        }
    }
    async deletePaymentMethod(paymentMethodId) {
        try {
            await stripe.paymentMethods.detach(paymentMethodId);
        }
        catch (error) {
            console.error('Error deleting payment method:', error);
            throw new Error('Failed to delete payment method');
        }
    }
    async getBillingHistory(customerId) {
        try {
            const invoices = await stripe.invoices.list({
                customer: customerId,
                limit: 12,
            });
            return invoices.data;
        }
        catch (error) {
            console.error('Error fetching billing history:', error);
            throw new Error('Failed to fetch billing history');
        }
    }
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
//# sourceMappingURL=subscriptionService.js.map