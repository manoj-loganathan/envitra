const { createClient } = require('@supabase/supabase-js');
const ws = require('d:/1-Manoj/projects/envitra/envitra-backend/node_modules/ws');
const supabaseUrl = 'https://wqshwbqvkavheefjgvig.supabase.co';
const exactKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc2h3YnF2a2F2aGVlZmpndmlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIxMDU1OSwiZXhwIjoyMDk1Nzg2NTU5fQ.AsLP2ukzIwP11chS4wxaGG8x1wiG57PyRfxrJasAkEE';

const supabase = createClient(supabaseUrl, exactKey, {
  realtime: { transport: ws }
});

async function checkPending() {
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('status', 'pending_production');

  if (ordersErr) {
    console.error(ordersErr);
    return;
  }

  console.log(`Found ${orders.length} pending_production orders:`);
  for (const order of orders) {
    console.log(`Order: ${order.order_number}, ID: ${order.id}`);
    console.log(`- Account ID: ${order.account_id}`);
    
    // Check if account exists
    if (order.account_id) {
      const { data: account, error: accErr } = await supabase
        .from('accounts')
        .select('id, email')
        .eq('id', order.account_id)
        .maybeSingle();
      if (accErr) console.error("  Account query error:", accErr);
      else if (!account) console.log("  WARNING: Account does NOT exist in accounts table!");
      else console.log(`  Account exists: ${account.email}`);
    } else {
      console.log("  Account ID is null!");
    }

    // Check if order items exist
    console.log(`- Items count: ${order.order_items.length}`);
    for (const item of order.order_items) {
      console.log(`  - Item ID: ${item.id}, qty: ${item.quantity}`);
    }
  }
}

checkPending();
