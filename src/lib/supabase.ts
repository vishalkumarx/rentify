import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getStorageJson = async (path: string) => {
  try {
    // We use the public URL directly with a cache buster instead of .download(). 
    // .download() uses a GET request that gets heavily cached by browsers and the Supabase CDN,
    // which prevents chat messages from syncing in real-time.
    const { data: publicData } = supabase.storage.from('item-images').getPublicUrl(path);
    
    if (publicData?.publicUrl) {
      // Append timestamp to bypass ALL browser and CDN caches
      const res = await fetch(`${publicData.publicUrl}?t=${Date.now()}`, {
        cache: 'no-store', // Extra protection against browser caching
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        return await res.json();
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const setStorageJson = async (path: string, json: any) => {
  try {
    const jsonString = JSON.stringify(json);
    let { error } = await supabase.storage.from('item-images').upload(path, jsonString, { 
      contentType: 'application/json',
      upsert: true 
    });
    
    // Fallback if upsert fails (sometimes RLS policies block upsert but allow normal upload for new files)
    if (error) {
      console.warn('Supabase upload with upsert failed for path:', path, error.message, 'Trying without upsert...');
      const { error: fallbackError } = await supabase.storage.from('item-images').upload(path, jsonString, {
        contentType: 'application/json',
        upsert: false
      });
      if (!fallbackError) {
        error = null as any;
      } else {
        // If it still fails, it might be an update to an existing file where we need .update()
        const { error: updateError } = await supabase.storage.from('item-images').update(path, jsonString, {
          contentType: 'application/json',
          upsert: false
        });
        if (!updateError) {
          error = null as any;
        } else {
          error = updateError;
          console.error('Supabase upload/update error for path:', path, updateError);
        }
      }
    }
    
    if (error) {
      alert(`Backend Error: Failed to save message. ${error.message || 'Unknown error'}`);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error('Exception in setStorageJson:', e);
    alert(`Exception: Failed to save message. ${e.message || 'Unknown error'}`);
    return false;
  }
};
