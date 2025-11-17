"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const tenant_js_1 = require("../middleware/tenant.js");
const router = (0, express_1.Router)();
router.use(tenant_js_1.extractTenant);
router.use(tenant_js_1.requireAuth);
router.get('/dashboard', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const [{ count: totalPatients }, { count: totalAppointments }, { count: totalVaccinations }, { count: lowStockItems }, { data: recentAppointments }] = await Promise.all([
            supabase_js_1.supabase.from('patients').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase_js_1.supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase_js_1.supabase.from('vaccinations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
            supabase_js_1.supabase.from('inventory').select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .lt('current_stock', 'min_stock_level'),
            supabase_js_1.supabase.from('appointments')
                .select(`
          *,
          patients!inner(full_name),
          users!inner(full_name)
        `)
                .eq('tenant_id', tenantId)
                .order('appointment_date', { ascending: false })
                .limit(5)
        ]);
        const { data: upcomingVaccinations } = await supabase_js_1.supabase
            .from('vaccinations')
            .select(`
        *,
        patients!inner(full_name, date_of_birth),
        inventory!inner(name, batch_number)
      `)
            .eq('tenant_id', tenantId)
            .gte('scheduled_date', new Date().toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true })
            .limit(5);
        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalPatients: totalPatients || 0,
                    totalAppointments: totalAppointments || 0,
                    totalVaccinations: totalVaccinations || 0,
                    lowStockItems: lowStockItems || 0
                },
                recentAppointments: recentAppointments || [],
                upcomingVaccinations: upcomingVaccinations || []
            }
        });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load dashboard data'
        });
    }
});
router.get('/users', (0, tenant_js_1.requireRole)(['admin', 'doctor']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: users, error } = await supabase_js_1.supabase
            .from('users')
            .select(`
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at,
        tenant_users!inner(role as tenant_role)
      `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/users/invite', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { email, full_name, role = 'patient' } = req.body;
        const tenantId = req.tenant.id;
        const invitedBy = req.user.id;
        if (!email || !full_name) {
            res.status(400).json({
                success: false,
                error: 'Email and full name are required'
            });
            return;
        }
        const { data: existingUser } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .eq('tenant_id', tenantId)
            .single();
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'User already exists in this tenant'
            });
            return;
        }
        const invitationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { error: invitationError } = await supabase_js_1.supabase
            .from('tenant_invitations')
            .insert({
            tenant_id: tenantId,
            email,
            full_name,
            role,
            invitation_token: invitationToken,
            invited_by: invitedBy,
            expires_at: expiresAt,
            created_at: new Date().toISOString()
        });
        if (invitationError) {
            res.status(500).json({
                success: false,
                error: 'Failed to create invitation'
            });
            return;
        }
        res.status(201).json({
            success: true,
            data: {
                message: 'Invitation sent successfully',
                invitation_token: invitationToken
            }
        });
    }
    catch (error) {
        console.error('Invitation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/users/accept-invitation', async (req, res) => {
    try {
        const { invitation_token, password } = req.body;
        if (!invitation_token || !password) {
            res.status(400).json({
                success: false,
                error: 'Invitation token and password are required'
            });
            return;
        }
        const { data: invitation, error: invitationError } = await supabase_js_1.supabase
            .from('tenant_invitations')
            .select('*')
            .eq('invitation_token', invitation_token)
            .eq('status', 'pending')
            .single();
        if (invitationError || !invitation) {
            res.status(404).json({
                success: false,
                error: 'Invalid or expired invitation'
            });
            return;
        }
        if (new Date(invitation.expires_at) < new Date()) {
            res.status(410).json({
                success: false,
                error: 'Invitation has expired'
            });
            return;
        }
        const { data: authData, error: authError } = await supabase_js_1.supabase.auth.signUp({
            email: invitation.email,
            password,
            options: {
                data: {
                    full_name: invitation.full_name,
                    role: invitation.role,
                    tenant_id: invitation.tenant_id
                }
            }
        });
        if (authError || !authData.user) {
            res.status(400).json({
                success: false,
                error: authError?.message || 'Failed to create user'
            });
            return;
        }
        const { error: tenantUserError } = await supabase_js_1.supabase
            .from('tenant_users')
            .insert({
            user_id: authData.user.id,
            tenant_id: invitation.tenant_id,
            role: invitation.role,
            created_at: new Date().toISOString()
        });
        if (tenantUserError) {
            await supabase_js_1.supabase.auth.admin.deleteUser(authData.user.id);
            res.status(500).json({
                success: false,
                error: 'Failed to create tenant user mapping'
            });
            return;
        }
        const { error: profileError } = await supabase_js_1.supabase
            .from('users')
            .insert({
            id: authData.user.id,
            email: invitation.email,
            full_name: invitation.full_name,
            role: invitation.role,
            tenant_id: invitation.tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (profileError) {
            console.error('Profile creation error:', profileError);
        }
        await supabase_js_1.supabase
            .from('tenant_invitations')
            .update({
            status: 'accepted',
            accepted_at: new Date().toISOString()
        })
            .eq('id', invitation.id);
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: invitation.full_name,
                    role: invitation.role
                },
                tenant: {
                    id: invitation.tenant_id
                }
            }
        });
    }
    catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/settings', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: tenant, error: tenantError } = await supabase_js_1.supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();
        if (tenantError || !tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found'
            });
            return;
        }
        const { data: subscription } = await supabase_js_1.supabase
            .from('tenant_subscriptions')
            .select(`
        *,
        subscription_plans!inner(name, price, features)
      `)
            .eq('tenant_id', tenantId)
            .eq('status', 'active')
            .single();
        const { data: features } = await supabase_js_1.supabase
            .from('tenant_features')
            .select(`
        *,
        features!inner(name, description, category)
      `)
            .eq('tenant_id', tenantId)
            .eq('is_enabled', true);
        res.status(200).json({
            success: true,
            data: {
                tenant,
                subscription,
                features: features || []
            }
        });
    }
    catch (error) {
        console.error('Settings fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.put('/settings', (0, tenant_js_1.requireRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const updates = req.body;
        const allowedFields = ['name', 'business_name', 'contact_email', 'contact_phone', 'address', 'settings'];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
            obj[key] = updates[key];
            return obj;
        }, {});
        filteredUpdates.updated_at = new Date().toISOString();
        const { data: updatedTenant, error } = await supabase_js_1.supabase
            .from('tenants')
            .update(filteredUpdates)
            .eq('id', tenantId)
            .select()
            .single();
        if (error || !updatedTenant) {
            res.status(500).json({
                success: false,
                error: 'Failed to update tenant settings'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: updatedTenant
        });
    }
    catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=tenant.js.map