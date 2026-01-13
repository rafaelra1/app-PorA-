-- Migration: Fix checklist enums
-- Add missing values to category and priority enums

-- Category enum fixes (add ALL expected values)
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'documentation';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'health';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'reservations';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'packing';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'financial';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'tech';
ALTER TYPE checklist_task_category ADD VALUE IF NOT EXISTS 'other';

-- Priority enum fixes
ALTER TYPE checklist_task_priority ADD VALUE IF NOT EXISTS 'blocking';
ALTER TYPE checklist_task_priority ADD VALUE IF NOT EXISTS 'important';
ALTER TYPE checklist_task_priority ADD VALUE IF NOT EXISTS 'recommended';
