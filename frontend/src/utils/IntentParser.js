export const parseIntent = (text) => {
  const query = text.toLowerCase().trim();

  // 1. Definite AI Chat Questions
  const isQuestion = query.includes('?') || 
    /^(how|what|can|why|where|should|mera|kya|kaise|kitna|mujhe|suggest|batao|please)\b/i.test(query) ||
    /(kaise|kya|kitna|batao|suggest|karu|hu|hai|karna)\b/i.test(query);

  if (isQuestion) return { intent: 'chat', confidence: 1.0 };

  // 2. Quick Transaction Detection ("500 food", "petrol 300", "paid 500 for chai")
  const numberMatch = query.match(/\d+(?:,\d+)*(?:\.\d+)?/);
  if (numberMatch) {
    const amount = parseFloat(numberMatch[0].replace(/,/g, ''));
    
    // Check for explicit action verbs
    const hasAction = /^(add|spent|paid|kharcha|jodo|bought)\b/i.test(query);
    
    // Check word count (Quick entries are usually short: 2-5 words)
    const wordCount = query.split(' ').length;
    
    if (hasAction || wordCount <= 5) {
      return { 
        intent: 'quick_entry', 
        confidence: 0.9, 
        payload: { amount, originalText: text } 
      };
    }
  }

  // Fallback to chat
  return { intent: 'chat', confidence: 0.5 };
};