import { supabase } from '../lib/supabase';
import { Task, PendingAction, TaskCategory, TaskPriorityLevel } from '../types/checklist';
import * as checklistCache from '../lib/checklistCache';
import { Trip, HotelReservation, Transport } from '../types';

// =============================================================================
// Smart Checklist Rules
// =============================================================================

interface RuleContext {
    trip: Trip;
    destinations: any[];
    userNationality: string;
    departureDate: Date;
    returnDate: Date;
}

interface GeneratedTask {
    ruleId: string;
    title: string;
    category: TaskCategory;
    priority: TaskPriorityLevel;
    dueDate?: Date;
}

interface ChecklistRule {
    id: string;
    applies(context: RuleContext): boolean;
    generate(context: RuleContext): GeneratedTask[];
}

// Rule: Travel Insurance
class TravelInsuranceRule implements ChecklistRule {
    id = 'travel-insurance';
    applies(ctx: RuleContext): boolean {
        return ctx.destinations.some(d => d.country && d.country.toLowerCase() !== 'brazil' && d.country.toLowerCase() !== 'brasil');
    }
    generate(ctx: RuleContext): GeneratedTask[] {
        const dueDate = new Date(ctx.departureDate);
        dueDate.setDate(dueDate.getDate() - 30);
        return [{
            ruleId: this.id,
            title: 'Contratar seguro viagem internacional',
            category: 'health',
            priority: 'important',
            dueDate
        }];
    }
}

// Rule: Passport Validity
class PassportValidityRule implements ChecklistRule {
    id = 'passport-validity';
    applies(ctx: RuleContext): boolean {
        return ctx.destinations.some(d => d.country && d.country.toLowerCase() !== 'brazil' && d.country.toLowerCase() !== 'brasil');
    }
    generate(ctx: RuleContext): GeneratedTask[] {
        const sixMonthsAfter = new Date(ctx.returnDate);
        sixMonthsAfter.setMonth(sixMonthsAfter.getMonth() + 6);
        const dueDate = new Date(ctx.departureDate);
        dueDate.setDate(dueDate.getDate() - 60);
        return [{
            ruleId: this.id,
            title: `Verificar validade do passaporte (deve ser válido até ${sixMonthsAfter.toLocaleDateString('pt-BR')})`,
            category: 'documentation',
            priority: 'blocking',
            dueDate
        }];
    }
}

// Rule: ESTA/Visa for USA
class ESTARule implements ChecklistRule {
    id = 'esta-visa-usa';
    applies(ctx: RuleContext): boolean {
        const hasUSA = ctx.destinations.some(d =>
            d.country?.toLowerCase().includes('united states') ||
            d.country?.toLowerCase().includes('usa') ||
            d.country?.toLowerCase().includes('estados unidos')
        );
        return hasUSA && ctx.userNationality === 'BR';
    }
    generate(ctx: RuleContext): GeneratedTask[] {
        const dueDate = new Date(ctx.departureDate);
        dueDate.setDate(dueDate.getDate() - 45);
        return [{
            ruleId: this.id,
            title: 'Solicitar visto americano ou verificar elegibilidade para ESTA',
            category: 'documentation',
            priority: 'blocking',
            dueDate
        }];
    }
}

