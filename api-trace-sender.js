// api-trace-sender.js - Send traces directly via API
async function sendLiveTrace() {
  const trace = {
    id: `trace-${Date.now()}`,
    sessionId: 'live-session',
    type: 'llm',
    input: {
      prompt: `What is ${Math.random() > 0.5 ? 'machine learning' : 'artificial intelligence'}?`,
      model: 'gpt-4',
      timestamp: new Date().toISOString()
    },
    output: {
      response: `This is a simulated response about AI/ML generated at ${new Date().toLocaleTimeString()}`,
      tokens: Math.floor(Math.random() * 100) + 20,
      duration_ms: Math.floor(Math.random() * 2000) + 500
    },
    metadata: {
      cost: (Math.random() * 0.01).toFixed(4),
      temperature: 0.7,
      max_tokens: 150
    },
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + Math.random() * 2000).toISOString()
  };

  try {
    const response = await fetch('http://localhost:3001/api/traces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trace)
    });

    if (response.ok) {
      console.log('✅ Trace sent successfully:', trace.id);
    } else {
      console.error('❌ Failed to send trace:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending trace:', error);
  }
}

// Send a trace every 5 seconds
setInterval(sendLiveTrace, 5000);
sendLiveTrace(); // Send initial trace

console.log('🔄 API trace sender started. Sending traces every 5 seconds to http://localhost:3001/api/traces');
