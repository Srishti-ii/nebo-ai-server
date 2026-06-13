const memory = new Map();

function getConversation(sessionId) {
  return (
    memory.get(sessionId) || {
  history: [],

  facts: {},

  lead: {
    company: null,
    industry: null,
    budget: null,
    timeline: null
  },

  booking: {
    name: null,
    email: null,
    slot: null
  },

  lastTool: null
}
  );
}

function saveConversation(
  sessionId,
  conversation
) {
  memory.set(
    sessionId,
    conversation
  );
}

module.exports = {
  getConversation,
  saveConversation
};