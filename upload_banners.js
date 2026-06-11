import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import https from 'https';

const SUPABASE_URL = "https://mbpsmzdmqpeeolosjexr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icHNtemRtcXBlZW9sb3NqZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTE4ODEsImV4cCI6MjA5NjU2Nzg4MX0.YlORN3-fynTuG7OslRPdPGsB1un8OvMFRDr57nZ7xSg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode > 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
      } else {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', (err) => { fs.unlink(dest, () => reject(err)); });
  });
};

async function run() {
  const file1 = 'banner1.jpg';
  const file2 = 'banner2.jpg';
  
  console.log("Downloading files...");
  await downloadFile('https://drive.google.com/uc?export=download&id=1ikgSUapo1mOajsYAJEcxCkiXP1HeTsPI', file1);
  await downloadFile('https://drive.google.com/uc?export=download&id=1zdQ7OJA9l1oNhbTBNTW2OWGtegRSbAhC', file2);
  
  console.log("Uploading to Supabase...");
  const buffer1 = fs.readFileSync(file1);
  const buffer2 = fs.readFileSync(file2);

  const res1 = await supabase.storage.from('item-images').upload('reviews/banner1.jpg', buffer1, { contentType: 'image/jpeg', upsert: true });
  console.log("Upload 1:", res1.data || res1.error);
  
  const res2 = await supabase.storage.from('item-images').upload('reviews/banner2.jpg', buffer2, { contentType: 'image/jpeg', upsert: true });
  console.log("Upload 2:", res2.data || res2.error);
  
  const url1 = supabase.storage.from('item-images').getPublicUrl('reviews/banner1.jpg').data.publicUrl;
  const url2 = supabase.storage.from('item-images').getPublicUrl('reviews/banner2.jpg').data.publicUrl;
  
  console.log("URLs:");
  console.log(url1);
  console.log(url2);
}

run().catch(console.error);