// Rule: Schengen Insurance
class SchengenInsuranceRule implements ChecklistRule {
    id = 'schengen-insurance';
    private schengenCountries = [
        'austria', 'belgium', 'czech republic', 'denmark', 'estonia', 'finland',
        'france', 'germany', 'greece', 'hungary', 'iceland', 'italy', 'latvia',
        'liechtenstein', 'lithuania', 'luxembourg', 'malta', 'netherlands',
        'norway', 'poland', 'portugal', 'slovakia', 'slovenia', 'spain',
        'sweden', 'switzerland',
        'áustria', 'bélgica', 'república tcheca', 'dinamarca', 'estônia', 'finlândia',
        'frança', 'alemanha', 'grécia', 'hungria', 'islândia', 'itália', 'letônia',
        'lituânia', 'luxemburgo', 'holanda', 'países baixos',
        'noruega', 'polônia', 'eslováquia', 'eslovênia', 'espanha',
        'suécia', 'suíça'
    ];
    applies(ctx: RuleContext): boolean {
        return ctx.destinations.some(d => {
            const country = d.country?.toLowerCase() || '';
            return this.schengenCountries.some(sc => country.includes(sc));
        });
    }
    generate(ctx: RuleContext): GeneratedTask[] {
        const dueDate = new Date(ctx.departureDate);
        dueDate.setDate(dueDate.getDate() - 30);
        return [{
            ruleId: this.id,
            title: 'Contratar seguro viagem com cobertura mínima de €30.000 (exigência Schengen)',
            category: 'health',
            priority: 'blocking',
            dueDate
        }];
    }
}

const ACTIVE_RULES: ChecklistRule[] = [
    new TravelInsuranceRule(),
    new PassportValidityRule(),
    new ESTARule(),
    new SchengenInsuranceRule()
];

// =============================================================================
// Reservation-Based Task Generation (Check-in, Checkout, Boarding)
// =============================================================================

interface ReservationTasksContext {
    tripId: string;
    accommodations: HotelReservation[];
    transports: Transport[];
}

/**
 * Generate tasks based on reservations (hotels and transports)
 */
