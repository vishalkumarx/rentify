import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getStorageJson = async (path: string) => {
  try {
    const { data } = supabase.storage.from('item-images').getPublicUrl(path);
    const res = await fetch(`${data.publicUrl}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const setStorageJson = async (path: string, json: any) => {
  try {
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    const { error } = await supabase.storage.from('item-images').upload(path, blob, { upsert: true });
    return !error;
  } catch (e) {
    return false;
  }
};
