// Script to delete all TreatmentSession and TreatmentPlan records
const BASE = 'http://localhost:5000/api';

async function getToken() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@clinica.com', password: 'Admin123!' }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Login failed: ' + JSON.stringify(data));
  return data.data.token;
}

async function deleteAll() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Get all sessions
  const sessRes = await fetch(`${BASE}/sessions?limit=1000`, { headers });
  const sessData = await sessRes.json();
  const sessions = sessData.data?.sessions ?? [];
  console.log(`Found ${sessions.length} sessions`);
  for (const s of sessions) {
    await fetch(`${BASE}/sessions/${s.id}`, { method: 'DELETE', headers });
    process.stdout.write('.');
  }
  if (sessions.length) console.log('\nSessions deleted.');

  // Get all treatment plans
  const plansRes = await fetch(`${BASE}/treatment-plans?limit=1000`, { headers });
  const plansData = await plansRes.json();
  const plans = plansData.data?.treatmentPlans ?? plansData.data ?? [];
  console.log(`Found ${Array.isArray(plans) ? plans.length : 0} treatment plans`);
  if (Array.isArray(plans)) {
    for (const p of plans) {
      await fetch(`${BASE}/treatment-plans/${p.id}`, { method: 'DELETE', headers });
      process.stdout.write('.');
    }
    if (plans.length) console.log('\nTreatment plans deleted.');
  }

  console.log('Done.');
}

deleteAll().catch(console.error);
