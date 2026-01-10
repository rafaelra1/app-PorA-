import { getStorageService } from '../services/storageService';

/**
 * Initialize Supabase Storage bucket for images
 * Call this once when the app starts
 */
export async function initializeStorage(): Promise<void> {
  try {
    console.log('🔄 Initializing Supabase Storage...');
    const storageService = getStorageService();
    const success = await storageService.initializeBucket();

    if (success) {
      console.log('✅ Supabase Storage initialized successfully');
    } else {
      console.warn('⚠️ Failed to initialize Supabase Storage bucket');
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
}

export default initializeStorage;