export const generateReservationTasks = (context: ReservationTasksContext): Task[] => {
    const tasks: Task[] = [];

    // Generate hotel check-in/checkout tasks
    for (const hotel of context.accommodations) {
        // Check-in reminder
        if (hotel.checkIn) {
            const checkInDate = parseCheckInDate(hotel.checkIn);
            if (checkInDate) {
                tasks.push({
                    id: crypto.randomUUID(),
                    trip_id: context.tripId,
                    title: `Check-in: ${hotel.name}`,
                    category: 'reservations',
                    priority: 'important',
                    rule_id: `hotel-checkin-${hotel.id}`,
                    is_completed: false,
                    is_urgent: false,
                    due_date: checkInDate.toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }

        // Check-out reminder
        if (hotel.checkOut) {
            const checkOutDate = parseCheckInDate(hotel.checkOut);
            if (checkOutDate) {
                tasks.push({
                    id: crypto.randomUUID(),
                    trip_id: context.tripId,
                    title: `Check-out: ${hotel.name}`,
                    category: 'reservations',
                    priority: 'important',
                    rule_id: `hotel-checkout-${hotel.id}`,
                    is_completed: false,
                    is_urgent: false,
                    due_date: checkOutDate.toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }
    }

    // Generate transport boarding tasks
    for (const transport of context.transports) {
        if (transport.departureDate) {
            const departureDate = new Date(transport.departureDate);
            if (!isNaN(departureDate.getTime())) {
                const transportLabel = transport.type === 'flight' ? 'Embarque voo' :
                    transport.type === 'train' ? 'Embarque trem' :
                        transport.type === 'bus' ? 'Embarque onibus' : 'Transporte';

                const reference = transport.reference || transport.operator || '';

                tasks.push({
                    id: crypto.randomUUID(),
                    trip_id: context.tripId,
                    title: `${transportLabel}: ${reference}`,
                    category: 'reservations',
                    priority: 'blocking',
                    rule_id: `transport-boarding-${transport.id}`,
                    is_completed: false,
                    is_urgent: true,
                    due_date: departureDate.toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }
    }

    return tasks;
};

/**
 * Helper to parse check-in date (handles "DD/MM/YYYY" or "YYYY-MM-DD")
 */
function parseCheckInDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try DD/MM/YYYY format
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) return date;
        }
    }

    // Try ISO format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    return null;
}

/**
 * Parse date string that can be in DD/MM/YYYY or ISO format
 */
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Try DD/MM/YYYY format first
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) return date;
        }
    }

    // Try ISO/standard format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    return null;
};

/**
 * Generate smart tasks based on trip data
 */
export const generateSmartTasks = async (trip: Trip, userNationality: string = 'BR'): Promise<Task[]> => {
    const destinations = trip.detailedDestinations || [];
    const departureDate = parseDateString(trip.startDate);
    const returnDate = parseDateString(trip.endDate);

    // Validate dates - return empty array if dates are invalid
    if (!departureDate || !returnDate) {
        console.warn('generateSmartTasks: Invalid trip dates, skipping task generation', {
            startDate: trip.startDate,
            endDate: trip.endDate
        });
        return [];
    }

    const context: RuleContext = {
        trip,
        destinations,
        userNationality,
        departureDate,
        returnDate
    };

    const generatedTasks: Task[] = [];

    for (const rule of ACTIVE_RULES) {
        if (rule.applies(context)) {
            const tasks = rule.generate(context);
            for (const task of tasks) {
                // Validate dueDate before converting to ISO string
                const dueDateStr = task.dueDate && !isNaN(task.dueDate.getTime())
                    ? task.dueDate.toISOString().split('T')[0]
                    : undefined;

                generatedTasks.push({
                    id: crypto.randomUUID(),
                    trip_id: trip.id,
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    rule_id: task.ruleId,
                    is_completed: false,
                    is_urgent: task.priority === 'blocking',
                    due_date: dueDateStr,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }
    }

    return generatedTasks;
};

/**
 * Sync smart tasks with database
 * - Inserts new rule-based tasks that don't exist yet
 * - Preserves manual tasks and completion status
 */
export const syncSmartTasks = async (tripId: string, trip: Trip): Promise<void> => {
    // Generate tasks based on rules
    const generatedTasks = await generateSmartTasks(trip);
    const generatedRuleIds = new Set(generatedTasks.map(t => t.rule_id).filter(Boolean) as string[]);

    // Fetch existing tasks
    const existingTasks = await fetchRemoteTasks(tripId);
    const existingRuleIds = new Set(existingTasks.filter(t => t.rule_id).map(t => t.rule_id));

    // 1. Insert new rule-based tasks
    const tasksToInsert = generatedTasks.filter(task => task.rule_id && !existingRuleIds.has(task.rule_id));

    if (tasksToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('trip_checklist_items')
            .insert(tasksToInsert.map(task => ({
                id: task.id,
                trip_id: task.trip_id,
                text: task.title, // Mapping title to text column
                category: task.category,
                priority: task.priority,
                rule_id: task.rule_id,
                is_completed: task.is_completed, // DB uses 'is_completed'
                due_date: task.due_date
            })));

        if (insertError) {
            console.error('Error syncing smart tasks (insert):', insertError);
            throw insertError;
        }
    }

    // 2. Remove obsolete rule-based tasks (Rule exists in DB but not in generated list)
    // We only remove tasks that have a rule_id (auto-generated) AND that are not completed (optional safety)
    // But logically, if the rule doesn't apply (e.g. no longer going to USA), we should probably remove it even if pending.
    // Use existingTasks to filter.
    const tasksToRemove = existingTasks.filter(t => t.rule_id && !generatedRuleIds.has(t.rule_id));

    if (tasksToRemove.length > 0) {
        const idsToRemove = tasksToRemove.map(t => t.id);
        const { error: deleteError } = await supabase
            .from('trip_checklist_items')
            .delete()
            .in('id', idsToRemove);

        if (deleteError) {
            console.error('Error syncing smart tasks (cleanup):', deleteError);
            throw deleteError;
        }
    }
};

// Fetch tasks from Supabase and update local cache
export const fetchRemoteTasks = async (tripId: string): Promise<Task[]> => {
    const { data, error } = await supabase
        .from('trip_checklist_items')
        .select('*')
        .eq('trip_id', tripId);

    if (error) {
        console.error('Error fetching remote tasks:', error);
        throw error;
    }

    if (data) {
        if (data.length > 0) {
            console.log('DEBUG: trip_checklist_items raw row:', data[0]);
        }
        // Map DB record (text) to Task object (title)
        const mappedTasks: Task[] = (data as any[]).map(row => ({
            id: row.id,
            trip_id: row.trip_id,
            title: row.text, // Database text -> Interface title
            category: row.category,
            priority: row.priority,
            rule_id: row.rule_id,
            is_completed: row.is_completed, // DB 'is_completed' -> Interface 'is_completed'
            is_urgent: row.priority === 'blocking', // Derive is_urgent from priority
            due_date: row.due_date,
            created_at: row.created_at,
            updated_at: row.updated_at
        }));

        // Update cache with fresh data
        await checklistCache.saveTasks(mappedTasks);
        return mappedTasks;
    }
    return [];
};

// Push a single action to Supabase
const processAction = async (action: PendingAction): Promise<void> => {
    const { type, payload } = action;

    switch (type) {
        case 'ADD': {
            // Explicitly map fields to match schema 'trip_checklist_items'
            const dbPayload = {
                id: payload.id,
                trip_id: payload.trip_id,
                text: payload.title, // Map title to text
                category: payload.category || 'other',
                priority: payload.priority || 'recommended',
                is_completed: payload.is_completed || false, // DB uses 'is_completed'
                due_date: payload.due_date,
                rule_id: payload.rule_id
            };

            const { error: addError } = await supabase
                .from('trip_checklist_items')
                .insert(dbPayload);
            if (addError) throw addError;
            break;
        }

        case 'UPDATE': {
            // Explicitly pick allowed fields
            const dbUpdates: any = {};
            if (payload.title !== undefined) dbUpdates.text = payload.title;
            if (payload.category !== undefined) dbUpdates.category = payload.category;
            if (payload.priority !== undefined) dbUpdates.priority = payload.priority;
            if (payload.is_completed !== undefined) dbUpdates.is_completed = payload.is_completed; // DB uses 'is_completed'
            if (payload.due_date !== undefined) dbUpdates.due_date = payload.due_date;
            if (payload.rule_id !== undefined) dbUpdates.rule_id = payload.rule_id;

            const { error: updateError } = await supabase
                .from('trip_checklist_items')
                .update(dbUpdates)
                .eq('id', payload.id);
            if (updateError) throw updateError;
            break;
        }

        case 'DELETE':
            const { error: deleteError } = await supabase
                .from('trip_checklist_items')
                .delete()
                .eq('id', payload.id);
            if (deleteError) throw deleteError;
            break;
    }
};

// Sync Pending Actions: Push local changes to server
export const syncPendingActions = async (): Promise<void> => {
    const actions = await checklistCache.getPendingActions();
    if (actions.length === 0) return;

    console.log(`Syncing ${actions.length} pending checklist actions...`);

    for (const action of actions) {
        try {
            await processAction(action);
            // If successful, remove from queue
            await checklistCache.removePendingAction(action.id);
        } catch (error: any) {
            console.error(`Failed to process action ${action.id}:`, error);

            // Handle permanent errors - remove from queue to avoid blocking
            const errorCode = error?.code;
            const isPermanentError =
                errorCode === '23503' || // FK violation (trip deleted)
                errorCode === '22P02' || // Invalid enum value
                errorCode === 'PGRST204' || // Column not found
                errorCode === 'PGRST205';   // Table not found

            if (isPermanentError) {
                console.warn(`Removing orphaned/invalid action ${action.id} (error: ${errorCode})`);
                await checklistCache.removePendingAction(action.id);
                continue; // Continue processing other actions
            }

            // For transient errors, stop and retry later
            break;
        }
    }
};

// Full Sync Routine (Enhanced with Smart Tasks)
export const syncChecklist = async (tripId: string, trip?: Trip): Promise<Task[]> => {
    // 1. Push local changes first
    await syncPendingActions();

    // 2. Sync smart tasks if trip data is provided
    if (trip) {
        await syncSmartTasks(tripId, trip);
    }

    // 3. Pull latest data
    return await fetchRemoteTasks(tripId);
};

