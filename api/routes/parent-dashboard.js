"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const parentAuth_js_1 = require("../middleware/parentAuth.js");
const router = (0, express_1.Router)();
router.get('/overview', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const parentId = req.parent?.id;
        const { count: childrenCount } = await supabase_js_1.supabase
            .from('parent_children')
            .select('*', { count: 'exact', head: true })
            .eq('parent_user_id', parentId)
            .eq('is_active', true);
        const { data: upcomingReminders, error: remindersError } = await supabase_js_1.supabase
            .from('vaccination_reminders')
            .select(`
        *,
        child:parent_children!inner(first_name, last_name)
      `)
            .eq('parent_user_id', parentId)
            .eq('is_completed', false)
            .gte('scheduled_date', new Date().toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true })
            .limit(5);
        const { data: subscription } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select(`
        *,
        plan:parent_subscription_plans!inner(name, max_children, max_notifications_per_month)
      `)
            .eq('parent_user_id', parentId)
            .single();
        const { data: recentActivity } = await supabase_js_1.supabase
            .from('parent_activity_logs')
            .select('*')
            .eq('parent_user_id', parentId)
            .order('created_at', { ascending: false })
            .limit(10);
        res.json({
            overview: {
                childrenCount: childrenCount || 0,
                upcomingReminders: upcomingReminders || [],
                subscription: subscription || null,
                recentActivity: recentActivity || [],
            },
        });
    }
    catch (error) {
        console.error('Get dashboard overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/children', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { data: children, error } = await supabase_js_1.supabase
            .from('parent_children')
            .select('*')
            .eq('parent_user_id', req.parent.id)
            .eq('is_active', true)
            .order('first_name', { ascending: true });
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json({ children: children || [] });
    }
    catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/children', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, medicalRecordNumber, notes } = req.body;
        if (!firstName || !lastName || !dateOfBirth) {
            res.status(400).json({ error: 'First name, last name, and date of birth are required' });
            return;
        }
        const { data: subscription } = await supabase_js_1.supabase
            .from('parent_subscriptions')
            .select(`
        *,
        plan:parent_subscription_plans!inner(max_children)
      `)
            .eq('parent_user_id', req.parent.id)
            .single();
        if (!subscription) {
            res.status(403).json({ error: 'No active subscription found' });
            return;
        }
        const { count: currentChildren } = await supabase_js_1.supabase
            .from('parent_children')
            .select('*', { count: 'exact', head: true })
            .eq('parent_user_id', req.parent.id)
            .eq('is_active', true);
        if ((currentChildren || 0) >= subscription.plan.max_children) {
            res.status(403).json({
                error: 'Maximum children limit reached for your subscription plan'
            });
            return;
        }
        const { data: child, error } = await supabase_js_1.supabase
            .from('parent_children')
            .insert({
            parent_user_id: req.parent.id,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            gender,
            medical_record_number: medicalRecordNumber,
            notes,
            is_active: true,
        })
            .select()
            .single();
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        await createVaccinationSchedule(req.parent.id, child.id, dateOfBirth);
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.id,
            action: 'child_added',
            resource_type: 'parent_child',
            resource_id: child.id,
            details: { child_name: `${firstName} ${lastName}` },
        });
        res.status(201).json({
            message: 'Child added successfully',
            child,
        });
    }
    catch (error) {
        console.error('Add child error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/children/:id', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, dateOfBirth, gender, medicalRecordNumber, notes } = req.body;
        const { data: child, error } = await supabase_js_1.supabase
            .from('parent_children')
            .update({
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            gender,
            medical_record_number: medicalRecordNumber,
            notes,
            updated_at: new Date(),
        })
            .eq('id', id)
            .eq('parent_user_id', req.parent.id)
            .select()
            .single();
        if (error) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.id,
            action: 'child_updated',
            resource_type: 'parent_child',
            resource_id: id,
        });
        res.json({
            message: 'Child updated successfully',
            child,
        });
    }
    catch (error) {
        console.error('Update child error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/children/:id', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: child, error } = await supabase_js_1.supabase
            .from('parent_children')
            .update({ is_active: false })
            .eq('id', id)
            .eq('parent_user_id', req.parent.id)
            .select()
            .single();
        if (error) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        await supabase_js_1.supabase
            .from('vaccination_reminders')
            .update({ is_completed: true })
            .eq('child_id', id)
            .eq('parent_user_id', req.parent.id);
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.id,
            action: 'child_deleted',
            resource_type: 'parent_child',
            resource_id: id,
        });
        res.json({ message: 'Child removed successfully' });
    }
    catch (error) {
        console.error('Delete child error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/children/:id/reminders', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: child } = await supabase_js_1.supabase
            .from('parent_children')
            .select('id')
            .eq('id', id)
            .eq('parent_user_id', req.parent.id)
            .single();
        if (!child) {
            res.status(404).json({ error: 'Child not found' });
            return;
        }
        const { data: reminders, error } = await supabase_js_1.supabase
            .from('vaccination_reminders')
            .select('*')
            .eq('child_id', id)
            .order('scheduled_date', { ascending: true });
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json({ reminders: reminders || [] });
    }
    catch (error) {
        console.error('Get child reminders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/reminders/:id/complete', parentAuth_js_1.authenticateParent, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: reminder, error } = await supabase_js_1.supabase
            .from('vaccination_reminders')
            .update({
            is_completed: true,
            completed_at: new Date(),
            updated_at: new Date(),
        })
            .eq('id', id)
            .eq('parent_user_id', req.parent.userId)
            .select(`
        *,
        child:parent_children!inner(first_name, last_name)
      `)
            .single();
        if (error) {
            res.status(404).json({ error: 'Reminder not found' });
            return;
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.userId,
            action: 'vaccination_completed',
            resource_type: 'vaccination_reminder',
            resource_id: id,
            details: {
                child_name: `${reminder.child.first_name} ${reminder.child.last_name}`,
                vaccine_name: reminder.vaccine_name,
            },
        });
        res.json({
            message: 'Vaccination marked as completed',
            reminder,
        });
    }
    catch (error) {
        console.error('Complete reminder error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function createVaccinationSchedule(parentUserId, childId, dateOfBirth) {
    try {
        const birthDate = new Date(dateOfBirth);
        const vaccines = [
            { name: 'Hepatitis B (1st dose)', ageMonths: 0, days: 0 },
            { name: 'Hepatitis B (2nd dose)', ageMonths: 1, days: 0 },
            { name: 'DTaP (1st dose)', ageMonths: 2, days: 0 },
            { name: 'IPV (1st dose)', ageMonths: 2, days: 0 },
            { name: 'Hib (1st dose)', ageMonths: 2, days: 0 },
            { name: 'PCV13 (1st dose)', ageMonths: 2, days: 0 },
            { name: 'RV (1st dose)', ageMonths: 2, days: 0 },
            { name: 'DTaP (2nd dose)', ageMonths: 4, days: 0 },
            { name: 'IPV (2nd dose)', ageMonths: 4, days: 0 },
            { name: 'Hib (2nd dose)', ageMonths: 4, days: 0 },
            { name: 'PCV13 (2nd dose)', ageMonths: 4, days: 0 },
            { name: 'RV (2nd dose)', ageMonths: 4, days: 0 },
            { name: 'DTaP (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'IPV (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'Hib (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'PCV13 (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'RV (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'Hepatitis B (3rd dose)', ageMonths: 6, days: 0 },
            { name: 'MMR (1st dose)', ageMonths: 12, days: 0 },
            { name: 'Varicella (1st dose)', ageMonths: 12, days: 0 },
            { name: 'Hib (4th dose)', ageMonths: 12, days: 0 },
            { name: 'PCV13 (4th dose)', ageMonths: 12, days: 0 },
            { name: 'DTaP (4th dose)', ageMonths: 15, days: 0 },
            { name: 'IPV (4th dose)', ageMonths: 15, days: 0 },
            { name: 'DTaP (5th dose)', ageMonths: 48, days: 0 },
            { name: 'IPV (5th dose)', ageMonths: 48, days: 0 },
            { name: 'MMR (2nd dose)', ageMonths: 48, days: 0 },
            { name: 'Varicella (2nd dose)', ageMonths: 48, days: 0 },
        ];
        const reminders = vaccines.map(vaccine => {
            const scheduledDate = new Date(birthDate);
            scheduledDate.setMonth(scheduledDate.getMonth() + vaccine.ageMonths);
            scheduledDate.setDate(scheduledDate.getDate() + vaccine.days);
            return {
                parent_user_id: parentUserId,
                child_id: childId,
                vaccine_name: vaccine.name,
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                reminder_type: 'email',
                reminder_sent: false,
                is_completed: false,
                notification_message: `Time for ${vaccine.name} vaccination for your child.`,
            };
        });
        await supabase_js_1.supabase
            .from('vaccination_reminders')
            .insert(reminders);
    }
    catch (error) {
        console.error('Error creating vaccination schedule:', error);
    }
}
exports.default = router;
//# sourceMappingURL=parent-dashboard.js.map