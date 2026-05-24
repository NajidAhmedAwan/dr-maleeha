export const DEFAULT_QA = [
  {
    id: 'intro',
    trigger: 'intro',
    question: null,
    answer: "Hi! I'm Dr. Maleeha's assistant. How can I help you today?",
    enabled: true,
    quickReplies: ['Book an appointment', 'Learn about procedures', 'Ask about pricing', "I'm not sure what I need"]
  },
  {
    id: 'book',
    trigger: 'Book an appointment',
    question: 'Book an appointment',
    answer: "Great! I'll take you to our booking page where you can pick a procedure, city and time that works for you.",
    enabled: true,
    action: 'navigate:/booking'
  },
  {
    id: 'procedures',
    trigger: 'Learn about procedures',
    question: 'Learn about procedures',
    answer: "Dr. Maleeha offers Botox, PLLA, Chemical Peels, Microneedling, Laser, Hydrafacial, PRP, Lip Fillers, Skin Boosters, Acne Treatment, Acne Scar Treatment, and Consultation. Which one interests you?",
    enabled: true,
    quickReplies: ['Botox', 'Chemical Peels', 'Microneedling', 'Acne Treatment', 'Something else']
  },
  {
    id: 'pricing',
    trigger: 'Ask about pricing',
    question: 'Ask about pricing',
    answer: "Pricing depends on the procedure and your specific concerns. A consultation is the best first step — Dr. Maleeha will assess your skin and give you a clear plan with transparent pricing.",
    enabled: true,
    quickReplies: ['Book a consultation', 'See procedures']
  },
  {
    id: 'unsure',
    trigger: "I'm not sure what I need",
    question: "I'm not sure what I need",
    answer: "No problem — that's what we're here for. Tell me, what's your main skin concern right now?",
    enabled: true,
    quickReplies: ['Acne or breakouts', 'Acne scars', 'Fine lines or wrinkles', 'Dull or uneven skin', 'Pigmentation', 'Hair loss']
  },
  {
    id: 'acne',
    trigger: 'Acne or breakouts',
    question: 'Acne or breakouts',
    answer: "For active acne, Dr. Maleeha typically recommends a combination of Chemical Peels and a targeted Acne Treatment plan. Would you like to book a consultation?",
    enabled: true,
    quickReplies: ['Book a consultation', 'Tell me more']
  },
  {
    id: 'acne-scars',
    trigger: 'Acne scars',
    question: 'Acne scars',
    answer: "Acne scars respond well to Microneedling and Laser treatments. The right protocol depends on the scar type — consultation first.",
    enabled: true,
    quickReplies: ['Book a consultation', 'Tell me more']
  },
  {
    id: 'wrinkles',
    trigger: 'Fine lines or wrinkles',
    question: 'Fine lines or wrinkles',
    answer: "Botox works beautifully for dynamic lines, and PLLA or Skin Boosters help with overall skin quality and volume.",
    enabled: true,
    quickReplies: ['Book a consultation', 'Tell me more']
  },
  {
    id: 'dull-skin',
    trigger: 'Dull or uneven skin',
    question: 'Dull or uneven skin',
    answer: "Hydrafacial gives instant glow, Chemical Peels reset the skin over a few sessions, and PRP boosts long-term radiance.",
    enabled: true,
    quickReplies: ['Book a consultation', 'Tell me more']
  },
  {
    id: 'pigmentation',
    trigger: 'Pigmentation',
    question: 'Pigmentation',
    answer: "Pigmentation needs a careful workup — some types respond to peels, others to laser. Dr. Maleeha will identify the cause first.",
    enabled: true,
    quickReplies: ['Book a consultation']
  },
  {
    id: 'hair-loss',
    trigger: 'Hair loss',
    question: 'Hair loss',
    answer: "PRP is the most effective non-surgical option for hair loss. Dr. Maleeha runs full hair loss protocols at the Karachi and Islamabad clinics.",
    enabled: true,
    quickReplies: ['Book a consultation']
  },
  {
    id: 'tell-more',
    trigger: 'Tell me more',
    question: 'Tell me more',
    answer: "The best way to get a real answer is a consultation — Dr. Maleeha can see your skin in person and recommend a plan that actually fits you.",
    enabled: true,
    quickReplies: ['Book a consultation']
  },
  {
    id: 'book-consult',
    trigger: 'Book a consultation',
    question: 'Book a consultation',
    answer: "Taking you to booking now.",
    enabled: true,
    action: 'navigate:/booking'
  },
  {
    id: 'see-procedures',
    trigger: 'See procedures',
    question: 'See procedures',
    answer: "Scroll up on the homepage to see all procedures with before/after photos and reviews.",
    enabled: true
  },
  {
    id: 'something-else',
    trigger: 'Something else',
    question: 'Something else',
    answer: "Tell me what's on your mind, or book a consultation and we'll figure it out together.",
    enabled: true,
    quickReplies: ['Book a consultation']
  }
];

export function getChatbotQA() {
  try {
    const stored = JSON.parse(localStorage.getItem('chatbotQA_overrides') || '{}');
    const customAdditions = JSON.parse(localStorage.getItem('chatbotQA_custom') || '[]');
    const merged = DEFAULT_QA.map(item => stored[item.id] ? { ...item, ...stored[item.id] } : item);
    return [...merged, ...customAdditions].filter(item => item.enabled !== false);
  } catch {
    return DEFAULT_QA;
  }
}

export function updateChatbotQA(id, patch) {
  const stored = JSON.parse(localStorage.getItem('chatbotQA_overrides') || '{}');
  stored[id] = { ...(stored[id] || {}), ...patch };
  localStorage.setItem('chatbotQA_overrides', JSON.stringify(stored));
}

export function addCustomQA(qa) {
  const custom = JSON.parse(localStorage.getItem('chatbotQA_custom') || '[]');
  custom.push({ ...qa, id: `custom-${Date.now()}`, enabled: true });
  localStorage.setItem('chatbotQA_custom', JSON.stringify(custom));
}

export function deleteCustomQA(id) {
  const custom = JSON.parse(localStorage.getItem('chatbotQA_custom') || '[]');
  localStorage.setItem('chatbotQA_custom', JSON.stringify(custom.filter(q => q.id !== id)));
}
