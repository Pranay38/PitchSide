const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function testDraftAssistant() {
  console.log('Testing AI Draft Assistant...');
  try {
    // We can't directly call the serverless function easily without spinning up the server, 
    // but we can import the logic if possible, or just spin up a quick server and hit it.
    // It's easier to hit the local dev server or just mock the request.
    
    // Actually, I can just use fetch to hit the production endpoint since we just deployed it and added the key!
    const res = await fetch('https://pitchside-orcin.vercel.app/api/sys?route=ai-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'draft-assist',
        action: 'headlines',
        text: 'Arsenal beat Chelsea 2-0 with goals from Saka and Rice. It was a dominant performance.'
      })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.ok && data.result) {
      console.log('✅ AI Draft Assistant is WORKING in production!');
    } else {
      console.log('❌ AI Draft Assistant FAILED.');
    }
  } catch (err) {
    console.error('Error testing:', err);
  }
}

testDraftAssistant();
