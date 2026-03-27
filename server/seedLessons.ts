/**
 * 30+ pre-built micro-lessons for shift workers covering essential training topics.
 * Each lesson includes full content blocks and quiz questions ready for the lesson player.
 */

import type { LessonContent } from "../drizzle/schema";

export type SeedLesson = {
  title: string;
  description: string;
  contentType: "video" | "quiz" | "scenario" | "assessment" | "mixed" | "article";
  durationMinutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  tags: string[];
  language: string;
  content: LessonContent;
};

function makeId(prefix: string, n: number) {
  return `${prefix}-${n}`;
}

function textBlock(id: string, text: string, order: number) {
  return { id, type: "text" as const, data: { text }, order };
}

function quizQ(
  id: string,
  question: string,
  options: { text: string; isCorrect: boolean }[],
  explanation: string,
  points = 1
) {
  return {
    id,
    question,
    type: "multiple_choice" as const,
    options: options.map((o, i) => ({ id: `${id}-o${i}`, text: o.text, isCorrect: o.isCorrect })),
    explanation,
    points,
  };
}

export const SEED_LESSONS: SeedLesson[] = [
  // ─── 1. Workplace Safety Fundamentals ───────────────────────────────
  {
    title: "Workplace Safety Fundamentals",
    description: "Learn the core principles of workplace safety including hazard identification, PPE usage, and emergency procedures essential for every shift worker.",
    contentType: "mixed",
    durationMinutes: 7,
    difficulty: "beginner",
    category: "Safety",
    tags: ["safety", "ppe", "hazards", "onboarding"],
    language: "en",
    content: {
      blocks: [
        textBlock("ws1-b1", "Workplace safety is everyone's responsibility. As a shift worker, you face unique hazards depending on your industry — from heavy machinery in manufacturing to wet floors in hospitality. Understanding and following safety protocols protects you and your coworkers.\n\nThe hierarchy of controls prioritizes hazard elimination first, then substitution, engineering controls, administrative controls, and finally personal protective equipment (PPE) as the last line of defense.", 0),
        textBlock("ws1-b2", "Key Safety Principles:\n\n1. Always report hazards immediately — don't assume someone else will.\n2. Wear the correct PPE for your task. This includes hard hats, safety glasses, gloves, steel-toed boots, or hearing protection as required.\n3. Follow lockout/tagout (LOTO) procedures before servicing equipment.\n4. Keep your work area clean and organized — clutter causes trips and falls.\n5. Know the location of emergency exits, fire extinguishers, and first aid kits.", 1),
        textBlock("ws1-b3", "Emergency Response:\n\nIn case of an emergency, remember the acronym R.A.C.E.:\n• Rescue anyone in immediate danger\n• Alarm — activate the nearest alarm or call emergency services\n• Contain the hazard if safe to do so\n• Evacuate using designated routes\n\nNever re-enter a building during an evacuation until the all-clear is given by authorized personnel.", 2),
      ],
      quizQuestions: [
        quizQ("ws1-q1", "What is the LAST line of defense in the hierarchy of controls?", [
          { text: "Elimination", isCorrect: false },
          { text: "Engineering controls", isCorrect: false },
          { text: "Personal Protective Equipment (PPE)", isCorrect: true },
          { text: "Administrative controls", isCorrect: false },
        ], "PPE is the last resort in the hierarchy of controls. Elimination of the hazard is always the first priority."),
        quizQ("ws1-q2", "What does the 'A' in R.A.C.E. stand for?", [
          { text: "Assess", isCorrect: false },
          { text: "Alarm", isCorrect: true },
          { text: "Avoid", isCorrect: false },
          { text: "Assist", isCorrect: false },
        ], "A stands for Alarm — activate the nearest alarm or call emergency services."),
        quizQ("ws1-q3", "When should you report a workplace hazard?", [
          { text: "At the end of your shift", isCorrect: false },
          { text: "Only if someone gets hurt", isCorrect: false },
          { text: "Immediately upon discovery", isCorrect: true },
          { text: "During the next safety meeting", isCorrect: false },
        ], "Hazards should be reported immediately to prevent injuries."),
      ],
      passingScore: 70,
    },
  },

  // ─── 2. Slip, Trip, and Fall Prevention ─────────────────────────────
  {
    title: "Slip, Trip, and Fall Prevention",
    description: "Understand the leading causes of workplace injuries and learn practical techniques to prevent slips, trips, and falls during your shift.",
    contentType: "mixed",
    durationMinutes: 5,
    difficulty: "beginner",
    category: "Safety",
    tags: ["safety", "falls", "prevention"],
    language: "en",
    content: {
      blocks: [
        textBlock("stf-b1", "Slips, trips, and falls are the #1 cause of workplace injuries across all industries. They account for over 25% of all reported injury claims annually. The good news: most are preventable with awareness and simple precautions.\n\nCommon causes include:\n• Wet or oily floors\n• Loose cables or cords\n• Uneven walking surfaces\n• Poor lighting\n• Cluttered walkways\n• Improper footwear", 0),
        textBlock("stf-b2", "Prevention Tips:\n\n1. Clean up spills immediately and place wet floor signs.\n2. Secure cables and cords away from walkways using cable covers.\n3. Use handrails on stairs and ramps.\n4. Wear slip-resistant footwear appropriate for your work environment.\n5. Report damaged flooring, loose tiles, or uneven surfaces.\n6. Keep walkways clear of boxes, tools, and debris.\n7. Use adequate lighting — report burned-out bulbs.\n8. Walk, don't run, especially around corners.", 1),
      ],
      quizQuestions: [
        quizQ("stf-q1", "What percentage of workplace injury claims are caused by slips, trips, and falls?", [
          { text: "About 10%", isCorrect: false },
          { text: "Over 25%", isCorrect: true },
          { text: "About 5%", isCorrect: false },
          { text: "Over 50%", isCorrect: false },
        ], "Slips, trips, and falls account for over 25% of all reported injury claims."),
        quizQ("stf-q2", "What should you do immediately after a spill occurs?", [
          { text: "Wait for the cleaning crew", isCorrect: false },
          { text: "Walk around it", isCorrect: false },
          { text: "Clean it up and place a wet floor sign", isCorrect: true },
          { text: "Report it at the end of your shift", isCorrect: false },
        ], "Spills should be cleaned up immediately and marked with wet floor signs to prevent injuries."),
        quizQ("stf-q3", "Which type of footwear is recommended for preventing slips?", [
          { text: "Open-toed sandals", isCorrect: false },
          { text: "Slip-resistant shoes", isCorrect: true },
          { text: "Any comfortable shoes", isCorrect: false },
          { text: "High-heeled boots", isCorrect: false },
        ], "Slip-resistant footwear provides better traction on wet or oily surfaces."),
      ],
      passingScore: 70,
    },
  },

  // ─── 3. Manual Handling & Ergonomics ────────────────────────────────
  {
    title: "Manual Handling & Ergonomics",
    description: "Master proper lifting techniques and ergonomic principles to protect your back and joints during physically demanding shift work.",
    contentType: "mixed",
    durationMinutes: 6,
    difficulty: "beginner",
    category: "Safety",
    tags: ["ergonomics", "lifting", "back-safety"],
    language: "en",
    content: {
      blocks: [
        textBlock("mh-b1", "Back injuries are among the most common and costly workplace injuries. Improper lifting is the leading cause. Whether you're moving boxes in a warehouse, transferring patients in healthcare, or stocking shelves in retail, proper technique is essential.\n\nThe Safe Lifting Technique:\n1. Plan your lift — assess the weight and your path\n2. Stand close to the load with feet shoulder-width apart\n3. Bend at the knees, NOT the waist\n4. Get a firm grip on the object\n5. Lift with your legs, keeping your back straight\n6. Keep the load close to your body\n7. Avoid twisting — pivot with your feet instead", 0),
        textBlock("mh-b2", "Ergonomic Principles for Shift Workers:\n\n• Adjust your workstation to fit you, not the other way around\n• Keep frequently used items within arm's reach\n• Take micro-breaks every 30-60 minutes to stretch\n• Alternate between sitting and standing when possible\n• Use anti-fatigue mats if standing for long periods\n• Position screens at eye level to reduce neck strain\n\nRemember: If a load is too heavy, ask for help or use mechanical aids like dollies, carts, or forklifts.", 1),
      ],
      quizQuestions: [
        quizQ("mh-q1", "When lifting a heavy object, you should bend at the:", [
          { text: "Waist", isCorrect: false },
          { text: "Knees", isCorrect: true },
          { text: "Hips only", isCorrect: false },
          { text: "Neck", isCorrect: false },
        ], "Always bend at the knees and lift with your legs to protect your back."),
        quizQ("mh-q2", "How often should you take micro-breaks to stretch during a shift?", [
          { text: "Every 3-4 hours", isCorrect: false },
          { text: "Only during lunch", isCorrect: false },
          { text: "Every 30-60 minutes", isCorrect: true },
          { text: "Once per shift", isCorrect: false },
        ], "Micro-breaks every 30-60 minutes help prevent repetitive strain injuries."),
        quizQ("mh-q3", "Instead of twisting your body while carrying a load, you should:", [
          { text: "Lean to one side", isCorrect: false },
          { text: "Pivot with your feet", isCorrect: true },
          { text: "Bend at the waist", isCorrect: false },
          { text: "Throw the object", isCorrect: false },
        ], "Pivoting with your feet prevents spinal twisting injuries."),
      ],
      passingScore: 70,
    },
  },

  // ─── 4. Fire Safety Essentials ──────────────────────────────────────
  {
    title: "Fire Safety Essentials",
    description: "Learn fire prevention, extinguisher types, evacuation procedures, and your role in keeping the workplace fire-safe.",
    contentType: "mixed",
    durationMinutes: 6,
    difficulty: "beginner",
    category: "Safety",
    tags: ["fire-safety", "emergency", "extinguisher"],
    language: "en",
    content: {
      blocks: [
        textBlock("fs-b1", "Fire can spread rapidly in a workplace. Understanding fire safety can save lives. Every worker should know the fire triangle: Heat + Fuel + Oxygen = Fire. Remove any one element and the fire cannot sustain itself.\n\nFire Extinguisher Types (ABCDK):\n• Class A — Ordinary combustibles (wood, paper, cloth)\n• Class B — Flammable liquids (gasoline, oil, grease)\n• Class C — Electrical equipment\n• Class D — Combustible metals\n• Class K — Kitchen fires (cooking oils/fats)", 0),
        textBlock("fs-b2", "Using a Fire Extinguisher — Remember P.A.S.S.:\n• Pull the pin\n• Aim at the base of the fire\n• Squeeze the handle\n• Sweep from side to side\n\nImportant: Only attempt to fight a fire if it is small, contained, you have the right extinguisher, you have a clear escape route, and you have been trained. When in doubt, evacuate immediately.\n\nEvacuation Tips:\n• Know at least two exit routes from your work area\n• Never use elevators during a fire\n• Close doors behind you to slow fire spread\n• Gather at the designated assembly point\n• Account for all team members", 1),
      ],
      quizQuestions: [
        quizQ("fs-q1", "What are the three elements of the fire triangle?", [
          { text: "Heat, Fuel, Oxygen", isCorrect: true },
          { text: "Water, Fuel, Air", isCorrect: false },
          { text: "Heat, Water, Fuel", isCorrect: false },
          { text: "Smoke, Heat, Fuel", isCorrect: false },
        ], "The fire triangle consists of Heat, Fuel, and Oxygen."),
        quizQ("fs-q2", "What does the 'A' in P.A.S.S. stand for?", [
          { text: "Activate", isCorrect: false },
          { text: "Aim at the base of the fire", isCorrect: true },
          { text: "Alert others", isCorrect: false },
          { text: "Approach carefully", isCorrect: false },
        ], "A stands for Aim — aim the extinguisher at the base of the fire, not the flames."),
        quizQ("fs-q3", "Which class of fire extinguisher should be used for kitchen grease fires?", [
          { text: "Class A", isCorrect: false },
          { text: "Class B", isCorrect: false },
          { text: "Class C", isCorrect: false },
          { text: "Class K", isCorrect: true },
        ], "Class K extinguishers are specifically designed for kitchen fires involving cooking oils and fats."),
      ],
      passingScore: 70,
    },
  },

  // ─── 5. Effective Shift Handover Communication ──────────────────────
  {
    title: "Effective Shift Handover Communication",
    description: "Master the art of shift handover to ensure continuity, safety, and productivity between rotating teams.",
    contentType: "mixed",
    durationMinutes: 5,
    difficulty: "beginner",
    category: "Communication",
    tags: ["communication", "handover", "teamwork"],
    language: "en",
    content: {
      blocks: [
        textBlock("shc-b1", "A poor shift handover can lead to missed tasks, safety incidents, and lost productivity. Effective communication between outgoing and incoming shifts is critical in any 24/7 operation.\n\nThe SBAR Framework for Handovers:\n• Situation — What is currently happening?\n• Background — What led to this situation?\n• Assessment — What do you think the issues are?\n• Recommendation — What needs to be done next?", 0),
        textBlock("shc-b2", "Best Practices for Shift Handover:\n\n1. Use a standardized handover checklist or log\n2. Conduct face-to-face handovers when possible\n3. Walk through the work area together\n4. Highlight any safety concerns or equipment issues\n5. Mention pending tasks and their priority\n6. Note any unusual events or deviations from normal operations\n7. Confirm understanding — ask the incoming shift to repeat key points\n8. Document everything in the shift log\n\nRemember: If it wasn't documented, it didn't happen.", 1),
      ],
      quizQuestions: [
        quizQ("shc-q1", "What does the 'S' in SBAR stand for?", [
          { text: "Safety", isCorrect: false },
          { text: "Situation", isCorrect: true },
          { text: "Summary", isCorrect: false },
          { text: "Standard", isCorrect: false },
        ], "S stands for Situation — describing what is currently happening."),
        quizQ("shc-q2", "Why is face-to-face handover preferred?", [
          { text: "It's faster", isCorrect: false },
          { text: "It allows for questions and clarification", isCorrect: true },
          { text: "It's required by law", isCorrect: false },
          { text: "It avoids paperwork", isCorrect: false },
        ], "Face-to-face handovers allow immediate questions, clarification, and non-verbal cues."),
        quizQ("shc-q3", "What should the incoming shift do to confirm understanding?", [
          { text: "Nod and walk away", isCorrect: false },
          { text: "Read the log later", isCorrect: false },
          { text: "Repeat back key points", isCorrect: true },
          { text: "Sign the handover form only", isCorrect: false },
        ], "Repeating key points back ensures accurate understanding and reduces miscommunication."),
      ],
      passingScore: 70,
    },
  },

  // ─── 6. Time Management for Shift Workers ──────────────────────────
  {
    title: "Time Management for Shift Workers",
    description: "Learn practical time management strategies designed specifically for workers with rotating or irregular schedules.",
    contentType: "article",
    durationMinutes: 5,
    difficulty: "beginner",
    category: "Productivity",
    tags: ["time-management", "productivity", "shift-work"],
    language: "en",
    content: {
      blocks: [
        textBlock("tm-b1", "Shift workers face unique time management challenges. Rotating schedules, fatigue, and irregular hours make it harder to maintain routines. But with the right strategies, you can maximize productivity both at work and in your personal life.\n\nThe 3-Priority Rule:\nAt the start of each shift, identify your top 3 priorities. Focus on completing these before moving to less critical tasks. This prevents overwhelm and ensures the most important work gets done.", 0),
        textBlock("tm-b2", "Practical Strategies:\n\n1. Batch similar tasks together to reduce context-switching\n2. Use the 2-minute rule: if a task takes less than 2 minutes, do it now\n3. Plan your meals and sleep schedule around your shifts\n4. Use digital tools (calendars, reminders) to track deadlines\n5. Communicate your schedule clearly to family and friends\n6. Protect your sleep — it's your most valuable recovery tool\n7. Prepare for your shift the night/day before (uniform, meals, equipment)\n8. Learn to say no to non-essential commitments during work-intensive periods", 1),
        textBlock("tm-b3", "Energy Management:\n\nTime management is really energy management. Your energy levels fluctuate throughout a shift:\n• First 2 hours: Peak alertness — tackle complex tasks\n• Mid-shift: Steady energy — handle routine work\n• Last 2 hours: Declining energy — do administrative tasks, plan handover\n\nTake short breaks to recharge. Even 5 minutes of walking or stretching can restore focus.", 2),
      ],
      quizQuestions: [
        quizQ("tm-q1", "How many priorities should you identify at the start of each shift?", [
          { text: "1", isCorrect: false },
          { text: "3", isCorrect: true },
          { text: "10", isCorrect: false },
          { text: "As many as possible", isCorrect: false },
        ], "The 3-Priority Rule helps you focus on the most important tasks without overwhelm."),
        quizQ("tm-q2", "According to the 2-minute rule, what should you do with quick tasks?", [
          { text: "Schedule them for later", isCorrect: false },
          { text: "Delegate them", isCorrect: false },
          { text: "Do them immediately", isCorrect: true },
          { text: "Add them to a to-do list", isCorrect: false },
        ], "If a task takes less than 2 minutes, do it now to prevent buildup of small tasks."),
        quizQ("tm-q3", "When during a shift are you typically at peak alertness?", [
          { text: "The last 2 hours", isCorrect: false },
          { text: "Mid-shift", isCorrect: false },
          { text: "The first 2 hours", isCorrect: true },
          { text: "Right after a break", isCorrect: false },
        ], "The first 2 hours of a shift typically offer peak alertness — use them for complex tasks."),
      ],
      passingScore: 70,
    },
  },

  // ─── 7. Customer Service Excellence ─────────────────────────────────
  {
    title: "Customer Service Excellence",
    description: "Develop essential customer service skills including active listening, de-escalation, and creating positive experiences.",
    contentType: "mixed",
    durationMinutes: 6,
    difficulty: "beginner",
    category: "Customer Service",
    tags: ["customer-service", "communication", "de-escalation"],
    language: "en",
    content: {
      blocks: [
        textBlock("cs-b1", "Great customer service is the foundation of business success. As a frontline worker, you are the face of your organization. Every interaction is an opportunity to build loyalty or lose a customer.\n\nThe LAST Framework:\n• Listen actively to the customer's concern\n• Apologize sincerely for the inconvenience\n• Solve the problem or find someone who can\n• Thank the customer for their patience", 0),
        textBlock("cs-b2", "De-escalation Techniques:\n\nWhen dealing with upset customers:\n1. Stay calm — don't take it personally\n2. Use a low, steady tone of voice\n3. Acknowledge their feelings: 'I understand this is frustrating'\n4. Focus on what you CAN do, not what you can't\n5. Offer options when possible\n6. Know when to involve a supervisor\n\nBody Language Matters:\n• Maintain appropriate eye contact\n• Keep an open posture (no crossed arms)\n• Nod to show you're listening\n• Smile genuinely when appropriate", 1),
      ],
      quizQuestions: [
        quizQ("cs-q1", "What does the 'L' in the LAST framework stand for?", [
          { text: "Lead", isCorrect: false },
          { text: "Listen", isCorrect: true },
          { text: "Learn", isCorrect: false },
          { text: "Log", isCorrect: false },
        ], "L stands for Listen — active listening is the first step in resolving customer concerns."),
        quizQ("cs-q2", "When dealing with an upset customer, you should:", [
          { text: "Argue your point", isCorrect: false },
          { text: "Ignore them until they calm down", isCorrect: false },
          { text: "Acknowledge their feelings and stay calm", isCorrect: true },
          { text: "Immediately call security", isCorrect: false },
        ], "Acknowledging feelings and staying calm helps de-escalate the situation."),
        quizQ("cs-q3", "What body language should you avoid when speaking with a customer?", [
          { text: "Eye contact", isCorrect: false },
          { text: "Crossed arms", isCorrect: true },
          { text: "Nodding", isCorrect: false },
          { text: "Smiling", isCorrect: false },
        ], "Crossed arms signal defensiveness and can make the customer feel unwelcome."),
      ],
      passingScore: 70,
    },
  },

  // ─── 8. Fatigue Management for Night Shift ──────────────────────────
  {
    title: "Fatigue Management for Night Shift Workers",
    description: "Understand the science of fatigue and learn evidence-based strategies to stay alert and healthy during night shifts.",
    contentType: "mixed",
    durationMinutes: 7,
    difficulty: "intermediate",
    category: "Health & Wellness",
    tags: ["fatigue", "night-shift", "health", "sleep"],
    language: "en",
    content: {
      blocks: [
        textBlock("fm-b1", "Night shift work disrupts your circadian rhythm — the internal clock that regulates sleep-wake cycles. This can lead to chronic fatigue, increased accident risk, and long-term health issues including cardiovascular disease and metabolic disorders.\n\nThe Science of Fatigue:\n• Your body naturally wants to sleep between 2-6 AM\n• Alertness drops significantly after 16+ hours awake\n• Sleep debt accumulates and cannot be fully repaid with one good night's sleep\n• Reaction times when fatigued can be comparable to being legally intoxicated", 0),
        textBlock("fm-b2", "Strategies for Night Shift Workers:\n\n1. Sleep Hygiene:\n   • Create a dark, cool, quiet sleeping environment\n   • Use blackout curtains and white noise machines\n   • Maintain a consistent sleep schedule, even on days off\n   • Aim for 7-9 hours of sleep per 24-hour period\n\n2. Nutrition:\n   • Eat a balanced meal before your shift\n   • Avoid heavy meals during the shift — opt for light snacks\n   • Stay hydrated with water\n   • Limit caffeine to the first half of your shift\n\n3. During Your Shift:\n   • Take strategic 20-minute power naps during breaks\n   • Use bright lighting to boost alertness\n   • Move around regularly — physical activity fights drowsiness\n   • Partner up for safety-critical tasks during low-alertness periods", 1),
      ],
      quizQuestions: [
        quizQ("fm-q1", "When does the body naturally experience the lowest alertness?", [
          { text: "10 PM - 12 AM", isCorrect: false },
          { text: "2 AM - 6 AM", isCorrect: true },
          { text: "8 PM - 10 PM", isCorrect: false },
          { text: "6 AM - 8 AM", isCorrect: false },
        ], "The circadian low point occurs between 2-6 AM, when the body most wants to sleep."),
        quizQ("fm-q2", "How long should a strategic power nap be during a break?", [
          { text: "5 minutes", isCorrect: false },
          { text: "20 minutes", isCorrect: true },
          { text: "60 minutes", isCorrect: false },
          { text: "2 hours", isCorrect: false },
        ], "A 20-minute power nap provides alertness benefits without entering deep sleep."),
        quizQ("fm-q3", "When should you limit caffeine intake during a night shift?", [
          { text: "Avoid it entirely", isCorrect: false },
          { text: "Only drink it at the end of the shift", isCorrect: false },
          { text: "Limit to the first half of the shift", isCorrect: true },
          { text: "Drink as much as needed", isCorrect: false },
        ], "Limiting caffeine to the first half prevents it from interfering with post-shift sleep."),
      ],
      passingScore: 70,
    },
  },

  // ─── 9. Hazardous Materials (HAZMAT) Awareness ──────────────────────
  {
    title: "Hazardous Materials (HAZMAT) Awareness",
    description: "Identify hazardous materials, understand GHS labeling, read Safety Data Sheets, and respond safely to chemical exposures.",
    contentType: "mixed",
    durationMinutes: 8,
    difficulty: "intermediate",
    category: "Safety",
    tags: ["hazmat", "chemicals", "ghs", "sds"],
    language: "en",
    content: {
      blocks: [
        textBlock("hz-b1", "Hazardous materials are present in many workplaces — from cleaning chemicals in hospitality to industrial solvents in manufacturing. The Globally Harmonized System (GHS) provides a standardized way to classify and communicate chemical hazards.\n\nGHS Label Elements:\n• Product identifier (chemical name)\n• Signal word (Danger or Warning)\n• Hazard pictograms (diamond-shaped symbols)\n• Hazard statements (describes the nature of the hazard)\n• Precautionary statements (how to handle safely)\n• Supplier information", 0),
        textBlock("hz-b2", "Safety Data Sheets (SDS):\n\nEvery hazardous chemical must have a 16-section SDS available. Key sections to know:\n• Section 2: Hazard identification\n• Section 4: First-aid measures\n• Section 5: Fire-fighting measures\n• Section 7: Handling and storage\n• Section 8: Exposure controls / PPE\n\nIf Exposed:\n1. Remove yourself from the area\n2. Remove contaminated clothing\n3. Flush affected areas with water for at least 15 minutes\n4. Seek medical attention\n5. Bring the SDS to medical personnel", 1),
      ],
      quizQuestions: [
        quizQ("hz-q1", "How many sections does a Safety Data Sheet (SDS) contain?", [
          { text: "8", isCorrect: false },
          { text: "12", isCorrect: false },
          { text: "16", isCorrect: true },
          { text: "20", isCorrect: false },
        ], "A standard SDS contains 16 sections covering all aspects of chemical safety."),
        quizQ("hz-q2", "Which GHS signal word indicates a MORE severe hazard?", [
          { text: "Warning", isCorrect: false },
          { text: "Danger", isCorrect: true },
          { text: "Caution", isCorrect: false },
          { text: "Notice", isCorrect: false },
        ], "'Danger' indicates a more severe hazard than 'Warning' in the GHS system."),
        quizQ("hz-q3", "How long should you flush an area exposed to a chemical?", [
          { text: "30 seconds", isCorrect: false },
          { text: "5 minutes", isCorrect: false },
          { text: "At least 15 minutes", isCorrect: true },
          { text: "1 minute", isCorrect: false },
        ], "Flush affected areas with water for at least 15 minutes to ensure thorough decontamination."),
      ],
      passingScore: 70,
    },
  },

  // ─── 10. Conflict Resolution in the Workplace ──────────────────────
  {
    title: "Conflict Resolution in the Workplace",
    description: "Learn to identify, address, and resolve workplace conflicts constructively to maintain a positive team environment.",
    contentType: "mixed",
    durationMinutes: 6,
    difficulty: "intermediate",
    category: "Communication",
    tags: ["conflict", "teamwork", "communication"],
    language: "en",
    content: {
      blocks: [
        textBlock("cr-b1", "Workplace conflict is inevitable, especially in shift environments where stress, fatigue, and diverse personalities intersect. Unresolved conflict leads to decreased morale, higher turnover, and safety risks.\n\nCommon Sources of Conflict:\n• Miscommunication or lack of communication\n• Unfair workload distribution\n• Personality clashes\n• Competition for resources or recognition\n• Different work styles or standards\n• Schedule disagreements", 0),
        textBlock("cr-b2", "The DESC Method for Addressing Conflict:\n\n• Describe the specific behavior or situation objectively\n• Express how it affects you using 'I' statements\n• Specify what you'd like to change\n• Consequences — explain the positive outcome of resolving it\n\nExample: 'When tasks aren't completed during handover (Describe), I feel overwhelmed starting my shift behind (Express). Could we use the checklist to ensure completion? (Specify) This would help both our shifts run smoothly (Consequence).'\n\nKey Principles:\n• Address issues privately, not in front of others\n• Focus on behavior, not personality\n• Listen to understand, not to respond\n• Seek win-win solutions\n• Involve a mediator if needed", 1),
      ],
      quizQuestions: [
        quizQ("cr-q1", "What does the 'E' in DESC stand for?", [
          { text: "Evaluate", isCorrect: false },
          { text: "Express", isCorrect: true },
          { text: "Eliminate", isCorrect: false },
          { text: "Enforce", isCorrect: false },
        ], "E stands for Express — share how the behavior affects you using 'I' statements."),
        quizQ("cr-q2", "Where should you address a workplace conflict?", [
          { text: "In front of the team for transparency", isCorrect: false },
          { text: "Privately with the person involved", isCorrect: true },
          { text: "On social media", isCorrect: false },
          { text: "Only through email", isCorrect: false },
        ], "Conflicts should be addressed privately to avoid embarrassment and defensiveness."),
        quizQ("cr-q3", "When resolving conflict, you should focus on:", [
          { text: "The person's personality", isCorrect: false },
          { text: "Winning the argument", isCorrect: false },
          { text: "The specific behavior", isCorrect: true },
          { text: "Past grievances", isCorrect: false },
        ], "Focusing on specific behaviors keeps the discussion objective and productive."),
      ],
      passingScore: 70,
    },
  },

  // ─── 11. Food Safety & Hygiene ──────────────────────────────────────
  {
    title: "Food Safety & Hygiene Basics",
    description: "Essential food safety practices including temperature control, cross-contamination prevention, and personal hygiene for food handlers.",
    contentType: "mixed",
    durationMinutes: 7,
    difficulty: "beginner",
    category: "Compliance",
    tags: ["food-safety", "hygiene", "compliance"],
    language: "en",
    content: {
      blocks: [
        textBlock("fsh-b1", "Foodborne illness affects millions annually. As a food handler, you play a critical role in keeping customers safe. The four key principles of food safety are: Clean, Separate, Cook, and Chill.\n\nTemperature Danger Zone: 40°F - 140°F (4°C - 60°C)\nBacteria multiply rapidly in this range. Never leave perishable food in the danger zone for more than 2 hours (1 hour if above 90°F/32°C).", 0),
        textBlock("fsh-b2", "Handwashing — The #1 Defense:\n\nWash hands for at least 20 seconds with soap and warm water:\n• Before handling food\n• After using the restroom\n• After touching raw meat, poultry, or seafood\n• After sneezing, coughing, or touching your face\n• After handling garbage\n• After handling chemicals\n\nCross-Contamination Prevention:\n• Use separate cutting boards for raw meat and ready-to-eat foods\n• Store raw meat below ready-to-eat items in the refrigerator\n• Sanitize surfaces between tasks\n• Use color-coded utensils when available", 1),
      ],
      quizQuestions: [
        quizQ("fsh-q1", "What is the temperature danger zone for food?", [
          { text: "0°F - 32°F", isCorrect: false },
          { text: "40°F - 140°F", isCorrect: true },
          { text: "100°F - 200°F", isCorrect: false },
          { text: "32°F - 100°F", isCorrect: false },
        ], "The danger zone is 40°F - 140°F (4°C - 60°C) where bacteria multiply rapidly."),
        quizQ("fsh-q2", "How long should you wash your hands?", [
          { text: "5 seconds", isCorrect: false },
          { text: "10 seconds", isCorrect: false },
          { text: "At least 20 seconds", isCorrect: true },
          { text: "1 minute", isCorrect: false },
        ], "Wash hands for at least 20 seconds with soap and warm water."),
        quizQ("fsh-q3", "Where should raw meat be stored in the refrigerator?", [
          { text: "On the top shelf", isCorrect: false },
          { text: "Next to ready-to-eat foods", isCorrect: false },
          { text: "Below ready-to-eat items", isCorrect: true },
          { text: "Outside the refrigerator", isCorrect: false },
        ], "Raw meat should be stored below ready-to-eat items to prevent dripping and cross-contamination."),
      ],
      passingScore: 70,
    },
  },

  // ─── 12. Lockout/Tagout (LOTO) Procedures ──────────────────────────
  {
    title: "Lockout/Tagout (LOTO) Procedures",
    description: "Understand LOTO procedures to safely isolate energy sources before equipment maintenance or servicing.",
    contentType: "mixed",
    durationMinutes: 8,
    difficulty: "intermediate",
    category: "Safety",
    tags: ["loto", "lockout-tagout", "equipment-safety"],
    language: "en",
    content: {
      blocks: [
        textBlock("loto-b1", "Lockout/Tagout (LOTO) procedures prevent the unexpected startup of machinery during maintenance. Failure to follow LOTO causes approximately 120 fatalities and 50,000 injuries annually in the US alone.\n\nEnergy Sources to Control:\n• Electrical\n• Mechanical\n• Hydraulic\n• Pneumatic\n• Chemical\n• Thermal\n• Gravitational", 0),
        textBlock("loto-b2", "The 6 Steps of LOTO:\n\n1. Preparation — Identify all energy sources and the required lockout devices\n2. Shutdown — Notify affected employees and shut down the equipment normally\n3. Isolation — Disconnect all energy sources using switches, valves, or blocks\n4. Lockout/Tagout — Apply your personal lock and tag to each isolation point\n5. Verification — Attempt to restart the equipment to verify it's de-energized\n6. Perform Work — Complete maintenance safely\n\nCritical Rules:\n• Never remove someone else's lock\n• Each worker applies their own lock\n• Tags are warnings, not physical restraints — always use locks\n• Re-energize only after all workers have removed their locks", 1),
      ],
      quizQuestions: [
        quizQ("loto-q1", "How many fatalities does failure to follow LOTO cause annually in the US?", [
          { text: "About 20", isCorrect: false },
          { text: "About 120", isCorrect: true },
          { text: "About 500", isCorrect: false },
          { text: "About 1,000", isCorrect: false },
        ], "LOTO failures cause approximately 120 fatalities annually in the US."),
        quizQ("loto-q2", "After applying locks, what must you do before starting work?", [
          { text: "Wait 10 minutes", isCorrect: false },
          { text: "Call your supervisor", isCorrect: false },
          { text: "Verify the equipment is de-energized by attempting to restart", isCorrect: true },
          { text: "Remove the tags", isCorrect: false },
        ], "Verification by attempting to restart ensures the equipment is truly de-energized."),
        quizQ("loto-q3", "Can you remove another worker's lock from equipment?", [
          { text: "Yes, if you need to use the equipment", isCorrect: false },
          { text: "Yes, if they forgot to remove it", isCorrect: false },
          { text: "Never — each worker removes their own lock", isCorrect: true },
          { text: "Yes, with a supervisor's verbal permission", isCorrect: false },
        ], "Only the person who applied the lock may remove it. This is a fundamental LOTO safety rule."),
      ],
      passingScore: 70,
    },
  },

  // ─── 13. Stress Management Techniques ───────────────────────────────
  {
    title: "Stress Management for Shift Workers",
    description: "Recognize signs of workplace stress and learn practical coping strategies tailored for shift work environments.",
    contentType: "article",
    durationMinutes: 5,
    difficulty: "beginner",
    category: "Health & Wellness",
    tags: ["stress", "mental-health", "wellness"],
    language: "en",
    content: {
      blocks: [
        textBlock("sm-b1", "Shift work inherently creates stress through disrupted sleep, social isolation, and physical demands. Chronic stress affects your health, relationships, and job performance. Recognizing the signs early is key.\n\nSigns of Excessive Stress:\n• Difficulty sleeping even when you have time\n• Irritability or mood swings\n• Difficulty concentrating\n• Physical symptoms (headaches, stomach issues)\n• Withdrawal from social activities\n• Increased use of alcohol or caffeine", 0),
        textBlock("sm-b2", "Practical Stress Management Techniques:\n\n1. Box Breathing (4-4-4-4):\n   Breathe in for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat 4 times.\n\n2. Progressive Muscle Relaxation:\n   Tense each muscle group for 5 seconds, then release. Start from your toes and work up.\n\n3. The 5-4-3-2-1 Grounding Technique:\n   Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.\n\n4. Micro-breaks:\n   Take 2-minute breaks every hour to stretch, breathe, or step outside.\n\n5. Social Connection:\n   Maintain relationships despite irregular schedules. Even brief check-ins help.\n\n6. Physical Activity:\n   30 minutes of moderate exercise most days significantly reduces stress hormones.", 1),
      ],
      quizQuestions: [
        quizQ("sm-q1", "In box breathing, how long is each phase?", [
          { text: "2 seconds", isCorrect: false },
          { text: "4 seconds", isCorrect: true },
          { text: "10 seconds", isCorrect: false },
          { text: "30 seconds", isCorrect: false },
        ], "Box breathing uses 4-second intervals: breathe in, hold, exhale, hold."),
        quizQ("sm-q2", "Which is NOT a sign of excessive workplace stress?", [
          { text: "Difficulty sleeping", isCorrect: false },
          { text: "Increased energy and motivation", isCorrect: true },
          { text: "Irritability", isCorrect: false },
          { text: "Difficulty concentrating", isCorrect: false },
        ], "Increased energy and motivation are positive signs, not indicators of excessive stress."),
        quizQ("sm-q3", "How much exercise is recommended to reduce stress?", [
          { text: "5 minutes daily", isCorrect: false },
          { text: "30 minutes most days", isCorrect: true },
          { text: "2 hours daily", isCorrect: false },
          { text: "Exercise only on days off", isCorrect: false },
        ], "30 minutes of moderate exercise most days significantly reduces stress hormones."),
      ],
      passingScore: 70,
    },
  },

  // ─── 14. Electrical Safety ──────────────────────────────────────────
  {
    title: "Electrical Safety Awareness",
    description: "Recognize electrical hazards, understand safe work practices, and know what to do in case of electrical emergencies.",
    contentType: "mixed",
    durationMinutes: 6,
    difficulty: "intermediate",
    category: "Safety",
    tags: ["electrical", "safety", "hazards"],
    language: "en",
    content: {
      blocks: [
        textBlock("es-b1", "Electricity is invisible, silent, and deadly. Even low voltages can cause fatal injuries. Understanding electrical safety is essential whether you work directly with electrical systems or simply use powered equipment.\n\nCommon Electrical Hazards:\n• Damaged cords or plugs\n• Overloaded circuits\n• Wet conditions near electrical equipment\n• Missing ground pins on plugs\n• Exposed wiring\n• Improper use of extension cords", 0),
        textBlock("es-b2", "Safe Practices:\n\n1. Never use equipment with damaged cords — report and replace\n2. Don't overload outlets or power strips\n3. Keep electrical equipment away from water\n4. Use Ground Fault Circuit Interrupters (GFCIs) in wet areas\n5. Never remove the ground pin from a 3-prong plug\n6. De-energize equipment before inspection or repair\n7. Maintain at least 3 feet of clearance around electrical panels\n\nIf Someone Is Being Electrocuted:\n• Do NOT touch them directly\n• Disconnect the power source if safe to do so\n• Use a non-conductive object (dry wood, rubber) to separate them from the source\n• Call emergency services immediately\n• Begin CPR if they are unresponsive and not breathing", 1),
      ],
      quizQuestions: [
        quizQ("es-q1", "What should you do if you find a damaged electrical cord?", [
          { text: "Tape it up and keep using it", isCorrect: false },
          { text: "Report it and stop using the equipment", isCorrect: true },
          { text: "Ignore it if it still works", isCorrect: false },
          { text: "Cut off the damaged section", isCorrect: false },
        ], "Damaged cords should be reported and the equipment taken out of service until repaired."),
        quizQ("es-q2", "What device should be used in wet areas to prevent electrical shock?", [
          { text: "Extension cord", isCorrect: false },
          { text: "Power strip", isCorrect: false },
          { text: "GFCI (Ground Fault Circuit Interrupter)", isCorrect: true },
          { text: "Surge protector", isCorrect: false },
        ], "GFCIs detect ground faults and cut power in milliseconds, preventing electrocution."),
        quizQ("es-q3", "If someone is being electrocuted, you should first:", [
          { text: "Grab them and pull them away", isCorrect: false },
          { text: "Pour water on them", isCorrect: false },
          { text: "Disconnect the power source if safe", isCorrect: true },
          { text: "Wait for help", isCorrect: false },
        ], "Disconnect the power source first. Never touch someone being electrocuted directly."),
      ],
      passingScore: 70,
    },
  },

  // ─── 15. Diversity & Inclusion in the Workplace ─────────────────────
  {
    title: "Diversity & Inclusion in the Workplace",
    description: "Understand the importance of diversity and inclusion, recognize unconscious bias, and foster a respectful work environment.",
    contentType: "article",
    durationMinutes: 6,
    difficulty: "beginner",
    category: "HR & Compliance",
    tags: ["diversity", "inclusion", "bias", "hr"],
    language: "en",
    content: {
      blocks: [
        textBlock("di-b1", "A diverse and inclusive workplace drives innovation, improves decision-making, and creates a more positive work environment. Diversity refers to the presence of differences (race, gender, age, religion, disability, sexual orientation, education, background). Inclusion means ensuring everyone feels valued, respected, and has equal access to opportunities.\n\nWhy It Matters:\n• Diverse teams make better decisions 87% of the time\n• Inclusive companies are 1.7x more likely to be innovation leaders\n• Employees who feel included are 3x more engaged", 0),
        textBlock("di-b2", "Unconscious Bias:\n\nWe all have unconscious biases — mental shortcuts that can lead to unfair judgments. Common types:\n• Affinity bias — favoring people similar to us\n• Confirmation bias — seeking information that confirms existing beliefs\n• Halo effect — letting one positive trait influence overall perception\n\nCombating Bias:\n1. Acknowledge that everyone has biases\n2. Slow down decision-making — don't rely on gut feelings alone\n3. Seek diverse perspectives before making judgments\n4. Challenge stereotypes when you notice them\n5. Use inclusive language\n6. Speak up when you witness discrimination or exclusion", 1),
      ],
      quizQuestions: [
        quizQ("di-q1", "What is the difference between diversity and inclusion?", [
          { text: "They mean the same thing", isCorrect: false },
          { text: "Diversity is about differences; inclusion is about ensuring everyone feels valued", isCorrect: true },
          { text: "Diversity is about hiring; inclusion is about firing", isCorrect: false },
          { text: "There is no meaningful difference", isCorrect: false },
        ], "Diversity is the presence of differences; inclusion ensures everyone feels valued and has equal opportunities."),
        quizQ("di-q2", "What is affinity bias?", [
          { text: "Disliking people who are different", isCorrect: false },
          { text: "Favoring people who are similar to us", isCorrect: true },
          { text: "Being afraid of change", isCorrect: false },
          { text: "Preferring to work alone", isCorrect: false },
        ], "Affinity bias is the tendency to favor people who are similar to ourselves."),
        quizQ("di-q3", "Inclusive companies are how much more likely to be innovation leaders?", [
          { text: "1.2x", isCorrect: false },
          { text: "1.7x", isCorrect: true },
          { text: "3x", isCorrect: false },
          { text: "5x", isCorrect: false },
        ], "Research shows inclusive companies are 1.7x more likely to be innovation leaders."),
      ],
      passingScore: 70,
    },
  },

  // ─── 16-30: More lessons covering remaining topics ──────────────────
  {
    title: "Personal Protective Equipment (PPE) Guide",
    description: "Complete guide to selecting, wearing, and maintaining PPE for various workplace hazards.",
    contentType: "mixed", durationMinutes: 7, difficulty: "beginner", category: "Safety",
    tags: ["ppe", "safety", "equipment"], language: "en",
    content: {
      blocks: [
        textBlock("ppe-b1", "Personal Protective Equipment (PPE) is your last line of defense against workplace hazards. Selecting the right PPE depends on the specific hazards you face.\n\nTypes of PPE:\n• Head Protection: Hard hats, bump caps\n• Eye/Face Protection: Safety glasses, goggles, face shields\n• Hearing Protection: Earplugs, earmuffs\n• Respiratory Protection: Dust masks, respirators\n• Hand Protection: Gloves (chemical, cut-resistant, thermal)\n• Foot Protection: Steel-toed boots, slip-resistant shoes\n• Body Protection: High-visibility vests, coveralls, aprons", 0),
        textBlock("ppe-b2", "PPE Best Practices:\n\n1. Always inspect PPE before use — check for cracks, tears, or wear\n2. Ensure proper fit — ill-fitting PPE reduces protection\n3. Replace damaged PPE immediately\n4. Clean and store PPE properly after each use\n5. Never modify PPE (drilling holes in hard hats, cutting glove fingers)\n6. Use the right PPE for the specific hazard\n7. Complete required fit testing for respirators\n8. Report any PPE issues to your supervisor", 1),
      ],
      quizQuestions: [
        quizQ("ppe-q1", "When should you inspect your PPE?", [
          { text: "Once a month", isCorrect: false },
          { text: "Before each use", isCorrect: true },
          { text: "Only when it looks damaged", isCorrect: false },
          { text: "During annual reviews", isCorrect: false },
        ], "PPE should be inspected before each use to ensure it provides proper protection."),
        quizQ("ppe-q2", "What should you do with damaged PPE?", [
          { text: "Repair it with tape", isCorrect: false },
          { text: "Replace it immediately", isCorrect: true },
          { text: "Keep using it until replacement arrives", isCorrect: false },
          { text: "Give it to someone else", isCorrect: false },
        ], "Damaged PPE should be replaced immediately as it no longer provides adequate protection."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Workplace Bullying & Harassment Prevention",
    description: "Recognize, prevent, and respond to workplace bullying and harassment to maintain a safe and respectful environment.",
    contentType: "article", durationMinutes: 6, difficulty: "beginner", category: "HR & Compliance",
    tags: ["harassment", "bullying", "hr", "compliance"], language: "en",
    content: {
      blocks: [
        textBlock("bh-b1", "Workplace bullying and harassment create toxic environments that harm individuals and organizations. Understanding what constitutes harassment and knowing how to respond is essential for every worker.\n\nDefinitions:\n• Bullying: Repeated, unreasonable behavior directed at a worker that creates a risk to health and safety\n• Harassment: Unwelcome conduct based on protected characteristics (race, gender, religion, etc.)\n• Sexual Harassment: Unwelcome sexual advances, requests for favors, or other verbal/physical conduct of a sexual nature", 0),
        textBlock("bh-b2", "What To Do:\n\n1. Document incidents — date, time, witnesses, what happened\n2. Tell the person to stop if you feel safe doing so\n3. Report to your supervisor, HR, or use the anonymous reporting system\n4. Support colleagues who are being bullied or harassed\n5. Never retaliate — use proper channels\n\nAs a Bystander:\n• Don't ignore it — silence enables the behavior\n• Check in with the affected person privately\n• Report what you witnessed\n• Be willing to serve as a witness if needed", 1),
      ],
      quizQuestions: [
        quizQ("bh-q1", "What is the first step you should take if you experience harassment?", [
          { text: "Confront the person aggressively", isCorrect: false },
          { text: "Document the incident with details", isCorrect: true },
          { text: "Ignore it and hope it stops", isCorrect: false },
          { text: "Post about it on social media", isCorrect: false },
        ], "Documentation is crucial — record dates, times, witnesses, and details of each incident."),
        quizQ("bh-q2", "As a bystander witnessing harassment, you should:", [
          { text: "Mind your own business", isCorrect: false },
          { text: "Join in to fit in", isCorrect: false },
          { text: "Report what you witnessed and support the affected person", isCorrect: true },
          { text: "Wait to see if it happens again", isCorrect: false },
        ], "Bystanders play a critical role — report incidents and support affected colleagues."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Infection Control & Hand Hygiene",
    description: "Learn proper infection control practices including hand hygiene, surface disinfection, and respiratory etiquette.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner", category: "Health & Wellness",
    tags: ["infection-control", "hygiene", "health"], language: "en",
    content: {
      blocks: [
        textBlock("ic-b1", "Infection control prevents the spread of illness in the workplace. This is critical in healthcare, food service, and any environment where people work in close proximity.\n\nThe Chain of Infection:\n1. Infectious Agent (germ)\n2. Reservoir (where it lives)\n3. Portal of Exit (how it leaves)\n4. Mode of Transmission (how it spreads)\n5. Portal of Entry (how it enters a new host)\n6. Susceptible Host\n\nBreak any link in the chain to prevent infection.", 0),
        textBlock("ic-b2", "Hand Hygiene — Your Best Defense:\n\nWash with soap and water:\n• When hands are visibly soiled\n• After using the restroom\n• Before eating\n• After sneezing or coughing\n\nUse alcohol-based hand sanitizer (60%+ alcohol):\n• Between patient contacts (healthcare)\n• When soap and water aren't available\n• After touching shared surfaces\n\nProper technique: Cover all surfaces of hands, rub for 20+ seconds, dry thoroughly.", 1),
      ],
      quizQuestions: [
        quizQ("ic-q1", "How many links are in the chain of infection?", [
          { text: "4", isCorrect: false },
          { text: "6", isCorrect: true },
          { text: "8", isCorrect: false },
          { text: "3", isCorrect: false },
        ], "The chain of infection has 6 links. Breaking any one prevents infection."),
        quizQ("ic-q2", "What minimum alcohol concentration should hand sanitizer contain?", [
          { text: "30%", isCorrect: false },
          { text: "60%", isCorrect: true },
          { text: "90%", isCorrect: false },
          { text: "10%", isCorrect: false },
        ], "Hand sanitizer should contain at least 60% alcohol to be effective."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Working at Heights Safety",
    description: "Essential fall protection knowledge for workers who perform tasks above ground level.",
    contentType: "mixed", durationMinutes: 7, difficulty: "intermediate", category: "Safety",
    tags: ["heights", "fall-protection", "safety"], language: "en",
    content: {
      blocks: [
        textBlock("wh-b1", "Falls from height are one of the leading causes of workplace fatalities. Any work performed 6 feet or more above a lower level requires fall protection.\n\nTypes of Fall Protection:\n• Guardrails — passive protection, no action required by worker\n• Safety Nets — catch falling workers\n• Personal Fall Arrest Systems (PFAS) — harness + lanyard + anchor point\n• Travel Restraint — prevents reaching the edge\n• Positioning Systems — supports worker at the work location", 0),
        textBlock("wh-b2", "Harness Inspection (before each use):\n\n1. Check webbing for cuts, burns, fraying, or chemical damage\n2. Inspect buckles and D-rings for cracks or deformation\n3. Verify stitching is intact\n4. Check labels for expiration date\n5. Ensure the shock absorber is not deployed\n\nLadder Safety:\n• Maintain 3 points of contact at all times\n• Face the ladder when climbing\n• Don't overreach — move the ladder instead\n• Secure the ladder at the top or have someone hold it\n• Inspect before use — check for damage", 1),
      ],
      quizQuestions: [
        quizQ("wh-q1", "At what height is fall protection required?", [
          { text: "4 feet", isCorrect: false },
          { text: "6 feet", isCorrect: true },
          { text: "10 feet", isCorrect: false },
          { text: "Any height", isCorrect: false },
        ], "Fall protection is required at 6 feet or more above a lower level (general industry)."),
        quizQ("wh-q2", "How many points of contact should you maintain on a ladder?", [
          { text: "1", isCorrect: false },
          { text: "2", isCorrect: false },
          { text: "3", isCorrect: true },
          { text: "4", isCorrect: false },
        ], "Always maintain 3 points of contact (two hands and one foot, or two feet and one hand)."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Effective Team Communication",
    description: "Build stronger team communication skills including active listening, feedback delivery, and cross-cultural awareness.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner", category: "Communication",
    tags: ["communication", "teamwork", "leadership"], language: "en",
    content: {
      blocks: [
        textBlock("etc-b1", "Clear communication is the backbone of effective teamwork, especially in shift environments where information must flow accurately between rotating teams.\n\nActive Listening Skills:\n• Give full attention — put away distractions\n• Don't interrupt — let the speaker finish\n• Paraphrase to confirm understanding\n• Ask clarifying questions\n• Watch for non-verbal cues", 0),
        textBlock("etc-b2", "Giving Constructive Feedback:\n\nUse the SBI Model:\n• Situation: Describe when and where\n• Behavior: Describe what you observed (facts, not judgments)\n• Impact: Explain the effect of the behavior\n\nExample: 'During yesterday's handover (Situation), you walked me through each pending task with the checklist (Behavior), which helped me start my shift confidently and on time (Impact).'\n\nCross-Cultural Communication:\n• Be aware that communication styles vary across cultures\n• Avoid slang and idioms that may not translate\n• Be patient with language differences\n• Ask rather than assume", 1),
      ],
      quizQuestions: [
        quizQ("etc-q1", "What does the 'B' in the SBI feedback model stand for?", [
          { text: "Blame", isCorrect: false },
          { text: "Behavior", isCorrect: true },
          { text: "Benefit", isCorrect: false },
          { text: "Background", isCorrect: false },
        ], "B stands for Behavior — describe what you observed factually."),
        quizQ("etc-q2", "Which is an active listening technique?", [
          { text: "Planning your response while they talk", isCorrect: false },
          { text: "Checking your phone occasionally", isCorrect: false },
          { text: "Paraphrasing to confirm understanding", isCorrect: true },
          { text: "Interrupting with your own experience", isCorrect: false },
        ], "Paraphrasing confirms you understood correctly and shows the speaker you're engaged."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Data Privacy & Cybersecurity Basics",
    description: "Protect sensitive data and recognize cyber threats including phishing, social engineering, and password security.",
    contentType: "mixed", durationMinutes: 6, difficulty: "beginner", category: "Compliance",
    tags: ["cybersecurity", "data-privacy", "phishing"], language: "en",
    content: {
      blocks: [
        textBlock("dp-b1", "Every worker handles sensitive data — customer information, financial records, health data, or proprietary business information. A single data breach can cost millions and damage trust irreparably.\n\nCommon Cyber Threats:\n• Phishing — fraudulent emails/messages designed to steal credentials\n• Social Engineering — manipulating people into revealing information\n• Malware — malicious software installed through downloads or links\n• Ransomware — encrypts your files and demands payment\n• Insider Threats — intentional or accidental data exposure by employees", 0),
        textBlock("dp-b2", "Protect Yourself and Your Organization:\n\n1. Password Security:\n   • Use unique passwords for each account\n   • Minimum 12 characters with mixed types\n   • Enable multi-factor authentication (MFA)\n   • Never share passwords\n\n2. Recognizing Phishing:\n   • Check sender email addresses carefully\n   • Hover over links before clicking\n   • Be suspicious of urgency or threats\n   • Verify requests through official channels\n\n3. Data Handling:\n   • Lock your screen when stepping away\n   • Don't discuss sensitive info in public areas\n   • Use encrypted channels for sensitive communications\n   • Follow your organization's data classification policy\n   • Report suspicious activity immediately", 1),
      ],
      quizQuestions: [
        quizQ("dp-q1", "What is phishing?", [
          { text: "A type of malware", isCorrect: false },
          { text: "Fraudulent messages designed to steal credentials", isCorrect: true },
          { text: "A network security tool", isCorrect: false },
          { text: "An encryption method", isCorrect: false },
        ], "Phishing uses fraudulent emails or messages to trick people into revealing sensitive information."),
        quizQ("dp-q2", "What is the minimum recommended password length?", [
          { text: "6 characters", isCorrect: false },
          { text: "8 characters", isCorrect: false },
          { text: "12 characters", isCorrect: true },
          { text: "4 characters", isCorrect: false },
        ], "Modern security standards recommend at least 12 characters for passwords."),
        quizQ("dp-q3", "What should you do when you step away from your computer?", [
          { text: "Leave it as is", isCorrect: false },
          { text: "Lock your screen", isCorrect: true },
          { text: "Close the browser only", isCorrect: false },
          { text: "Turn off the monitor", isCorrect: false },
        ], "Always lock your screen to prevent unauthorized access to sensitive information."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "First Aid Fundamentals",
    description: "Learn basic first aid skills including CPR awareness, wound care, and when to call emergency services.",
    contentType: "mixed", durationMinutes: 8, difficulty: "intermediate", category: "Safety",
    tags: ["first-aid", "cpr", "emergency"], language: "en",
    content: {
      blocks: [
        textBlock("fa-b1", "Basic first aid knowledge can save lives. While you may not be a trained medical professional, knowing how to respond in the first minutes of an emergency is critical.\n\nThe Primary Survey (DR ABC):\n• Danger — Is the scene safe?\n• Response — Is the person responsive? Tap shoulders and shout\n• Airway — Is the airway clear? Tilt head, lift chin\n• Breathing — Are they breathing normally? Look, listen, feel\n• Circulation — Is there severe bleeding? Apply pressure", 0),
        textBlock("fa-b2", "Common First Aid Scenarios:\n\n1. Bleeding:\n   • Apply direct pressure with a clean cloth\n   • Elevate the injured area above the heart\n   • Apply a pressure bandage\n   • Call emergency services for severe bleeding\n\n2. Burns:\n   • Cool under running water for at least 20 minutes\n   • Remove jewelry near the burn\n   • Cover with a sterile dressing\n   • Never apply ice, butter, or creams\n\n3. Choking (conscious adult):\n   • Encourage coughing\n   • Give 5 back blows between shoulder blades\n   • Give 5 abdominal thrusts (Heimlich maneuver)\n   • Alternate until object is expelled or person becomes unconscious\n\nWhen to Call Emergency Services:\n• Unconsciousness\n• Difficulty breathing\n• Severe bleeding\n• Suspected heart attack or stroke\n• Severe allergic reaction\n• Seizures", 1),
      ],
      quizQuestions: [
        quizQ("fa-q1", "What does the 'D' in DR ABC stand for?", [
          { text: "Diagnose", isCorrect: false },
          { text: "Danger", isCorrect: true },
          { text: "Direct", isCorrect: false },
          { text: "Deliver", isCorrect: false },
        ], "D stands for Danger — always check if the scene is safe before approaching."),
        quizQ("fa-q2", "How long should you cool a burn under running water?", [
          { text: "5 minutes", isCorrect: false },
          { text: "10 minutes", isCorrect: false },
          { text: "At least 20 minutes", isCorrect: true },
          { text: "1 minute", isCorrect: false },
        ], "Burns should be cooled under running water for at least 20 minutes."),
        quizQ("fa-q3", "What should you NEVER apply to a burn?", [
          { text: "Cool water", isCorrect: false },
          { text: "Sterile dressing", isCorrect: false },
          { text: "Ice or butter", isCorrect: true },
          { text: "A loose bandage", isCorrect: false },
        ], "Never apply ice, butter, or creams to burns — they can cause further tissue damage."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Environmental Awareness & Sustainability",
    description: "Understand your role in workplace sustainability including waste reduction, energy conservation, and environmental compliance.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner", category: "Compliance",
    tags: ["environment", "sustainability", "waste"], language: "en",
    content: {
      blocks: [
        textBlock("env-b1", "Every workplace has an environmental footprint. As a shift worker, your daily actions contribute to — or reduce — that impact. Environmental compliance isn't just about regulations; it's about creating a sustainable future.\n\nThe 3 R's Hierarchy:\n1. Reduce — minimize waste at the source\n2. Reuse — find new purposes for materials\n3. Recycle — process materials into new products", 0),
        textBlock("env-b2", "What You Can Do:\n\n• Turn off lights and equipment when not in use\n• Report leaks (water, air, chemicals) immediately\n• Sort waste correctly into designated bins\n• Use digital documents instead of printing when possible\n• Follow proper chemical disposal procedures\n• Minimize water usage\n• Report environmental spills immediately\n• Suggest improvements to your supervisor\n\nRegulatory Awareness:\n• Know your facility's environmental permits\n• Understand spill response procedures\n• Follow waste disposal regulations\n• Maintain required environmental records", 1),
      ],
      quizQuestions: [
        quizQ("env-q1", "What is the first step in the 3 R's hierarchy?", [
          { text: "Recycle", isCorrect: false },
          { text: "Reuse", isCorrect: false },
          { text: "Reduce", isCorrect: true },
          { text: "Refuse", isCorrect: false },
        ], "Reduce is the first and most impactful step — minimize waste at the source."),
        quizQ("env-q2", "What should you do if you discover an environmental spill?", [
          { text: "Clean it up yourself", isCorrect: false },
          { text: "Report it immediately", isCorrect: true },
          { text: "Wait for the next shift", isCorrect: false },
          { text: "Ignore it if it's small", isCorrect: false },
        ], "Environmental spills must be reported immediately regardless of size."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Confined Space Entry Safety",
    description: "Understand the hazards of confined spaces and the procedures required for safe entry and rescue.",
    contentType: "mixed", durationMinutes: 8, difficulty: "advanced", category: "Safety",
    tags: ["confined-space", "safety", "permit"], language: "en",
    content: {
      blocks: [
        textBlock("cse-b1", "A confined space is any area that: has limited openings for entry/exit, is not designed for continuous occupancy, and is large enough for a worker to enter. Examples include tanks, silos, vaults, pits, and manholes.\n\nHazards:\n• Oxygen deficiency or enrichment\n• Toxic atmospheres (H2S, CO, methane)\n• Engulfment (grain, sand, water)\n• Entrapment\n• Electrical hazards\n• Extreme temperatures", 0),
        textBlock("cse-b2", "Permit-Required Confined Space Entry:\n\n1. Obtain an entry permit from the competent person\n2. Test the atmosphere BEFORE entry (O2, LEL, toxics)\n3. Ventilate the space continuously\n4. Assign an attendant who stays outside at all times\n5. Establish rescue procedures before entry\n6. Use appropriate PPE and communication equipment\n7. Monitor the atmosphere continuously during entry\n8. Cancel the permit if conditions change\n\nNever enter a confined space to rescue someone without proper training and equipment. More than 60% of confined space fatalities are would-be rescuers.", 1),
      ],
      quizQuestions: [
        quizQ("cse-q1", "What must be done BEFORE entering a confined space?", [
          { text: "Start working immediately", isCorrect: false },
          { text: "Test the atmosphere", isCorrect: true },
          { text: "Remove all ventilation", isCorrect: false },
          { text: "Close all openings", isCorrect: false },
        ], "Atmospheric testing before entry is mandatory to detect oxygen levels and toxic gases."),
        quizQ("cse-q2", "What percentage of confined space fatalities are would-be rescuers?", [
          { text: "About 10%", isCorrect: false },
          { text: "About 30%", isCorrect: false },
          { text: "More than 60%", isCorrect: true },
          { text: "Less than 5%", isCorrect: false },
        ], "Over 60% of confined space deaths are rescuers who entered without proper equipment."),
        quizQ("cse-q3", "What role must remain outside the confined space at all times?", [
          { text: "The supervisor", isCorrect: false },
          { text: "The attendant", isCorrect: true },
          { text: "The entry worker", isCorrect: false },
          { text: "The permit issuer", isCorrect: false },
        ], "The attendant must remain outside at all times to monitor conditions and summon rescue if needed."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Noise Exposure & Hearing Conservation",
    description: "Understand noise hazards, decibel levels, and hearing protection strategies to prevent permanent hearing loss.",
    contentType: "mixed", durationMinutes: 5, difficulty: "intermediate", category: "Safety",
    tags: ["noise", "hearing", "ppe"], language: "en",
    content: {
      blocks: [
        textBlock("nc-b1", "Noise-induced hearing loss is permanent and irreversible. Prolonged exposure to noise above 85 decibels (dB) can cause damage. For reference:\n• Normal conversation: 60 dB\n• Lawn mower: 90 dB\n• Power tools: 100 dB\n• Rock concert: 110 dB\n• Jet engine: 140 dB\n\nAt 85 dB, damage can occur after 8 hours. For every 3 dB increase, the safe exposure time is cut in half.", 0),
        textBlock("nc-b2", "Hearing Protection:\n\n1. Earplugs — inserted into the ear canal\n   • Foam: NRR 25-33 dB, disposable\n   • Reusable: NRR 20-27 dB, washable\n\n2. Earmuffs — cover the entire ear\n   • NRR 20-30 dB\n   • Better for intermittent noise\n\n3. Combination — earplugs + earmuffs for extreme noise\n\nBest Practices:\n• Wear hearing protection consistently — even brief unprotected exposure causes damage\n• Get annual hearing tests (audiograms)\n• Report changes in hearing immediately\n• Keep hearing protection clean and in good condition", 1),
      ],
      quizQuestions: [
        quizQ("nc-q1", "At what decibel level can noise begin to cause hearing damage?", [
          { text: "60 dB", isCorrect: false },
          { text: "75 dB", isCorrect: false },
          { text: "85 dB", isCorrect: true },
          { text: "100 dB", isCorrect: false },
        ], "Prolonged exposure to noise above 85 dB can cause permanent hearing damage."),
        quizQ("nc-q2", "For every 3 dB increase above 85 dB, the safe exposure time:", [
          { text: "Doubles", isCorrect: false },
          { text: "Is cut in half", isCorrect: true },
          { text: "Stays the same", isCorrect: false },
          { text: "Decreases by 10%", isCorrect: false },
        ], "The 3 dB exchange rate means safe exposure time halves with each 3 dB increase."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Quality Control Basics",
    description: "Understand quality control principles, inspection techniques, and your role in maintaining product/service quality.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner", category: "Operations",
    tags: ["quality", "inspection", "standards"], language: "en",
    content: {
      blocks: [
        textBlock("qc-b1", "Quality control (QC) ensures products and services meet established standards. Every worker plays a role in maintaining quality, regardless of their position.\n\nKey QC Principles:\n• Prevention over detection — it's cheaper to prevent defects than fix them\n• Continuous improvement — always look for ways to do things better\n• Customer focus — quality is defined by the customer\n• Data-driven decisions — use measurements, not opinions", 0),
        textBlock("qc-b2", "Your Role in Quality:\n\n1. Follow standard operating procedures (SOPs) exactly\n2. Inspect your work before passing it to the next step\n3. Report defects or deviations immediately\n4. Suggest improvements through your quality system\n5. Participate in quality training and audits\n6. Maintain clean, organized work areas\n7. Use calibrated tools and equipment\n8. Document your work accurately\n\nThe Cost of Poor Quality:\n• Rework and scrap\n• Customer complaints and returns\n• Lost reputation and business\n• Regulatory penalties\n• Safety incidents", 1),
      ],
      quizQuestions: [
        quizQ("qc-q1", "What is more cost-effective in quality management?", [
          { text: "Detecting defects after production", isCorrect: false },
          { text: "Preventing defects before they occur", isCorrect: true },
          { text: "Ignoring minor defects", isCorrect: false },
          { text: "Letting customers find defects", isCorrect: false },
        ], "Prevention is always cheaper than detection and correction of defects."),
        quizQ("qc-q2", "Who defines quality?", [
          { text: "The production manager", isCorrect: false },
          { text: "The quality department", isCorrect: false },
          { text: "The customer", isCorrect: true },
          { text: "The CEO", isCorrect: false },
        ], "Quality is ultimately defined by the customer — meeting or exceeding their expectations."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Emergency Evacuation Procedures",
    description: "Know your role during emergency evacuations including alarm recognition, exit routes, and assembly point protocols.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner", category: "Safety",
    tags: ["evacuation", "emergency", "safety"], language: "en",
    content: {
      blocks: [
        textBlock("ee-b1", "When an emergency occurs, a well-practiced evacuation plan saves lives. Every worker must know the evacuation procedures for their specific work area.\n\nBefore an Emergency:\n• Know at least 2 exit routes from your work area\n• Identify the nearest fire alarm pull station\n• Know the location of your assembly point\n• Understand alarm signals and their meanings\n• Know who your floor/area warden is\n• Participate in all evacuation drills", 0),
        textBlock("ee-b2", "During an Evacuation:\n\n1. When the alarm sounds, stop work immediately\n2. Secure hazardous processes if safe and quick to do so\n3. Leave personal belongings behind\n4. Close doors behind you (don't lock them)\n5. Use stairs, NEVER elevators\n6. Assist anyone who needs help\n7. Proceed to the designated assembly point\n8. Report to your warden for headcount\n9. Do NOT re-enter until the all-clear is given\n\nIf Trapped:\n• Close the door and seal gaps with cloth\n• Call emergency services and give your location\n• Signal from a window if possible\n• Stay low if there is smoke (cleaner air is near the floor)", 1),
      ],
      quizQuestions: [
        quizQ("ee-q1", "How many exit routes should you know from your work area?", [
          { text: "1", isCorrect: false },
          { text: "At least 2", isCorrect: true },
          { text: "3 or more", isCorrect: false },
          { text: "It doesn't matter", isCorrect: false },
        ], "You should know at least 2 exit routes in case one is blocked during an emergency."),
        quizQ("ee-q2", "During an evacuation, should you use the elevator?", [
          { text: "Yes, it's faster", isCorrect: false },
          { text: "Only if you're on a high floor", isCorrect: false },
          { text: "Never — always use stairs", isCorrect: true },
          { text: "Only if the fire is on a different floor", isCorrect: false },
        ], "Never use elevators during an evacuation — they can malfunction or open on the fire floor."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Shift Work & Nutrition",
    description: "Optimize your diet for shift work with practical meal planning, hydration strategies, and energy management tips.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner", category: "Health & Wellness",
    tags: ["nutrition", "health", "shift-work", "diet"], language: "en",
    content: {
      blocks: [
        textBlock("sn-b1", "Shift workers are at higher risk for digestive issues, weight gain, and metabolic disorders due to eating at irregular times. Strategic nutrition can significantly improve your energy, health, and performance.\n\nKey Principles:\n• Eat your main meal before your shift starts\n• Have light, balanced snacks during your shift\n• Avoid heavy meals within 2 hours of sleeping\n• Stay hydrated — dehydration mimics fatigue\n• Limit processed foods, sugar, and excessive caffeine", 0),
        textBlock("sn-b2", "Meal Planning for Shift Workers:\n\nBefore Shift:\n• Complex carbs + lean protein + healthy fats\n• Example: Grilled chicken with brown rice and vegetables\n\nDuring Shift (snacks):\n• Nuts and seeds\n• Fresh fruit\n• Yogurt\n• Whole grain crackers with hummus\n• Vegetables with dip\n\nAfter Shift:\n• Light meal if hungry\n• Avoid caffeine, alcohol, and heavy foods\n• Herbal tea can aid relaxation\n\nHydration:\n• Aim for 8+ glasses of water per day\n• Keep a water bottle at your workstation\n• Monitor urine color — pale yellow indicates good hydration\n• Limit sugary drinks and energy drinks", 1),
      ],
      quizQuestions: [
        quizQ("sn-q1", "When should you eat your main meal relative to your shift?", [
          { text: "During the shift", isCorrect: false },
          { text: "Before the shift starts", isCorrect: true },
          { text: "After the shift ends", isCorrect: false },
          { text: "It doesn't matter", isCorrect: false },
        ], "Eating your main meal before your shift provides sustained energy throughout."),
        quizQ("sn-q2", "What color should your urine be for good hydration?", [
          { text: "Dark yellow", isCorrect: false },
          { text: "Clear", isCorrect: false },
          { text: "Pale yellow", isCorrect: true },
          { text: "Orange", isCorrect: false },
        ], "Pale yellow urine indicates good hydration. Dark yellow suggests dehydration."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Workplace Ergonomics for Computer Users",
    description: "Set up an ergonomic workstation and learn exercises to prevent repetitive strain injuries from computer work.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner", category: "Health & Wellness",
    tags: ["ergonomics", "computer", "rsi", "posture"], language: "en",
    content: {
      blocks: [
        textBlock("we-b1", "If your shift involves computer work, poor ergonomics can lead to repetitive strain injuries (RSI), carpal tunnel syndrome, eye strain, and chronic back pain.\n\nIdeal Workstation Setup:\n• Monitor: Top of screen at eye level, arm's length away\n• Chair: Feet flat on floor, knees at 90°, back supported\n• Keyboard: Elbows at 90°, wrists neutral (not bent)\n• Mouse: Close to keyboard, wrist straight\n• Lighting: No glare on screen, adequate ambient light", 0),
        textBlock("we-b2", "The 20-20-20 Rule for Eye Strain:\nEvery 20 minutes, look at something 20 feet away for 20 seconds.\n\nDesk Exercises (do every hour):\n1. Neck rolls — slowly roll head in circles\n2. Shoulder shrugs — raise shoulders to ears, hold 5 sec, release\n3. Wrist circles — rotate wrists in both directions\n4. Finger stretches — spread fingers wide, hold 5 sec\n5. Seated spinal twist — rotate torso left and right\n6. Standing stretch — reach arms overhead and stretch\n\nWarning Signs of RSI:\n• Tingling or numbness in hands/fingers\n• Pain in wrists, forearms, or shoulders\n• Weakness in grip\n• Stiffness in neck or back\n\nSeek medical attention if symptoms persist.", 1),
      ],
      quizQuestions: [
        quizQ("we-q1", "Where should the top of your monitor be positioned?", [
          { text: "Below desk level", isCorrect: false },
          { text: "At eye level", isCorrect: true },
          { text: "Above head height", isCorrect: false },
          { text: "At chest level", isCorrect: false },
        ], "The top of the monitor should be at eye level to maintain a neutral neck position."),
        quizQ("we-q2", "How often should you follow the 20-20-20 rule?", [
          { text: "Every 5 minutes", isCorrect: false },
          { text: "Every 20 minutes", isCorrect: true },
          { text: "Every hour", isCorrect: false },
          { text: "Once per shift", isCorrect: false },
        ], "Every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Leadership Skills for Shift Supervisors",
    description: "Develop essential leadership skills for managing shift teams including delegation, motivation, and performance management.",
    contentType: "mixed", durationMinutes: 8, difficulty: "advanced", category: "Leadership",
    tags: ["leadership", "management", "supervision"], language: "en",
    content: {
      blocks: [
        textBlock("ls-b1", "Effective shift supervision requires a unique blend of technical knowledge, people skills, and adaptability. As a shift leader, you set the tone for your entire team.\n\nCore Leadership Competencies:\n• Communication — clear, consistent, and timely\n• Decision-making — confident under pressure\n• Delegation — matching tasks to strengths\n• Accountability — owning outcomes, good and bad\n• Empathy — understanding team members' challenges\n• Adaptability — adjusting to changing conditions", 0),
        textBlock("ls-b2", "Effective Delegation:\n\n1. Choose the right person for the task\n2. Clearly communicate expectations and deadlines\n3. Provide necessary resources and authority\n4. Monitor progress without micromanaging\n5. Give feedback and recognition\n\nMotivating Your Team:\n• Recognize good work publicly and specifically\n• Provide growth opportunities\n• Listen to concerns and act on them\n• Lead by example — never ask others to do what you wouldn't\n• Create a psychologically safe environment where people can speak up\n• Celebrate team wins, not just individual achievements\n\nHandling Underperformance:\n• Address issues early and privately\n• Focus on specific behaviors, not personality\n• Set clear improvement expectations with timelines\n• Offer support and resources\n• Document conversations and follow up", 1),
      ],
      quizQuestions: [
        quizQ("ls-q1", "What is the first step in effective delegation?", [
          { text: "Set a deadline", isCorrect: false },
          { text: "Choose the right person for the task", isCorrect: true },
          { text: "Write detailed instructions", isCorrect: false },
          { text: "Monitor constantly", isCorrect: false },
        ], "Matching the right person to the task based on their strengths is the foundation of effective delegation."),
        quizQ("ls-q2", "How should you recognize good work?", [
          { text: "Privately and vaguely", isCorrect: false },
          { text: "Publicly and specifically", isCorrect: true },
          { text: "Only during annual reviews", isCorrect: false },
          { text: "Through email only", isCorrect: false },
        ], "Public, specific recognition reinforces desired behaviors and motivates the entire team."),
        quizQ("ls-q3", "When should underperformance be addressed?", [
          { text: "During the annual review", isCorrect: false },
          { text: "Only if it continues for months", isCorrect: false },
          { text: "Early and privately", isCorrect: true },
          { text: "In front of the team as an example", isCorrect: false },
        ], "Address underperformance early and privately to give the person the best chance to improve."),
      ],
      passingScore: 70,
    },
  },
  {
    title: "Incident Reporting & Investigation",
    description: "Learn how to properly report workplace incidents and participate in investigations to prevent recurrence.",
    contentType: "mixed", durationMinutes: 6, difficulty: "intermediate", category: "Compliance",
    tags: ["incident", "reporting", "investigation", "compliance"], language: "en",
    content: {
      blocks: [
        textBlock("ir-b1", "Every workplace incident — whether it results in injury or not — is an opportunity to improve safety. Near-misses are especially valuable because they reveal hazards before someone gets hurt.\n\nTypes of Incidents to Report:\n• Injuries (no matter how minor)\n• Near-misses (almost-accidents)\n• Property damage\n• Environmental releases\n• Equipment malfunctions\n• Security breaches\n• Unsafe conditions or behaviors", 0),
        textBlock("ir-b2", "How to Report an Incident:\n\n1. Ensure the scene is safe and provide first aid if needed\n2. Report to your supervisor immediately\n3. Complete the incident report form with:\n   • Date, time, and location\n   • What happened (factual description)\n   • Who was involved or witnessed it\n   • What conditions contributed\n   • What actions were taken\n4. Preserve the scene if possible\n5. Cooperate with investigators\n\nThe 5 Whys Technique:\nAsk 'Why?' five times to get to the root cause.\nExample:\n• Why did the worker slip? The floor was wet.\n• Why was the floor wet? A pipe was leaking.\n• Why was the pipe leaking? It hadn't been maintained.\n• Why wasn't it maintained? No maintenance schedule existed.\n• Why was there no schedule? It was never established.\n\nRoot cause: Lack of preventive maintenance program.", 1),
      ],
      quizQuestions: [
        quizQ("ir-q1", "Why are near-misses valuable to report?", [
          { text: "They're not — only actual injuries matter", isCorrect: false },
          { text: "They reveal hazards before someone gets hurt", isCorrect: true },
          { text: "They're required by law only", isCorrect: false },
          { text: "They help with insurance claims", isCorrect: false },
        ], "Near-misses reveal hazards and provide opportunities to prevent actual injuries."),
        quizQ("ir-q2", "How many times do you ask 'Why?' in the root cause analysis technique?", [
          { text: "3 times", isCorrect: false },
          { text: "5 times", isCorrect: true },
          { text: "10 times", isCorrect: false },
          { text: "Once", isCorrect: false },
        ], "The 5 Whys technique involves asking 'Why?' five times to reach the root cause."),
      ],
      passingScore: 70,
    },
  },
];
