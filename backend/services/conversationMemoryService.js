const userContexts = new Map();

const setContext = (userId, intent, data) => {
  userContexts.set(userId.toString(), {
    lastIntent: intent,
    lastData: data,
    timestamp: Date.now()
  });
};

const getContext = (userId) => {
  const context = userContexts.get(userId.toString());
  if (context && (Date.now() - context.timestamp < 1000 * 60 * 30)) { 
    return context;
  }
  return null;
};

const clearContext = (userId) => {
  userContexts.delete(userId.toString());
};

module.exports = { setContext, getContext, clearContext };