"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({
                error: 'Email, password, first name, and last name are required'
            });
            return;
        }
        const { data: existingParent } = await supabase_js_1.supabase
            .from('parent_users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingParent) {
            res.status(400).json({
                error: 'Parent account already exists with this email'
            });
            return;
        }
        const { data: authUser, error: authError } = await supabase_js_1.supabase.auth.signUp({
            email,
            password,
        });
        if (authError) {
            res.status(400).json({ error: authError.message });
            return;
        }
        if (!authUser.user) {
            res.status(500).json({ error: 'Failed to create auth user' });
            return;
        }
        const { data: parentUser, error: parentError } = await supabase_js_1.supabase
            .from('parent_users')
            .insert({
            id: authUser.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            email_verified: false,
            is_active: true,
        })
            .select()
            .single();
        if (parentError) {
            await supabase_js_1.supabase.auth.admin.deleteUser(authUser.user.id);
            res.status(500).json({ error: parentError.message });
            return;
        }
        await supabase_js_1.supabase
            .from('parent_notification_preferences')
            .insert({
            parent_user_id: authUser.user.id,
            email_enabled: true,
            sms_enabled: false,
            push_enabled: true,
            reminder_days_before: 7,
            reminder_time: '09:00:00',
            timezone: 'UTC',
            language: 'en',
        });
        const { data: freePlan } = await supabase_js_1.supabase
            .from('parent_subscription_plans')
            .select('id')
            .eq('name', 'Free Plan')
            .single();
        if (freePlan) {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 14);
            await supabase_js_1.supabase
                .from('parent_subscriptions')
                .insert({
                parent_user_id: authUser.user.id,
                plan_id: freePlan.id,
                status: 'trial',
                current_period_start: new Date(),
                current_period_end: trialEnd,
                trial_start: new Date(),
                trial_end: trialEnd,
            });
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: authUser.user.id,
            action: 'parent_registered',
            resource_type: 'parent_user',
            resource_id: authUser.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
        });
        res.status(201).json({
            message: 'Parent registered successfully',
            user: {
                id: parentUser.id,
                email: parentUser.email,
                firstName: parentUser.first_name,
                lastName: parentUser.last_name,
                phone: parentUser.phone,
            },
            requiresEmailVerification: true,
        });
        return;
    }
    catch (error) {
        console.error('Parent registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                error: 'Email and password are required'
            });
            return;
        }
        const { data: authData, error: authError } = await supabase_js_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        if (!authData.user) {
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }
        const { data: parentUser, error: parentError } = await supabase_js_1.supabase
            .from('parent_users')
            .select(`
        *,
        parent_subscriptions!inner(
          id,
          status,
          current_period_end,
          plan:parent_subscription_plans!inner(name, max_children, max_notifications_per_month)
        )
      `)
            .eq('id', authData.user.id)
            .eq('is_active', true)
            .single();
        if (parentError || !parentUser) {
            res.status(401).json({
                error: 'Parent account not found or inactive'
            });
            return;
        }
        const token = jwt.sign({
            userId: parentUser.id,
            email: parentUser.email,
            userType: 'parent',
            subscriptionStatus: parentUser.parent_subscriptions?.[0]?.status || 'trial',
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: parentUser.id,
            action: 'parent_login',
            resource_type: 'parent_user',
            resource_id: parentUser.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
        });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: parentUser.id,
                email: parentUser.email,
                firstName: parentUser.first_name,
                lastName: parentUser.last_name,
                phone: parentUser.phone,
                emailVerified: parentUser.email_verified,
                subscription: parentUser.parent_subscriptions?.[0] || null,
            },
        });
        return;
    }
    catch (error) {
        console.error('Parent login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/profile', authenticateParent, async (req, res) => {
    try {
        const { data: parentUser, error } = await supabase_js_1.supabase
            .from('parent_users')
            .select(`
        *,
        parent_subscriptions!inner(
          id,
          status,
          current_period_start,
          current_period_end,
          trial_end,
          plan:parent_subscription_plans!inner(name, max_children, max_notifications_per_month, includes_sms)
        ),
        parent_notification_preferences!inner(*),
        children:parent_children(count)
      `)
            .eq('id', req.parent.userId)
            .single();
        if (error) {
            res.status(404).json({ error: 'Parent profile not found' });
            return;
        }
        res.json({
            user: parentUser,
        });
    }
    catch (error) {
        console.error('Get parent profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', authenticateParent, async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const { data: updatedParent, error } = await supabase_js_1.supabase
            .from('parent_users')
            .update({
            first_name: firstName,
            last_name: lastName,
            phone,
            updated_at: new Date(),
        })
            .eq('id', req.parent.userId)
            .select()
            .single();
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        await supabase_js_1.supabase
            .from('parent_activity_logs')
            .insert({
            parent_user_id: req.parent.userId,
            action: 'profile_updated',
            resource_type: 'parent_user',
            resource_id: req.parent.userId,
        });
        res.json({
            message: 'Profile updated successfully',
            user: updatedParent,
        });
    }
    catch (error) {
        console.error('Update parent profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/notification-preferences', authenticateParent, async (req, res) => {
    try {
        const { emailEnabled, smsEnabled, pushEnabled, reminderDaysBefore, reminderTime, timezone, language } = req.body;
        const { data: preferences, error } = await supabase_js_1.supabase
            .from('parent_notification_preferences')
            .update({
            email_enabled: emailEnabled,
            sms_enabled: smsEnabled,
            push_enabled: pushEnabled,
            reminder_days_before: reminderDaysBefore,
            reminder_time: reminderTime,
            timezone,
            language,
            updated_at: new Date(),
        })
            .eq('parent_user_id', req.parent.userId)
            .select()
            .single();
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.json({
            message: 'Notification preferences updated successfully',
            preferences,
        });
    }
    catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
function authenticateParent(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
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
exports.default = router;
//# sourceMappingURL=parent-auth.js.map