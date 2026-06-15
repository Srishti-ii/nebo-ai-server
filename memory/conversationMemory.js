const memory = new Map();
function getAllSessions() {
  return Array.from(
    memory.values()
  );
}
function getSession(sessionId) {
  if (!memory.has(sessionId)) {
    memory.set(sessionId, {
      history: [],
      state: "DISCOVERY",
      facts: {},
     lead: {
 company:null,
 industry:null,
 employees:null,
 budget:null,
 timeline:null,
 goals:[],
 painPoints:[],
 servicesInterested:[],
 consultationOffered:false,
 consultationAccepted:false,
 score: 0,
 status: "cold",
 
},

      booking: {
        name: null,
        email: null,
        slot: null,
      },
   createdAt:
  Date.now(),

followups: {
  day1: false,
  day3: false,
  day7: false,},
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
  getAllSessions,
};