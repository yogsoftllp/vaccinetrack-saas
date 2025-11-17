"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_js_1 = require("../middleware/tenant.js");
const supabase_js_1 = require("../lib/supabase.js");
const router = (0, express_1.Router)();
router.get('/features', (0, tenant_js_1.requireRole)(['super_admin', 'tenant_admin']), async (req, res) => {
    try {
        const { data: features, error } = await supabase_js_1.supabase
            .from('features')
            .select('*')
            .order('name');
        if (error) {
            console.error('Error fetching features:', error);
            res.status(500).json({ error: 'Failed to fetch features' });
            return;
        }
        return res.json({ features });
    }
    catch (error) {
        console.error('Error in get features:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
router.get('/tenants/:tenantId/features', tenant_js_1.requireSuperAdmin, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { data: tenantFeatures, error } = await supabase_js_1.supabase
            .from('tenant_features')
            .select(`
        *,
        feature:features(*)
      `)
            .eq('tenant_id', tenantId);
        if (error) {
            console.error('Error fetching tenant features:', error);
            return res.status(500).json({ error: 'Failed to fetch tenant features' });
        }
        return res.json({
            features: tenantFeatures?.map(tf => ({
                id: tf.feature.id,
                name: tf.feature.name,
                description: tf.feature.description,
                category: tf.feature.category,
                enabled: tf.enabled,
                configurable: tf.feature.configurable,
                tenant_feature_id: tf.id
            })) || []
        });
    }
    catch (error) {
        console.error('Error in get tenant features:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
router.put('/tenants/:tenantId/features/:featureId', tenant_js_1.requireSuperAdmin, async (req, res) => {
    try {
        const { tenantId, featureId } = req.params;
        const { enabled } = req.body;
        const { data: existingFeature } = await supabase_js_1.supabase
            .from('tenant_features')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('feature_id', featureId)
            .single();
        let result;
        if (existingFeature) {
            const { data, error } = await supabase_js_1.supabase
                .from('tenant_features')
                .update({
                enabled,
                updated_at: new Date().toISOString()
            })
                .eq('id', existingFeature.id)
                .select()
                .single();
            if (error) {
                console.error('Error updating tenant feature:', error);
                res.status(500).json({ error: 'Failed to update feature' });
                return;
            }
            result = data;
        }
        else {
            const { data, error } = await supabase_js_1.supabase
                .from('tenant_features')
                .insert({
                tenant_id: tenantId,
                feature_id: featureId,
                enabled,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('Error creating tenant feature:', error);
                res.status(500).json({ error: 'Failed to create feature' });
                return;
            }
            result = data;
        }
        res.json({ feature: result });
        return;
    }
    catch (error) {
        console.error('Error in update tenant feature:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
router.get('/tenant/features', (0, tenant_js_1.requireRole)(['admin', 'doctor', 'nurse', 'receptionist']), async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            res.status(400).json({ error: 'Tenant ID is required' });
            return;
        }
        const { data: tenantFeatures, error } = await supabase_js_1.supabase
            .from('tenant_features')
            .select(`
        *,
        feature:features(*)
      `)
            .eq('tenant_id', tenantId)
            .eq('enabled', true);
        if (error) {
            console.error('Error fetching tenant features:', error);
            res.status(500).json({ error: 'Failed to fetch features' });
            return;
        }
        res.json({
            features: tenantFeatures?.map(tf => ({
                id: tf.feature.id,
                name: tf.feature.name,
                description: tf.feature.description,
                category: tf.feature.category,
                enabled: tf.enabled
            })) || []
        });
        return;
    }
    catch (error) {
        console.error('Error in get tenant features:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
router.get('/tenant/features/:featureName/check', (0, tenant_js_1.requireRole)(['admin', 'doctor', 'nurse', 'receptionist']), async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { featureName } = req.params;
        if (!tenantId) {
            res.status(400).json({ error: 'Tenant ID is required' });
            return;
        }
        const { data: feature, error } = await supabase_js_1.supabase
            .from('features')
            .select('id')
            .eq('name', featureName)
            .single();
        if (error || !feature) {
            res.status(404).json({ error: 'Feature not found' });
            return;
        }
        const { data: tenantFeature, error: tfError } = await supabase_js_1.supabase
            .from('tenant_features')
            .select('enabled')
            .eq('tenant_id', tenantId)
            .eq('feature_id', feature.id)
            .single();
        if (tfError || !tenantFeature) {
            res.json({ enabled: false });
            return;
        }
        res.json({ enabled: tenantFeature.enabled });
        return;
    }
    catch (error) {
        console.error('Error in check feature:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});
router.put('/tenants/:tenantId/features/bulk', tenant_js_1.requireSuperAdmin, async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { features } = req.body;
        const updates = features.map(async (featureUpdate) => {
            const { data: existingFeature } = await supabase_js_1.supabase
                .from('tenant_features')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('feature_id', featureUpdate.feature_id)
                .single();
            if (existingFeature) {
                return supabase_js_1.supabase
                    .from('tenant_features')
                    .update({
                    enabled: featureUpdate.enabled,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', existingFeature.id);
            }
            else {
                return supabase_js_1.supabase
                    .from('tenant_features')
                    .insert({
                    tenant_id: tenantId,
                    feature_id: featureUpdate.feature_id,
                    enabled: featureUpdate.enabled,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        });
        await Promise.all(updates);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error in bulk update features:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=features.js.map