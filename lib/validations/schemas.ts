import { z } from 'zod';

export const tripSchema = z.object({
    title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
    destination: z.string().min(2, 'O destino é obrigatório'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['planning', 'confirmed', 'completed']),
    coverImage: z.string().optional(),
    isFlexibleDates: z.boolean().default(false),
    participants: z.array(z.any()).default([]),
    detailedDestinations: z.array(z.any()).default([]),
}).refine(data => {
    if (data.isFlexibleDates) return true;
    if (!data.startDate || !data.endDate) return false;
    return new Date(data.endDate) >= new Date(data.startDate);
}, {
    message: 'A data de fim deve ser após a data de início',
    path: ['endDate'],
});

export const expenseSchema = z.object({
    title: z.string().min(1, 'O título é obrigatório'),
    amount: z.coerce.number().positive('O valor deve ser positivo'),
    date: z.string().min(1, 'A data é obrigatória'),
    category: z.string().default('outros'),
    type: z.enum(['entrada', 'saida']).default('saida'),
    description: z.string().optional(),
    paymentMethod: z.string().optional(),
});

export const eventSchema = z.object({
    title: z.string().min(1, 'O título é obrigatório'),
    date: z.string().min(1, 'A data é obrigatória'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean().default(false),
    description: z.string().optional(),
    type: z.string().default('activity'),
    tripId: z.string().optional(),
    location: z.string().optional(),
    reminder: z.number().default(30),
}).refine(data => {
    if (data.allDay || !data.startTime || !data.endTime) return true;
    return data.endTime > data.startTime;
}, {
    message: 'A hora de fim deve ser após a hora de início',
    path: ['endTime'],
});
