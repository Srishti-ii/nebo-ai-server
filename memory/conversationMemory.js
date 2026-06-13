const memory = new Map();

function getSession(sessionId) {
  if (!memory.has(sessionId)) {
    memory.set(sessionId, {
      history: [],
      state: "DISCOVERY",
      facts: {},
      lead: {
  company: null,
  industry: null,
  employees: null,
  budget: null,
  timeline: null,
  painPoint: null,
},
      booking: {
        name: null,
        email: null,
        slot: null,
      },
      lastTool: null,
    });
  }

  return memory.get(sessionId);
}

function saveSession(
  sessionId,
  session
) {
  memory.set(
    sessionId,
    session
  );
}

module.exports = {
  getSession,
  saveSession,
};