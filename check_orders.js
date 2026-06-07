const { createClient } = require('@supabase/supabase-js');
const ws = require('d:/1-Manoj/projects/envitra/envitra-backend/node_modules/ws');
const supabaseUrl = 'https://wqshwbqvkavheefjgvig.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc2h3YnF2a2F2aGVlZmpndmlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIxMDU1OSwiZXhwIjoyMDk1Nzg2NTU5fQ.AsLP2ukzIwP11chS4wxaGG8x1wiG57PyRfxrJasAkEE';
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  realtime: { transport: ws }
});
async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(3);
  if (error) console.error(error);
  else console.log(data);
}
run();
