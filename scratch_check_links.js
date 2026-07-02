const { createClient } = require('@supabase/supabase-js');
const ws = require('d:/1-Manoj/projects/envitra/envitra-backend/node_modules/ws');
const supabaseUrl = 'https://wqshwbqvkavheefjgvig.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc2h3YnF2a2F2aGVlZmpndmlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIxMDU1OSwiZXhwIjoyMDk1Nzg2NTU5fQ.AsLP2ukzIwP11chS4wxaGG8x1wiG57PyRfxrJasAkEE';
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  realtime: { transport: ws }
});

async function run() {
  console.log("\n=== JOIN QUERY (Corrected) ===");
  const { data: joinData, error: joinError } = await supabase
    .from('profile_links')
    .select(`
      id,
      profile_id,
      link_id,
      sort_order,
      is_active,
      social_links!inner (
        id,
        category,
        platform,
        label,
        url,
        account_id
      )
    `)
    .eq('social_links.account_id', '0bc82b45-6795-42ea-b73c-39571ef51982'); // manoj-sales user account_id

  if (joinError) {
    console.error(joinError);
  } else {
    console.log("Found profile links count:", joinData.length);
    console.log("First 3 links:", joinData.slice(0, 3));
  }
}

run();
