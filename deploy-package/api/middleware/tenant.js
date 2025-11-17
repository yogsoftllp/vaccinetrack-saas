"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantResource = exports.addTenantFilter = exports.requireSuperAdmin = exports.requireRole = exports.requireAuth = exports.requireTenant = exports.extractTenant = void 0;
const supabase_js_1 = require("../lib/supabase.js");
const extractTenant = async (req, res, next) => {
    try {
        const host = req.get('host');
        const subdomain = host?.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
            const { data: tenant, error } = await supabase_js_1.supabase
                .from('tenants')
                .select('id, name, subdomain, status')
                .eq('subdomain', subdomain)
                .eq('status', 'active')
                .single();
            if (error || !tenant) {
                res.status(404).json({
                    success: false,
                    error: 'Tenant not found or inactive'
                });
                return;
            }
            req.tenant = tenant;
        }
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { data: { user }, error } = await supabase_js_1.supabase.auth.getUser(token);
            if (user) {
                const { data: tenantUser } = await supabase_js_1.supabase
                    .from('tenant_users')
                    .select('tenant_id, role')
                    .eq('user_id', user.id)
                    .single();
                if (tenantUser) {
                    const { data: tenant } = await supabase_js_1.supabase
                        .from('tenants')
                        .select('id, name, subdomain, status')
                        .eq('id', tenantUser.tenant_id)
                        .eq('status', 'active')
                        .single();
                    if (tenant) {
                        req.tenant = tenant;
                        req.user = {
                            id: user.id,
                            email: user.email,
                            full_name: user.user_metadata?.full_name || '',
                            role: tenantUser.role,
                            tenant_id: tenantUser.tenant_id,
                            created_at: user.created_at,
                            updated_at: user.updated_at || new Date().toISOString(),
                            is_active: true
                        };
                    }
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('Tenant extraction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to extract tenant information'
        });
    }
};
exports.extractTenant = extractTenant;
const requireTenant = (req, res, next) => {
    if (!req.tenant) {
        res.status(400).json({
            success: false,
            error: 'Tenant context is required for this operation'
        });
        return;
    }
    next();
};
exports.requireTenant = requireTenant;
const requireAuth = (req, res, next) => {
    if (!req.user || !req.tenant) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        res.status(403).json({
            success: false,
            error: 'Super admin privileges required'
        });
        return;
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
const addTenantFilter = (req, res, next) => {
    if (req.tenant) {
        if (!req.query)
            req.query = {};
        req.query.tenant_id = req.tenant.id;
    }
    next();
};
exports.addTenantFilter = addTenantFilter;
const validateTenantResource = async (req, res, next) => {
    if (!req.tenant || !req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }
    const resourceId = req.params.id || req.body.id;
    if (!resourceId) {
        next();
        return;
    }
    try {
        const route = req.baseUrl + req.path;
        let table;
        if (route.includes('/patients'))
            table = 'patients';
        else if (route.includes('/vaccinations'))
            table = 'vaccinations';
        else if (route.includes('/appointments'))
            table = 'appointments';
        else if (route.includes('/inventory'))
            table = 'inventory';
        else if (route.includes('/clinics'))
            table = 'clinics';
        else {
            next();
            return;
        }
        const { data, error } = await supabase_js_1.supabase
            .from(table)
            .select('tenant_id')
            .eq('id', resourceId)
            .single();
        if (error || !data) {
            res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
            return;
        }
        if (data.tenant_id !== req.tenant.id) {
            res.status(403).json({
                success: false,
                error: 'Access denied to this resource'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Resource validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate resource access'
        });
    }
};
exports.validateTenantResource = validateTenantResource;
//# sourceMappingURL=tenant.js.map