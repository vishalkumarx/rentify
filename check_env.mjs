import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
console.log("URL:", process.env.VITE_SUPABASE_URL);
