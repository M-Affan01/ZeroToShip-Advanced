/**
 * ChatBotLogic - Internal Static
 * Pure functions for the FAQ / AI assistant (FST section 4.1, LST section 5).
 * No external dependencies - pure keyword + similarity matching.
 */

const FALLBACK_RESPONSES = [
  "I'm not sure about that. Please try rephrasing your question.",
  "I don't have that information yet. Our team is working on it!",
  "That's a great question! Let me connect you with someone who can help.",
  "I'm still learning about that topic. Can you ask something else?",
  "I couldn't find a matching answer. Please contact our support team.",
];

export const ChatBotLogic = {
  FALLBACK_RESPONSES,

  processQuery(query, faqData, chatHistory = []) {
    const normalizedQuery = this.normalizeText(query);

    if (!normalizedQuery) {
      return { text: 'Please ask me a question about campus services!', confidence: 0 };
    }

    const contextMatch = this.checkContext(normalizedQuery, chatHistory);
    if (contextMatch) {
      return { ...contextMatch, confidence: 0.9 };
    }

    const bestMatch = this.findBestFAQMatch(normalizedQuery, faqData);

    if (bestMatch && bestMatch.confidence > 0.3) {
      return {
        text: bestMatch.answer,
        confidence: bestMatch.confidence,
        matchedId: bestMatch.id,
        category: bestMatch.category,
        suggestedQuestions: this.getSuggestedQuestions(bestMatch.category, faqData, bestMatch.id),
      };
    }

    return {
      text: this.getFallbackResponse(),
      confidence: 0,
      suggestedQuestions: this.getPopularQuestions(faqData, 3),
    };
  },

  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  },

  findBestFAQMatch(query, faqData) {
    const queryWords = query.split(' ');
    const queryLength = queryWords.length;

    const scored = faqData.map((faq) => {
      const matchedKeywords = faq.keywords.filter((keyword) => query.includes(keyword));
      const keywordScore = faq.keywords.length > 0 ? matchedKeywords.length / faq.keywords.length : 0;

      const questionWords = this.normalizeText(faq.question).split(' ');
      const commonWords = queryWords.filter((word) => questionWords.includes(word));
      const questionSimilarity = commonWords.length / Math.max(queryLength, questionWords.length, 1);

      const categoryBoost = query.includes(faq.category) ? 0.2 : 0;
      const confidence = keywordScore * 0.5 + questionSimilarity * 0.3 + categoryBoost;

      return { ...faq, confidence: Math.round(confidence * 100) / 100 };
    });

    const sorted = scored.sort((a, b) => b.confidence - a.confidence);
    return sorted[0] || null;
  },

  checkContext(query, history) {
    const lastMessages = history.slice(-5);
    const followUpIndicators = ['it', 'that', 'this', 'they', 'them', 'those'];
    const isFollowUp = followUpIndicators.some((indicator) => query.includes(indicator));

    if (isFollowUp && lastMessages.length > 0) {
      const lastAI = [...lastMessages].reverse().find((msg) => msg.sender === 'ai');
      if (lastAI) {
        return { text: `Regarding that: ${this.getFollowUpResponse(query, lastAI.text)}`, confidence: 0.7 };
      }
    }
    return null;
  },

  getFollowUpResponse(query) {
    const positive = [
      'I can provide more details about that.',
      'Let me elaborate on that further.',
      "Here's more information about that topic.",
    ];
    const negative = [
      "I don't think I covered that before.",
      'That might be a different topic.',
      'Let me check that for you.',
    ];
    const responses = query.length < 10 ? positive : negative;
    return responses[Math.floor(Math.random() * responses.length)];
  },

  getSuggestedQuestions(category, faqData, excludeId) {
    return faqData
      .filter((faq) => faq.category === category && faq.id !== excludeId)
      .slice(0, 3)
      .map((faq) => faq.question);
  },

  getPopularQuestions(faqData, count) {
    return faqData.slice(0, count).map((faq) => faq.question);
  },

  getFallbackResponse() {
    const index = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[index];
  },

  simulateTypingDelay(textLength) {
    const baseDelay = 500;
    const perCharacterDelay = 30;
    const randomVariation = Math.random() * 200;
    return Math.min(baseDelay + textLength * perCharacterDelay + randomVariation, 5000);
  },

  truncateResponse(response, maxLength = 500) {
    if (response.length <= maxLength) return response;
    return response.substring(0, maxLength) + '...';
  },

  formatResponse(response, category) {
    return response;
  },
};
