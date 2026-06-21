-- Add VENDOR value to the Location enum
ALTER TYPE "Location" ADD VALUE IF NOT EXISTS 'VENDOR';
