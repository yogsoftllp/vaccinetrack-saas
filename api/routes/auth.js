"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const tenant_js_1 = require("../middleware/tenant.js");
const router = (0, express_1.Router)();
router.use(tenant_js_1.extractTenant);
router.post('/register', tenant_js_1.requireTenant, async (req, res) => {
    try {
        const { email, password, full_name, role = 'patient' } = req.body;
        const tenantId = req.tenant.id;
        if (!email || !password || !full_name) {
            res.status(400).json({
                success: false,
                error: 'Email, password, and full name are required'
            });
            return;
        }
        const { data: userByEmail } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (userByEmail) {
            const { data: existingUser } = await supabase_js_1.supabase
                .from('tenant_users')
                .select('user_id')
                .eq('tenant_id', tenantId)
                .eq('user_id', userByEmail.id)
                .single();
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: 'User already exists in this tenant'
                });
                return;
            }
        }
        const { data: authData, error: authError } = await supabase_js_1.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    role,
                    tenant_id: tenantId
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
            tenant_id: tenantId,
            role: role,
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
            email,
            full_name,
            role,
            tenant_id: tenantId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (profileError) {
            console.error('Profile creation error:', profileError);
        }
        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name,
                    role
                },
                tenant: {
                    id: tenantId,
                    name: req.tenant.name,
                    subdomain: req.tenant.subdomain
                }
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/login', tenant_js_1.requireTenant, async (req, res) => {
    try {
        const { email, password } = req.body;
        const tenantId = req.tenant.id;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
            return;
        }
        const { data: authData, error: authError } = await supabase_js_1.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (authError || !authData.user || !authData.session) {
            res.status(401).json({
                success: false,
                error: authError?.message || 'Invalid credentials'
            });
            return;
        }
        const { data: tenantUser, error: tenantError } = await supabase_js_1.supabase
            .from('tenant_users')
            .select('role, created_at')
            .eq('user_id', authData.user.id)
            .eq('tenant_id', tenantId)
            .single();
        if (tenantError || !tenantUser) {
            await supabase_js_1.supabase.auth.signOut();
            res.status(403).json({
                success: false,
                error: 'User does not have access to this tenant'
            });
            return;
        }
        const { data: userProfile, error: profileError } = await supabase_js_1.supabase
            .from('users')
            .select('full_name, role, created_at, updated_at')
            .eq('id', authData.user.id)
            .single();
        if (profileError || !userProfile) {
            res.status(500).json({
                success: false,
                error: 'Failed to load user profile'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    full_name: userProfile.full_name,
                    role: userProfile.role,
                    tenant_role: tenantUser.role,
                    created_at: userProfile.created_at,
                    updated_at: userProfile.updated_at
                },
                tenant: {
                    id: tenantId,
                    name: req.tenant.name,
                    subdomain: req.tenant.subdomain
                },
                session: {
                    access_token: authData.session.access_token,
                    refresh_token: authData.session.refresh_token,
                    expires_at: authData.session.expires_at,
                    expires_in: authData.session.expires_in
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/logout', tenant_js_1.requireAuth, async (req, res) => {
    try {
        const { error } = await supabase_js_1.supabase.auth.signOut();
        if (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/me', tenant_js_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenant.id;
        const { data: userProfile, error: profileError } = await supabase_js_1.supabase
            .from('users')
            .select('id, email, full_name, role, created_at, updated_at')
            .eq('id', userId)
            .eq('tenant_id', tenantId)
            .single();
        if (profileError || !userProfile) {
            res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
            return;
        }
        const { data: tenantUser, error: tenantError } = await supabase_js_1.supabase
            .from('tenant_users')
            .select('role, created_at')
            .eq('user_id', userId)
            .eq('tenant_id', tenantId)
            .single();
        if (tenantError || !tenantUser) {
            res.status(404).json({
                success: false,
                error: 'Tenant user mapping not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user: {
                    ...userProfile,
                    tenant_role: tenantUser.role
                },
                tenant: {
                    id: tenantId,
                    name: req.tenant.name,
                    subdomain: req.tenant.subdomain
                }
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
            return;
        }
        const { data, error } = await supabase_js_1.supabase.auth.refreshSession({
            refresh_token
        });
        if (error || !data.session) {
            res.status(401).json({
                success: false,
                error: error?.message || 'Invalid refresh token'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                expires_in: data.session.expires_in
            }
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map