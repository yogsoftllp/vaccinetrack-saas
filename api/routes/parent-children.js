"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const vaccinationScheduleGenerator_js_1 = require("../services/vaccinationScheduleGenerator.js");
const parentAuth_js_1 = require("../middleware/parentAuth.js");
const router = (0, express_1.Router)();
router.use(parentAuth_js_1.authenticateParent);
const checkSubscriptionLimits = async (parentId, action) => {
    const { data: subscription } = await supabase_js_1.supabase
        .from('parent_subscriptions')
        .select(`
      *,
      parent_subscription_plans(max_children, max_reminders, ai_scheduling_enabled)
    `)
        .eq('parent_id', parentId)
        .eq('status', 'active')
        .single();
    if (!subscription) {
        throw new Error('No active subscription found');
    }
    const plan = subscription.parent_subscription_plans;
    if (action === 'add_child') {
        const { count } = await supabase_js_1.supabase
            .from('children')
            .select('*', { count: 'exact', head: true })
            .eq('parent_id', parentId)
            .eq('is_active', true);
        if (count && count >= plan.max_children) {
            throw new Error(`Maximum children limit (${plan.max_children}) reached for your subscription plan`);
        }
    }
    return { subscription, plan };
};
router.post('/', async (req, res) => {
    try {
        const parentId = req.user?.userId;
        const { firstName, lastName, dateOfBirth, gender, bloodGroup, birthWeightKg, birthHeightCm, allergies, medicalConditions, emergencyContactName, emergencyContactPhone, pediatricianName, pediatricianPhone, notes } = req.body;
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            res.status(400).json({
                error: 'Missing required fields',
                details: 'First name, last name, date of birth, and gender are required'
            });
            return;
        }
        await checkSubscriptionLimits(parentId, 'add_child');
        const { data: child, error: childError } = await supabase_js_1.supabase
            .from('children')
            .insert({
            parent_id: parentId,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            gender: gender,
            blood_group: bloodGroup || null,
            birth_weight_kg: birthWeightKg || null,
            birth_height_cm: birthHeightCm || null,
            allergies: allergies || [],
            medical_conditions: medicalConditions || [],
            emergency_contact_name: emergencyContactName || null,
            emergency_contact_phone: emergencyContactPhone || null,
            pediatrician_name: pediatricianName || null,
            pediatrician_phone: pediatricianPhone || null,
            notes: notes || null
        })
            .select()
            .single();
        if (childError) {
            throw new Error(`Failed to create child: ${childError.message}`);
        }
        try {
            const parent = await supabase_js_1.supabase
                .from('parents')
                .select('country')
                .eq('id', parentId)
                .single();
            const schedule = await vaccinationScheduleGenerator_js_1.vaccinationScheduleGenerator.generateSchedule({
                id: child.id,
                first_name: child.first_name,
                last_name: child.last_name,
                date_of_birth: child.date_of_birth,
                gender: child.gender,
                allergies: child.allergies,
                medical_conditions: child.medical_conditions
            }, {
                country_code: parent.data?.country || 'US',
                include_optional: false
            });
            if (schedule.length > 0) {
                await vaccinationScheduleGenerator_js_1.vaccinationScheduleGenerator.saveScheduleToDatabase(schedule);
            }
        }
        catch (scheduleError) {
            console.error('Error generating vaccination schedule:', scheduleError);
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_id: parentId,
            child_id: child.id,
            action: 'child_created',
            metadata: { child_name: `${child.first_name} ${child.last_name}` }
        });
        res.status(201).json({
            message: 'Child added successfully',
            child: child
        });
        return;
    }
    catch (error) {
        console.error('Add child error:', error);
        res.status(500).json({
            error: 'Failed to add child',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const parentId = req.user?.userId;
        const { data: children, error } = await supabase_js_1.supabase
            .from('children')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_active', true)
            .order('first_name', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch children: ${error.message}`);
        }
        const childrenWithSchedules = await Promise.all((children || []).map(async (child) => {
            const { data: upcomingVaccinations } = await supabase_js_1.supabase
                .from('vaccination_schedules')
                .select('*')
                .eq('child_id', child.id)
                .gte('due_date', new Date().toISOString().split('T')[0])
                .order('due_date', { ascending: true })
                .limit(3);
            const { count: completedVaccinations } = await supabase_js_1.supabase
                .from('parent_vaccination_records')
                .select('*', { count: 'exact', head: true })
                .eq('child_id', child.id);
            return {
                id: child.id,
                firstName: child.first_name,
                lastName: child.last_name,
                dateOfBirth: child.date_of_birth,
                gender: child.gender,
                bloodGroup: child.blood_group,
                birthWeightKg: child.birth_weight_kg,
                birthHeightCm: child.birth_height_cm,
                allergies: child.allergies,
                medicalConditions: child.medical_conditions,
                emergencyContactName: child.emergency_contact_name,
                emergencyContactPhone: child.emergency_contact_phone,
                pediatricianName: child.pediatrician_name,
                pediatricianPhone: child.pediatrician_phone,
                notes: child.notes,
                ageInMonths: Math.floor((new Date().getTime() - new Date(child.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30)),
                upcomingVaccinations: upcomingVaccinations || [],
                completedVaccinationsCount: completedVaccinations || 0,
                createdAt: child.created_at,
                updatedAt: child.updated_at
            };
        }));
        res.json({
            children: childrenWithSchedules
        });
    }
    catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({
            error: 'Failed to fetch children',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const parentId = req.user?.userId;
        const childId = req.params.id;
        const { data: child, error } = await supabase_js_1.supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .eq('parent_id', parentId)
            .eq('is_active', true)
            .single();
        if (error || !child) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        const { data: schedule } = await supabase_js_1.supabase
            .from('vaccination_schedules')
            .select('*')
            .eq('child_id', childId)
            .order('due_date', { ascending: true });
        const { data: records } = await supabase_js_1.supabase
            .from('parent_vaccination_records')
            .select('*')
            .eq('child_id', childId)
            .order('vaccination_date', { ascending: true });
        res.json({
            child: {
                id: child.id,
                firstName: child.first_name,
                lastName: child.last_name,
                dateOfBirth: child.date_of_birth,
                gender: child.gender,
                bloodGroup: child.blood_group,
                birthWeightKg: child.birth_weight_kg,
                birthHeightCm: child.birth_height_cm,
                allergies: child.allergies,
                medicalConditions: child.medical_conditions,
                emergencyContactName: child.emergency_contact_name,
                emergencyContactPhone: child.emergency_contact_phone,
                pediatricianName: child.pediatrician_name,
                pediatricianPhone: child.pediatrician_phone,
                notes: child.notes,
                createdAt: child.created_at,
                updatedAt: child.updated_at
            },
            vaccinationSchedule: schedule || [],
            vaccinationRecords: records || []
        });
    }
    catch (error) {
        console.error('Get child error:', error);
        res.status(500).json({
            error: 'Failed to fetch child',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const parentId = req.user?.userId;
        const childId = req.params.id;
        const { firstName, lastName, dateOfBirth, gender, bloodGroup, birthWeightKg, birthHeightCm, allergies, medicalConditions, emergencyContactName, emergencyContactPhone, pediatricianName, pediatricianPhone, notes } = req.body;
        const { data: existingChild } = await supabase_js_1.supabase
            .from('children')
            .select('id')
            .eq('id', childId)
            .eq('parent_id', parentId)
            .single();
        if (!existingChild) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        const { data: updatedChild, error } = await supabase_js_1.supabase
            .from('children')
            .update({
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            gender: gender,
            blood_group: bloodGroup || null,
            birth_weight_kg: birthWeightKg || null,
            birth_height_cm: birthHeightCm || null,
            allergies: allergies || [],
            medical_conditions: medicalConditions || [],
            emergency_contact_name: emergencyContactName || null,
            emergency_contact_phone: emergencyContactPhone || null,
            pediatrician_name: pediatricianName || null,
            pediatrician_phone: pediatricianPhone || null,
            notes: notes || null,
            updated_at: new Date().toISOString()
        })
            .eq('id', childId)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update child: ${error.message}`);
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_id: parentId,
            child_id: childId,
            action: 'child_updated',
            metadata: { child_name: `${updatedChild.first_name} ${updatedChild.last_name}` }
        });
        res.json({
            message: 'Child updated successfully',
            data: {
                child: {
                    id: updatedChild.id,
                    firstName: updatedChild.first_name,
                    lastName: updatedChild.last_name,
                    dateOfBirth: updatedChild.date_of_birth,
                    gender: updatedChild.gender,
                    bloodGroup: updatedChild.blood_group,
                    birthWeightKg: updatedChild.birth_weight_kg,
                    birthHeightCm: updatedChild.birth_height_cm,
                    allergies: updatedChild.allergies,
                    medicalConditions: updatedChild.medical_conditions,
                    emergencyContactName: updatedChild.emergency_contact_name,
                    emergencyContactPhone: updatedChild.emergency_contact_phone,
                    pediatricianName: updatedChild.pediatrician_name,
                    pediatricianPhone: updatedChild.pediatrician_phone,
                    notes: updatedChild.notes,
                    updatedAt: updatedChild.updated_at
                }
            }
        });
    }
    catch (error) {
        console.error('Update child error:', error);
        res.status(500).json({
            error: 'Failed to update child',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const parentId = req.user?.userId;
        const childId = req.params.id;
        const { data: existingChild } = await supabase_js_1.supabase
            .from('children')
            .select('id, first_name, last_name')
            .eq('id', childId)
            .eq('parent_id', parentId)
            .single();
        if (!existingChild) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        const { error } = await supabase_js_1.supabase
            .from('children')
            .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
            .eq('id', childId);
        if (error) {
            throw new Error(`Failed to delete child: ${error.message}`);
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_id: parentId,
            child_id: childId,
            action: 'child_deleted',
            metadata: { child_name: `${existingChild.first_name} ${existingChild.last_name}` }
        });
        res.json({ message: 'Child deleted successfully' });
    }
    catch (error) {
        console.error('Delete child error:', error);
        res.status(500).json({
            error: 'Failed to delete child',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.post('/:id/generate-schedule', async (req, res) => {
    try {
        const parentId = req.user.userId;
        const childId = req.params.id;
        const { countryCode, includeOptional = false } = req.body;
        const { data: child } = await supabase_js_1.supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .eq('parent_id', parentId)
            .single();
        if (!child) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        const { data: subscription } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select(`
        *,
        parent_subscription_plans(ai_scheduling_enabled)
      `)
            .eq('parent_id', parentId)
            .eq('status', 'active')
            .single();
        if (!subscription || !subscription.parent_subscription_plans?.ai_scheduling_enabled) {
            res.status(403).json({
                error: 'AI scheduling not available',
                details: 'Upgrade to Premium or Family plan to use AI-powered vaccination scheduling'
            });
            return;
        }
        const { data: parent } = await supabase_js_1.supabase
            .from('parents')
            .select('country')
            .eq('id', parentId)
            .single();
        const schedule = await vaccinationScheduleGenerator_js_1.vaccinationScheduleGenerator.generateSchedule({
            id: child.id,
            first_name: child.first_name,
            last_name: child.last_name,
            date_of_birth: child.date_of_birth,
            gender: child.gender,
            allergies: child.allergies,
            medical_conditions: child.medical_conditions
        }, {
            country_code: countryCode || parent?.country || 'US',
            include_optional: includeOptional
        });
        if (schedule.length > 0) {
            await vaccinationScheduleGenerator_js_1.vaccinationScheduleGenerator.saveScheduleToDatabase(schedule);
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_id: parentId,
            child_id: childId,
            action: 'schedule_generated',
            metadata: { schedule_count: schedule.length, country_code: countryCode || parent?.country || 'US' }
        });
        res.json({
            message: 'Vaccination schedule generated successfully',
            data: {
                schedule: schedule,
                totalVaccines: schedule.length
            }
        });
    }
    catch (error) {
        console.error('Generate schedule error:', error);
        res.status(500).json({
            error: 'Failed to generate vaccination schedule',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=parent-children.js.map