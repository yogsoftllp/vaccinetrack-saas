"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaccinationScheduleGenerator = exports.VaccinationScheduleGenerator = void 0;
const supabase_1 = require("../lib/supabase");
class VaccinationScheduleGenerator {
    async generateSchedule(child, options) {
        try {
            const guidelines = await this.getVaccinationGuidelines(options);
            const currentAgeMonths = this.calculateAgeInMonths(child.date_of_birth);
            const schedule = await this.createScheduleFromGuidelines(child, guidelines, currentAgeMonths, options);
            const existingRecords = await this.getExistingVaccinationRecords(child.id);
            const filteredSchedule = this.filterOutCompletedVaccines(schedule, existingRecords);
            return filteredSchedule.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        }
        catch (error) {
            console.error('Error generating vaccination schedule:', error);
            throw new Error('Failed to generate vaccination schedule');
        }
    }
    async getVaccinationGuidelines(options) {
        let query = supabase_1.supabase
            .from('vaccination_guidelines')
            .select('*')
            .eq('country_code', options.country_code)
            .eq('is_active', true)
            .order('recommended_age_months', { ascending: true });
        if (options.region_code) {
            query = query.or(`region_code.is.null,region_code.eq.${options.region_code}`);
        }
        if (!options.include_optional) {
            query = query.eq('is_mandatory', true);
        }
        if (options.exclude_vaccines && options.exclude_vaccines.length > 0) {
            query = query.not('vaccine_code', 'in', `(${options.exclude_vaccines.join(',')})`);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch vaccination guidelines: ${error.message}`);
        }
        return data || [];
    }
    calculateAgeInMonths(dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
        months += today.getMonth() - birthDate.getMonth();
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }
        return Math.max(0, months);
    }
    async createScheduleFromGuidelines(child, guidelines, currentAgeMonths, options) {
        const schedule = [];
        const birthDate = new Date(child.date_of_birth);
        for (const guideline of guidelines) {
            const dueDate = new Date(birthDate);
            dueDate.setMonth(dueDate.getMonth() + guideline.recommended_age_months);
            if (guideline.max_age_months && currentAgeMonths > guideline.max_age_months) {
                continue;
            }
            if (this.hasContraindications(child, guideline)) {
                continue;
            }
            const today = new Date();
            let status = 'upcoming';
            if (today > dueDate) {
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                status = daysOverdue > 30 ? 'overdue' : 'due';
            }
            schedule.push({
                child_id: child.id,
                vaccine_name: guideline.vaccine_name,
                vaccine_code: guideline.vaccine_code,
                recommended_age_months: guideline.recommended_age_months,
                due_date: dueDate.toISOString().split('T')[0],
                min_age_months: guideline.min_age_months,
                max_age_months: guideline.max_age_months,
                dose_number: guideline.dose_number,
                total_doses: guideline.total_doses,
                is_mandatory: guideline.is_mandatory,
                status,
                notes: guideline.notes
            });
        }
        return schedule;
    }
    hasContraindications(child, guideline) {
        if (!guideline.contraindications || guideline.contraindications.length === 0) {
            return false;
        }
        if (child.allergies && child.allergies.length > 0) {
            for (const allergy of child.allergies) {
                if (guideline.contraindications.some(contra => contra.toLowerCase().includes(allergy.toLowerCase()))) {
                    return true;
                }
            }
        }
        if (child.medical_conditions && child.medical_conditions.length > 0) {
            for (const condition of child.medical_conditions) {
                if (guideline.contraindications.some(contra => contra.toLowerCase().includes(condition.toLowerCase()))) {
                    return true;
                }
            }
        }
        return false;
    }
    async getExistingVaccinationRecords(childId) {
        const { data, error } = await supabase_1.supabase
            .from('parent_vaccination_records')
            .select('*')
            .eq('child_id', childId)
            .order('vaccination_date', { ascending: true });
        if (error) {
            console.error('Error fetching vaccination records:', error);
            return [];
        }
        return data || [];
    }
    filterOutCompletedVaccines(schedule, existingRecords) {
        return schedule.filter(item => {
            const isCompleted = existingRecords.some(record => record.vaccine_code === item.vaccine_code &&
                record.dose_number === item.dose_number);
            return !isCompleted;
        });
    }
    async saveScheduleToDatabase(schedule) {
        try {
            const { error } = await supabase_1.supabase
                .from('vaccination_schedules')
                .upsert(schedule, { onConflict: 'child_id,vaccine_code,dose_number' });
            if (error) {
                throw new Error(`Failed to save schedule: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error saving schedule to database:', error);
            throw error;
        }
    }
    async generateCatchUpSchedule(child, missedVaccines, options) {
        try {
            const guidelines = await this.getVaccinationGuidelines(options);
            const catchUpGuidelines = guidelines.filter(guideline => missedVaccines.includes(guideline.vaccine_code));
            const currentAgeMonths = this.calculateAgeInMonths(child.date_of_birth);
            const schedule = await this.createScheduleFromGuidelines(child, catchUpGuidelines, currentAgeMonths, options);
            return this.adjustCatchUpTiming(schedule, currentAgeMonths);
        }
        catch (error) {
            console.error('Error generating catch-up schedule:', error);
            throw new Error('Failed to generate catch-up vaccination schedule');
        }
    }
    adjustCatchUpTiming(schedule, currentAgeMonths) {
        const today = new Date();
        const adjustedSchedule = [...schedule];
        const vaccineGroups = new Map();
        for (const item of adjustedSchedule) {
            if (!vaccineGroups.has(item.vaccine_code)) {
                vaccineGroups.set(item.vaccine_code, []);
            }
            vaccineGroups.get(item.vaccine_code).push(item);
        }
        for (const [vaccineCode, items] of vaccineGroups) {
            if (items.length > 1) {
                let nextDate = new Date(today);
                for (let i = 0; i < items.length; i++) {
                    if (i > 0) {
                        nextDate.setDate(nextDate.getDate() + 28);
                    }
                    items[i].due_date = nextDate.toISOString().split('T')[0];
                    items[i].status = 'due';
                }
            }
            else {
                items[0].due_date = today.toISOString().split('T')[0];
                items[0].status = 'due';
            }
        }
        return adjustedSchedule.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
    async getUpcomingVaccinations(childId, daysAhead = 30) {
        try {
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + daysAhead);
            const { data, error } = await supabase_1.supabase
                .from('vaccination_schedules')
                .select('*')
                .eq('child_id', childId)
                .gte('due_date', today.toISOString().split('T')[0])
                .lte('due_date', futureDate.toISOString().split('T')[0])
                .order('due_date', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch upcoming vaccinations: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error('Error fetching upcoming vaccinations:', error);
            throw error;
        }
    }
}
exports.VaccinationScheduleGenerator = VaccinationScheduleGenerator;
exports.vaccinationScheduleGenerator = new VaccinationScheduleGenerator();
//# sourceMappingURL=vaccinationScheduleGenerator.js.map