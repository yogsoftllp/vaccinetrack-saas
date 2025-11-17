"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const tenant_js_1 = require("../middleware/tenant.js");
const router = (0, express_1.Router)();
router.use(tenant_js_1.extractTenant);
router.use(tenant_js_1.requireAuth);
router.use(tenant_js_1.addTenantFilter);
router.get('/', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const sortBy = req.query.sort_by || 'created_at';
        const sortOrder = req.query.sort_order || 'desc';
        const offset = (page - 1) * limit;
        let query = supabase_js_1.supabase
            .from('patients')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId);
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        query = query.range(offset, offset + limit - 1);
        const { data: patients, count, error } = await query;
        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                patients: patients || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Patients fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:id', tenant_js_1.validateTenantResource, async (req, res) => {
    try {
        const patientId = req.params.id;
        const tenantId = req.tenant.id;
        const { data: patient, error } = await supabase_js_1.supabase
            .from('patients')
            .select(`
        *,
        medical_history(*),
        vaccination_records(*)
      `)
            .eq('id', patientId)
            .eq('tenant_id', tenantId)
            .single();
        if (error || !patient) {
            res.status(404).json({
                success: false,
                error: 'Patient not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: patient
        });
    }
    catch (error) {
        console.error('Patient fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/', (0, tenant_js_1.requireRole)(['admin', 'doctor']), async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { full_name, date_of_birth, gender, parent_name, parent_phone, parent_email, address, allergies, medical_conditions, emergency_contact } = req.body;
        if (!full_name || !date_of_birth) {
            res.status(400).json({
                success: false,
                error: 'Full name and date of birth are required'
            });
            return;
        }
        const patientData = {
            full_name,
            date_of_birth,
            gender,
            parent_name,
            parent_phone,
            parent_email,
            address,
            allergies: allergies || [],
            medical_conditions: medical_conditions || [],
            emergency_contact,
            tenant_id: tenantId,
            created_by: req.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data: patient, error } = await supabase_js_1.supabase
            .from('patients')
            .insert(patientData)
            .select()
            .single();
        if (error || !patient) {
            res.status(500).json({
                success: false,
                error: 'Failed to create patient'
            });
            return;
        }
        res.status(201).json({
            success: true,
            data: patient
        });
    }
    catch (error) {
        console.error('Patient creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.put('/:id', (0, tenant_js_1.requireRole)(['admin', 'doctor', 'nurse']), tenant_js_1.validateTenantResource, async (req, res) => {
    try {
        const patientId = req.params.id;
        const tenantId = req.tenant.id;
        const updates = req.body;
        delete updates.id;
        delete updates.tenant_id;
        delete updates.created_at;
        delete updates.created_by;
        updates.updated_at = new Date().toISOString();
        updates.updated_by = req.user.id;
        const { data: patient, error } = await supabase_js_1.supabase
            .from('patients')
            .update(updates)
            .eq('id', patientId)
            .eq('tenant_id', tenantId)
            .select()
            .single();
        if (error || !patient) {
            res.status(404).json({
                success: false,
                error: 'Patient not found or update failed'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: patient
        });
    }
    catch (error) {
        console.error('Patient update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:id', (0, tenant_js_1.requireRole)(['admin', 'doctor']), tenant_js_1.validateTenantResource, async (req, res) => {
    try {
        const patientId = req.params.id;
        const tenantId = req.tenant.id;
        const { data: relatedRecords } = await supabase_js_1.supabase
            .from('appointments')
            .select('id')
            .eq('patient_id', patientId)
            .eq('tenant_id', tenantId)
            .limit(1);
        if (relatedRecords && relatedRecords.length > 0) {
            res.status(409).json({
                success: false,
                error: 'Cannot delete patient with existing appointments'
            });
            return;
        }
        const { error } = await supabase_js_1.supabase
            .from('patients')
            .delete()
            .eq('id', patientId)
            .eq('tenant_id', tenantId);
        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete patient'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Patient deleted successfully'
        });
    }
    catch (error) {
        console.error('Patient deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:id/vaccinations', tenant_js_1.validateTenantResource, async (req, res) => {
    try {
        const patientId = req.params.id;
        const tenantId = req.tenant.id;
        const { data: vaccinations, error } = await supabase_js_1.supabase
            .from('vaccination_records')
            .select(`
        *,
        inventory!inner(name, manufacturer, batch_number)
      `)
            .eq('patient_id', patientId)
            .eq('tenant_id', tenantId)
            .order('vaccination_date', { ascending: false });
        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch vaccination records'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: vaccinations || []
        });
    }
    catch (error) {
        console.error('Vaccination history fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/:id/medical-history', (0, tenant_js_1.requireRole)(['admin', 'doctor', 'nurse']), tenant_js_1.validateTenantResource, async (req, res) => {
    try {
        const patientId = req.params.id;
        const tenantId = req.tenant.id;
        const { condition, diagnosis_date, treatment, notes, is_active = true } = req.body;
        if (!condition) {
            res.status(400).json({
                success: false,
                error: 'Condition is required'
            });
            return;
        }
        const medicalHistoryData = {
            patient_id: patientId,
            condition,
            diagnosis_date,
            treatment,
            notes,
            is_active,
            tenant_id: tenantId,
            created_by: req.user.id,
            created_at: new Date().toISOString()
        };
        const { data: medicalHistory, error } = await supabase_js_1.supabase
            .from('medical_history')
            .insert(medicalHistoryData)
            .select()
            .single();
        if (error || !medicalHistory) {
            res.status(500).json({
                success: false,
                error: 'Failed to add medical history'
            });
            return;
        }
        res.status(201).json({
            success: true,
            data: medicalHistory
        });
    }
    catch (error) {
        console.error('Medical history creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=patients.js.map