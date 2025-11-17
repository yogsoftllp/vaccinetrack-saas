"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_js_1 = require("../lib/supabase.js");
const vaccinationScheduleGenerator_js_1 = require("../services/vaccinationScheduleGenerator.js");
const router = (0, express_1.Router)();
router.post('/setup-demo', async (req, res) => {
    try {
        console.log('Setting up demo parent data...');
        const { data: existingDemo } = await supabase_js_1.supabase
            .from('parents')
            .select('id')
            .eq('email', 'demo.parent@vaccinetrack.com')
            .single();
        if (existingDemo) {
            await supabase_js_1.supabase
                .from('children')
                .delete()
                .eq('parent_id', existingDemo.id);
            await supabase_js_1.supabase
                .from('vaccination_schedules')
                .delete()
                .eq('parent_id', existingDemo.id);
            await supabase_js_1.supabase
                .from('parent_subscriptions')
                .delete()
                .eq('parent_id', existingDemo.id);
            await supabase_js_1.supabase
                .from('parents')
                .delete()
                .eq('id', existingDemo.id);
        }
        const saltRounds = 12;
        const passwordHash = await bcryptjs_1.default.hash('DemoParent123!', saltRounds);
        const { data: demoParent, error: parentError } = await supabase_js_1.supabase
            .from('parents')
            .insert({
            email: 'demo.parent@vaccinetrack.com',
            password_hash: passwordHash,
            first_name: 'Sarah',
            last_name: 'Johnson',
            phone: '+1-555-0123',
            city: 'San Francisco',
            state: 'California',
            country: 'US',
            postal_code: '94102',
            timezone: 'America/Los_Angeles',
            locale: 'en-US',
            is_active: true
        })
            .select()
            .single();
        if (parentError) {
            throw new Error(`Failed to create demo parent: ${parentError.message}`);
        }
        const { data: freePlan } = await supabase_js_1.supabase
            .from('parent_subscription_plans')
            .select('id')
            .eq('name', 'Free')
            .single();
        if (freePlan) {
            await supabase_js_1.supabase
                .from('parent_subscriptions')
                .insert({
                parent_id: demoParent.id,
                plan_id: freePlan.id,
                status: 'active'
            });
        }
        const demoChildren = [
            {
                firstName: 'Emma',
                lastName: 'Johnson',
                dateOfBirth: '2022-03-15',
                gender: 'female',
                bloodType: 'A+',
                city: 'San Francisco',
                state: 'California',
                country: 'US',
                allergies: ['Penicillin'],
                medicalConditions: [],
                birthWeight: 3.2,
                birthHeight: 50
            },
            {
                firstName: 'Liam',
                lastName: 'Johnson',
                dateOfBirth: '2023-08-22',
                gender: 'male',
                bloodType: 'O+',
                city: 'San Francisco',
                state: 'California',
                country: 'US',
                allergies: [],
                medicalConditions: [],
                birthWeight: 3.5,
                birthHeight: 52
            },
            {
                firstName: 'Olivia',
                lastName: 'Johnson',
                dateOfBirth: '2021-11-05',
                gender: 'female',
                bloodType: 'B+',
                city: 'San Francisco',
                state: 'California',
                country: 'US',
                allergies: ['Eggs'],
                medicalConditions: ['Asthma'],
                birthWeight: 2.8,
                birthHeight: 48
            }
        ];
        for (const childData of demoChildren) {
            const { data: child, error: childError } = await supabase_js_1.supabase
                .from('children')
                .insert({
                parent_id: demoParent.id,
                first_name: childData.firstName,
                last_name: childData.lastName,
                date_of_birth: childData.dateOfBirth,
                gender: childData.gender,
                blood_type: childData.bloodType,
                city: childData.city,
                state: childData.state,
                country: childData.country,
                allergies: childData.allergies,
                medical_conditions: childData.medicalConditions,
                birth_weight: childData.birthWeight,
                birth_height: childData.birthHeight,
                is_active: true
            })
                .select()
                .single();
            if (childError) {
                console.error(`Failed to create child ${childData.firstName}:`, childError);
                continue;
            }
            try {
                const schedule = await vaccinationScheduleGenerator_js_1.vaccinationScheduleGenerator.generateSchedule({
                    id: child.id,
                    first_name: childData.firstName,
                    last_name: childData.lastName,
                    date_of_birth: childData.dateOfBirth,
                    gender: childData.gender || 'other'
                }, {
                    country_code: childData.country || 'US',
                    region_code: childData.state,
                    include_optional: true
                });
                for (const vaccineSchedule of schedule) {
                    for (const vaccine of vaccineSchedule.vaccinations) {
                        await supabase_js_1.supabase
                            .from('vaccination_schedules')
                            .insert({
                            parent_id: demoParent.id,
                            child_id: child.id,
                            vaccine_name: vaccine.name,
                            vaccine_code: vaccine.code,
                            due_date: vaccine.dueDate,
                            status: vaccine.status || 'scheduled',
                            dose_number: vaccine.doseNumber,
                            total_doses: vaccine.totalDoses,
                            notes: vaccine.notes || '',
                            created_at: new Date().toISOString()
                        });
                    }
                }
                console.log(`Created schedule for ${childData.firstName} with ${schedule.length} vaccine schedules`);
            }
            catch (scheduleError) {
                console.error(`Failed to generate schedule for ${childData.firstName}:`, scheduleError);
            }
        }
        const { data: allSchedules } = await supabase_js_1.supabase
            .from('vaccination_schedules')
            .select('*')
            .eq('parent_id', demoParent.id);
        if (allSchedules) {
            const completedVaccines = allSchedules.slice(0, Math.floor(allSchedules.length * 0.4));
            for (const vaccine of completedVaccines) {
                await supabase_js_1.supabase
                    .from('vaccination_schedules')
                    .update({
                    status: 'completed',
                    completed_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
                })
                    .eq('id', vaccine.id);
            }
            const overdueVaccines = allSchedules.slice(Math.floor(allSchedules.length * 0.7), Math.floor(allSchedules.length * 0.8));
            for (const vaccine of overdueVaccines) {
                await supabase_js_1.supabase
                    .from('vaccination_schedules')
                    .update({
                    status: 'overdue'
                })
                    .eq('id', vaccine.id);
            }
        }
        const notifications = [
            {
                parent_id: demoParent.id,
                type: 'vaccination_reminder',
                title: 'Vaccination Reminder',
                message: 'Emma is due for MMR vaccine next week',
                is_read: false
            },
            {
                parent_id: demoParent.id,
                type: 'schedule_update',
                title: 'Schedule Updated',
                message: 'Liam\'s vaccination schedule has been updated based on CDC guidelines',
                is_read: true
            }
        ];
        for (const notification of notifications) {
            await supabase_js_1.supabase
                .from('parent_notifications')
                .insert(notification);
        }
        const token = jsonwebtoken_1.default.sign({
            userId: demoParent.id,
            email: demoParent.email,
            userType: 'parent',
            role: 'parent'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log('Demo data setup completed successfully!');
        res.json({
            success: true,
            message: 'Demo data created successfully',
            data: {
                parent: {
                    id: demoParent.id,
                    email: demoParent.email,
                    firstName: demoParent.first_name,
                    lastName: demoParent.last_name,
                    phone: demoParent.phone,
                    city: demoParent.city,
                    state: demoParent.state,
                    country: demoParent.country
                },
                loginCredentials: {
                    email: 'demo.parent@vaccinetrack.com',
                    password: 'DemoParent123!'
                },
                token: token,
                accessUrls: {
                    landing: 'http://localhost:5177/',
                    parentDashboard: 'http://localhost:5177/parent/dashboard',
                    parentLogin: 'http://localhost:5177/',
                    clinicLogin: 'http://localhost:5177/clinic-login'
                }
            }
        });
    }
    catch (error) {
        console.error('Demo setup error:', error);
        res.status(500).json({
            error: 'Failed to setup demo data',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=demo-setup.js.map