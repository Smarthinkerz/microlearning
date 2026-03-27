/**
 * 30 pre-built micro-lessons for shift workers across 6 categories.
 * Each lesson has 3-5 multiple-choice quiz questions and rich content blocks.
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
  thumbnailUrl?: string;
};

function tb(id: string, text: string, order: number) {
  return { id, type: "text" as const, data: { text }, order };
}

function ib(id: string, url: string, caption: string, order: number) {
  return { id, type: "image" as const, data: { url, caption }, order };
}

function qq(
  id: string,
  question: string,
  options: { text: string; isCorrect: boolean }[],
  explanation: string,
) {
  return {
    id, question, type: "multiple_choice" as const,
    options: options.map((o, i) => ({ id: `${id}-o${i}`, text: o.text, isCorrect: o.isCorrect })),
    explanation, points: 1,
  };
}

export const SEED_LESSONS: SeedLesson[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 1: Safety & Compliance (6 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 1. Fire Safety Basics
  {
    title: "Fire Safety Basics: How to Use Extinguishers",
    description: "Learn the fundamentals of fire safety including fire types, extinguisher selection, and the PASS technique for safe and effective fire response.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["fire", "safety", "extinguisher", "emergency"], language: "en",
    content: {
      blocks: [
        tb("fs1-b1", "Fire is one of the most dangerous workplace hazards. Every year, thousands of workplace fires cause injuries, deaths, and billions in property damage. As a shift worker, you may be the first person to discover a fire — knowing how to respond in the first 30 seconds can save lives.\n\nThere are five classes of fire:\n• Class A — Ordinary combustibles (wood, paper, cloth)\n• Class B — Flammable liquids (gasoline, oil, grease)\n• Class C — Electrical equipment\n• Class D — Combustible metals\n• Class K — Cooking oils and fats", 0),
        ib("fire-safety-basics-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-fire-safety-o8eCu6PWmnJSPc8YGwg6N9.webp", "Fire Safety Basics", 1),
        tb("fs1-b2", "The PASS Technique for Using a Fire Extinguisher:\n\n1. P — Pull the pin. This unlocks the operating lever.\n2. A — Aim low. Point the nozzle at the base of the fire, not the flames.\n3. S — Squeeze the lever slowly and evenly.\n4. S — Sweep the nozzle from side to side at the base of the fire.\n\nImportant: Only attempt to fight a fire if it is small and contained, you have a clear escape route behind you, and you have the correct type of extinguisher. If in doubt, evacuate immediately and call emergency services.", 1),
        tb("fs1-b3", "Fire Prevention Tips:\n\n• Keep work areas free of clutter and combustible materials\n• Never block fire exits or extinguisher access points\n• Report damaged electrical cords or overloaded outlets immediately\n• Know the location of all fire extinguishers on your floor\n• Participate in fire drills — they save lives when a real emergency occurs\n\nRemember: Your life is more valuable than any property. When in doubt, get out.", 2),
      ],
      quizQuestions: [
        qq("fs1-q1", "What does the 'A' in the PASS technique stand for?", [
          { text: "Activate the alarm", isCorrect: false },
          { text: "Aim at the base of the fire", isCorrect: true },
          { text: "Approach the fire quickly", isCorrect: false },
          { text: "Alert your supervisor", isCorrect: false },
        ], "The 'A' stands for Aim — always aim at the base of the fire, not the flames."),
        qq("fs1-q2", "Which class of fire involves flammable liquids like gasoline?", [
          { text: "Class A", isCorrect: false },
          { text: "Class B", isCorrect: true },
          { text: "Class C", isCorrect: false },
          { text: "Class K", isCorrect: false },
        ], "Class B fires involve flammable liquids such as gasoline, oil, and grease."),
        qq("fs1-q3", "When should you NOT attempt to fight a fire with an extinguisher?", [
          { text: "When the fire is small and contained", isCorrect: false },
          { text: "When you have a clear escape route", isCorrect: false },
          { text: "When the fire is large or spreading rapidly", isCorrect: true },
          { text: "When you have the correct extinguisher type", isCorrect: false },
        ], "Never fight a fire that is large or spreading rapidly. Evacuate immediately."),
        qq("fs1-q4", "What is the first thing you should do when using a fire extinguisher?", [
          { text: "Squeeze the lever", isCorrect: false },
          { text: "Aim at the flames", isCorrect: false },
          { text: "Pull the pin", isCorrect: true },
          { text: "Sweep side to side", isCorrect: false },
        ], "The first step in PASS is Pull the pin to unlock the operating lever."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-fire-safety-o8eCu6PWmnJSPc8YGwg6N9.webp",
  },

  // 2. Emergency Evacuation Routes
  {
    title: "Emergency Evacuation Routes: Quick Orientation",
    description: "Understand emergency evacuation procedures, exit routes, assembly points, and your role during a workplace evacuation.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["evacuation", "emergency", "safety", "routes"], language: "en",
    content: {
      blocks: [
        tb("ev2-b1", "In an emergency, seconds matter. Knowing your evacuation route before an emergency occurs is critical. Every workplace is required to have clearly marked evacuation routes, and as a shift worker, you must familiarize yourself with these routes at the start of every shift — especially if you work in different areas.\n\nKey evacuation principles:\n• Know at least two exit routes from your work area\n• Never use elevators during a fire evacuation\n• Walk quickly but do not run — running causes panic and injuries\n• Help colleagues with disabilities if safe to do so\n• Close doors behind you to slow the spread of fire and smoke", 0),
        ib("emergency-evacuation-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-evacuation-mM5yCpvCqt9K5CwiiP49wN.webp", "Emergency Evacuation Routes", 1),
        tb("ev2-b2", "Assembly Points:\n\nEvery workplace has designated assembly points where employees gather after evacuating. These are chosen to be:\n• A safe distance from the building\n• Away from emergency vehicle access routes\n• Large enough to accommodate all staff\n\nOnce at the assembly point:\n1. Report to your shift supervisor or fire warden\n2. Do NOT re-enter the building for any reason\n3. Account for all team members — report anyone missing\n4. Wait for the official all-clear before returning\n\nRemember: Practice evacuations regularly. The more familiar the route, the faster and safer your response.", 1),
      ],
      quizQuestions: [
        qq("ev2-q1", "How many exit routes should you know from your work area?", [
          { text: "One is enough", isCorrect: false },
          { text: "At least two", isCorrect: true },
          { text: "Only the main entrance", isCorrect: false },
          { text: "It depends on your role", isCorrect: false },
        ], "You should always know at least two exit routes in case one is blocked."),
        qq("ev2-q2", "What should you do when you reach the assembly point?", [
          { text: "Go back for your belongings", isCorrect: false },
          { text: "Leave the premises entirely", isCorrect: false },
          { text: "Report to your supervisor and wait for all-clear", isCorrect: true },
          { text: "Call your family immediately", isCorrect: false },
        ], "Report to your supervisor, account for team members, and wait for the official all-clear."),
        qq("ev2-q3", "Why should you NOT use elevators during a fire evacuation?", [
          { text: "They are too slow", isCorrect: false },
          { text: "They may lose power or fill with smoke", isCorrect: true },
          { text: "They are reserved for firefighters only", isCorrect: false },
          { text: "They go to the wrong floor", isCorrect: false },
        ], "Elevators can lose power, fill with smoke, or open on a fire floor during emergencies."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-evacuation-mM5yCpvCqt9K5CwiiP49wN.webp",
  },

  // 3. PPE Essentials
  {
    title: "PPE Essentials: Gloves, Masks, and Helmets",
    description: "Learn how to select, wear, and maintain personal protective equipment to stay safe in hazardous work environments.",
    contentType: "mixed", durationMinutes: 6, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["ppe", "safety", "gloves", "masks", "helmets"], language: "en",
    content: {
      blocks: [
        tb("ppe3-b1", "Personal Protective Equipment (PPE) is your last line of defense against workplace hazards. While engineering and administrative controls should reduce risks first, PPE protects you from remaining dangers.\n\nCommon types of PPE:\n• Head protection — Hard hats and bump caps protect against falling objects and head impacts\n• Eye protection — Safety glasses, goggles, and face shields guard against debris, chemicals, and radiation\n• Hand protection — Gloves vary by hazard: cut-resistant, chemical-resistant, thermal, and disposable\n• Respiratory protection — Masks and respirators filter dust, fumes, and airborne pathogens\n• Foot protection — Steel-toed boots protect against crushing and puncture hazards", 0),
        ib("ppe-essentials-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-ppe-dWEpmpeLLVebrCX7nQaBq2.webp", "PPE Essentials", 1),
        tb("ppe3-b2", "Proper PPE Use:\n\n1. Inspect before every use — check for cracks, tears, or wear\n2. Ensure proper fit — ill-fitting PPE reduces protection\n3. Wear all required PPE for your task — never skip items\n4. Replace damaged PPE immediately — do not attempt repairs\n5. Clean and store properly after each use\n\nCommon mistakes:\n• Wearing gloves that are too large (reduces grip and dexterity)\n• Not replacing disposable masks after recommended use period\n• Removing PPE in hazardous areas because it's uncomfortable\n\nRemember: PPE only works when worn correctly and consistently.", 1),
      ],
      quizQuestions: [
        qq("ppe3-q1", "What should you do before using PPE at the start of your shift?", [
          { text: "Put it on as fast as possible", isCorrect: false },
          { text: "Inspect it for damage or wear", isCorrect: true },
          { text: "Share it with a colleague", isCorrect: false },
          { text: "Store it in your locker", isCorrect: false },
        ], "Always inspect PPE before use to ensure it's in good condition and will protect you."),
        qq("ppe3-q2", "Why is proper fit important for PPE?", [
          { text: "It looks more professional", isCorrect: false },
          { text: "Ill-fitting PPE reduces its protective effectiveness", isCorrect: true },
          { text: "It's required by law only", isCorrect: false },
          { text: "It doesn't matter as long as you wear it", isCorrect: false },
        ], "PPE that doesn't fit properly cannot provide the intended level of protection."),
        qq("ppe3-q3", "What type of gloves should you use when handling chemicals?", [
          { text: "Cotton gloves", isCorrect: false },
          { text: "Leather gloves", isCorrect: false },
          { text: "Chemical-resistant gloves", isCorrect: true },
          { text: "Any disposable gloves", isCorrect: false },
        ], "Chemical-resistant gloves are specifically designed to prevent chemical penetration."),
        qq("ppe3-q4", "What should you do with damaged PPE?", [
          { text: "Repair it with tape", isCorrect: false },
          { text: "Continue using it until your shift ends", isCorrect: false },
          { text: "Replace it immediately", isCorrect: true },
          { text: "Give it to a new employee", isCorrect: false },
        ], "Damaged PPE must be replaced immediately — repairs compromise protection."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-ppe-dWEpmpeLLVebrCX7nQaBq2.webp",
  },

  // 4. Safe Lifting Techniques
  {
    title: "Safe Lifting Techniques: Preventing Back Injuries",
    description: "Master proper lifting mechanics to protect your spine and prevent the most common workplace injury — back strain.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["lifting", "ergonomics", "back", "safety"], language: "en",
    content: {
      blocks: [
        tb("sl4-b1", "Back injuries are the #1 workplace injury, accounting for nearly 20% of all workplace injuries and illnesses. Most are caused by improper lifting. Whether you're moving boxes, equipment, or supplies, proper technique is essential.\n\nThe Safe Lifting Steps:\n1. Plan your lift — assess the weight, your path, and where you'll set it down\n2. Stand close to the load with feet shoulder-width apart\n3. Bend at the knees, NOT the waist\n4. Get a firm grip with both hands\n5. Lift with your legs, keeping your back straight\n6. Keep the load close to your body\n7. Avoid twisting — pivot with your feet instead", 0),
        ib("safe-lifting-techniq-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-safe-lifting-TU8YVtU2hPEpZHLfUhjGo5.webp", "Safe Lifting Techniques", 1),
        tb("sl4-b2", "When NOT to Lift Alone:\n\n• The object weighs more than 50 pounds (23 kg)\n• You can't get a good grip on it\n• You can't see over or around it\n• The path is obstructed or uneven\n• The object is awkwardly shaped\n\nAlternatives to manual lifting:\n• Use a dolly, hand truck, or cart\n• Ask a coworker for help (team lift)\n• Use a forklift or hoist for heavy items\n\nRemember: There is no shame in asking for help. One back injury can affect you for life.", 1),
      ],
      quizQuestions: [
        qq("sl4-q1", "When lifting a heavy object, you should bend at the:", [
          { text: "Waist", isCorrect: false },
          { text: "Knees", isCorrect: true },
          { text: "Hips only", isCorrect: false },
          { text: "Neck", isCorrect: false },
        ], "Always bend at the knees and lift with your legs to protect your back."),
        qq("sl4-q2", "What should you do instead of twisting your body while carrying a load?", [
          { text: "Lean to one side", isCorrect: false },
          { text: "Pivot with your feet", isCorrect: true },
          { text: "Bend at the waist", isCorrect: false },
          { text: "Throw the object", isCorrect: false },
        ], "Pivoting with your feet prevents dangerous spinal twisting under load."),
        qq("sl4-q3", "At what weight should you generally NOT lift alone?", [
          { text: "25 pounds", isCorrect: false },
          { text: "35 pounds", isCorrect: false },
          { text: "50 pounds", isCorrect: true },
          { text: "75 pounds", isCorrect: false },
        ], "Objects over 50 pounds (23 kg) generally require assistance or mechanical aids."),
        qq("sl4-q4", "What is the first step before lifting any object?", [
          { text: "Grab it quickly", isCorrect: false },
          { text: "Plan your lift — assess weight and path", isCorrect: true },
          { text: "Stretch your back", isCorrect: false },
          { text: "Put on gloves", isCorrect: false },
        ], "Planning your lift helps you assess risks and choose the safest approach."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-safe-lifting-TU8YVtU2hPEpZHLfUhjGo5.webp",
  },

  // 5. Electrical Safety
  {
    title: "Electrical Safety: Handling Plugs and Cords",
    description: "Recognize electrical hazards and learn safe practices for handling plugs, cords, and electrical equipment in the workplace.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["electrical", "safety", "cords", "hazards"], language: "en",
    content: {
      blocks: [
        tb("es5-b1", "Electricity is invisible but deadly. Electrical accidents cause approximately 160 workplace deaths and thousands of injuries each year. Even low-voltage equipment can be dangerous if mishandled.\n\nCommon electrical hazards:\n• Damaged or frayed cords and plugs\n• Overloaded outlets and power strips\n• Wet conditions near electrical equipment\n• Missing ground prongs on plugs\n• Improper use of extension cords as permanent wiring\n• Exposed wires or open electrical panels", 0),
        ib("electrical-safety-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-electrical-safety-5Qr9YmUcZAzjorqfjKGo4b.webp", "Electrical Safety", 1),
        tb("es5-b2", "Safe Electrical Practices:\n\n1. Inspect cords before use — never use damaged cords\n2. Pull plugs by the plug body, never by the cord\n3. Never daisy-chain power strips or extension cords\n4. Keep electrical equipment away from water and wet surfaces\n5. Report any tingling sensation, sparks, or burning smells immediately\n6. Never attempt electrical repairs unless you are a qualified electrician\n7. Use Ground Fault Circuit Interrupters (GFCIs) in wet areas\n\nIf someone is being electrocuted:\n• Do NOT touch them directly\n• Disconnect the power source if safe to do so\n• Call emergency services immediately\n• Begin CPR if they are unresponsive and not breathing", 1),
      ],
      quizQuestions: [
        qq("es5-q1", "How should you remove a plug from an outlet?", [
          { text: "Pull the cord firmly", isCorrect: false },
          { text: "Yank it out quickly", isCorrect: false },
          { text: "Pull by the plug body", isCorrect: true },
          { text: "Use pliers", isCorrect: false },
        ], "Always grip the plug body when unplugging — pulling the cord damages the wiring."),
        qq("es5-q2", "What should you do if you notice a frayed electrical cord?", [
          { text: "Wrap it with tape and keep using it", isCorrect: false },
          { text: "Report it and stop using the equipment", isCorrect: true },
          { text: "Ignore it if the equipment still works", isCorrect: false },
          { text: "Cut off the frayed section", isCorrect: false },
        ], "Damaged cords are a fire and shock hazard — report and replace immediately."),
        qq("es5-q3", "If someone is being electrocuted, what should you do first?", [
          { text: "Grab them and pull them away", isCorrect: false },
          { text: "Throw water on them", isCorrect: false },
          { text: "Disconnect the power source if safe", isCorrect: true },
          { text: "Wait for it to stop", isCorrect: false },
        ], "Never touch someone being electrocuted. Disconnect the power source first if safe."),
        qq("es5-q4", "Why should you never daisy-chain power strips?", [
          { text: "It looks untidy", isCorrect: false },
          { text: "It can cause circuit overload and fire", isCorrect: true },
          { text: "It's against company policy only", isCorrect: false },
          { text: "It slows down the equipment", isCorrect: false },
        ], "Daisy-chaining power strips overloads circuits and is a major fire hazard."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-electrical-safety-5Qr9YmUcZAzjorqfjKGo4b.webp",
  },

  // 6. Food Hygiene Rules
  {
    title: "Food Hygiene Rules: Handwashing and Cross-Contamination",
    description: "Essential food safety practices including proper handwashing technique, preventing cross-contamination, and temperature control basics.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Safety & Compliance", tags: ["food", "hygiene", "handwashing", "safety"], language: "en",
    content: {
      blocks: [
        tb("fh6-b1", "Foodborne illness affects 1 in 6 people every year. If you work in food service, hospitality, or any role involving food handling, proper hygiene is non-negotiable.\n\nThe 20-Second Handwashing Rule:\n1. Wet hands with clean running water\n2. Apply soap and lather thoroughly\n3. Scrub all surfaces — backs of hands, between fingers, under nails\n4. Scrub for at least 20 seconds (hum 'Happy Birthday' twice)\n5. Rinse under clean running water\n6. Dry with a clean towel or air dryer\n\nWhen to wash hands:\n• Before handling food\n• After using the restroom\n• After touching raw meat, poultry, or seafood\n• After sneezing, coughing, or touching your face\n• After handling garbage or cleaning chemicals", 0),
        ib("food-hygiene-rules-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-food-hygiene-BtzURbFqifBaLarD4YG6aK.webp", "Food Hygiene Rules", 1),
        tb("fh6-b2", "Preventing Cross-Contamination:\n\nCross-contamination occurs when harmful bacteria transfer from one food or surface to another.\n\n• Use separate cutting boards for raw meat and vegetables\n• Never place cooked food on surfaces that held raw meat\n• Store raw meat on the lowest shelf in the refrigerator\n• Use different utensils for raw and cooked foods\n• Clean and sanitize surfaces between tasks\n\nTemperature Danger Zone: 40°F–140°F (4°C–60°C)\nBacteria multiply rapidly in this range. Keep cold foods below 40°F and hot foods above 140°F. Never leave perishable food in the danger zone for more than 2 hours.", 1),
      ],
      quizQuestions: [
        qq("fh6-q1", "How long should you scrub your hands when washing?", [
          { text: "5 seconds", isCorrect: false },
          { text: "10 seconds", isCorrect: false },
          { text: "At least 20 seconds", isCorrect: true },
          { text: "1 minute", isCorrect: false },
        ], "Scrub for at least 20 seconds to effectively remove bacteria."),
        qq("fh6-q2", "What is the temperature danger zone for food?", [
          { text: "0°F–32°F", isCorrect: false },
          { text: "40°F–140°F", isCorrect: true },
          { text: "140°F–200°F", isCorrect: false },
          { text: "32°F–100°F", isCorrect: false },
        ], "Bacteria multiply rapidly between 40°F and 140°F (4°C–60°C)."),
        qq("fh6-q3", "Where should raw meat be stored in a refrigerator?", [
          { text: "On the top shelf", isCorrect: false },
          { text: "Next to vegetables", isCorrect: false },
          { text: "On the lowest shelf", isCorrect: true },
          { text: "In the door compartment", isCorrect: false },
        ], "Raw meat goes on the lowest shelf to prevent juices from dripping onto other foods."),
        qq("fh6-q4", "What is cross-contamination?", [
          { text: "Cooking food too long", isCorrect: false },
          { text: "Bacteria transferring from one food/surface to another", isCorrect: true },
          { text: "Using too much seasoning", isCorrect: false },
          { text: "Leaving food out overnight", isCorrect: false },
        ], "Cross-contamination is the transfer of harmful bacteria between foods or surfaces."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-food-hygiene-BtzURbFqifBaLarD4YG6aK.webp",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 2: Customer Service & Soft Skills (6 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 7. Greeting Customers Professionally
  {
    title: "Greeting Customers Professionally",
    description: "Master the art of first impressions with professional greeting techniques that set the tone for positive customer interactions.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Customer Service & Soft Skills", tags: ["customer service", "greeting", "communication"], language: "en",
    content: {
      blocks: [
        tb("gc7-b1", "You never get a second chance at a first impression. Research shows customers form opinions about a business within the first 7 seconds of interaction. Your greeting sets the tone for the entire experience.\n\nThe 3-Step Professional Greeting:\n1. Acknowledge — Make eye contact and smile within 3 seconds of the customer approaching\n2. Welcome — Use a warm, genuine greeting: 'Good morning! Welcome to [business name]'\n3. Assist — Offer help: 'How can I help you today?'\n\nKey principles:\n• Be genuine — customers can detect fake enthusiasm\n• Use the customer's name if you know it\n• Adjust your energy to match the setting (calm in healthcare, upbeat in retail)\n• Stand up straight and face the customer directly", 0),
        ib("greeting-customers-p-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-greeting-customers-JcDnpvFk8FExohkHSiULc3.webp", "Greeting Customers Professionally", 1),
        tb("gc7-b2", "Common Greeting Mistakes:\n\n• Ignoring customers while finishing a task — always acknowledge first\n• Using robotic scripts — personalize your greeting\n• Being too aggressive — 'Can I help you?' before they've even looked around\n• Greeting while looking at your phone or screen\n• Using slang or overly casual language in professional settings\n\nFor phone greetings:\n• Answer within 3 rings\n• State your name and the business name\n• Smile while speaking — it changes your tone of voice\n• 'Thank you for calling [business]. This is [name], how may I help you?'", 1),
      ],
      quizQuestions: [
        qq("gc7-q1", "Within how many seconds should you acknowledge a customer?", [
          { text: "10 seconds", isCorrect: false },
          { text: "30 seconds", isCorrect: false },
          { text: "3 seconds", isCorrect: true },
          { text: "1 minute", isCorrect: false },
        ], "Acknowledge customers within 3 seconds to show they are valued."),
        qq("gc7-q2", "What is the first step in the 3-Step Professional Greeting?", [
          { text: "Offer assistance", isCorrect: false },
          { text: "Acknowledge with eye contact and a smile", isCorrect: true },
          { text: "Ask for their name", isCorrect: false },
          { text: "Hand them a brochure", isCorrect: false },
        ], "The first step is to acknowledge the customer with eye contact and a smile."),
        qq("gc7-q3", "Why should you smile when answering the phone?", [
          { text: "Company policy requires it", isCorrect: false },
          { text: "It changes your tone of voice positively", isCorrect: true },
          { text: "The customer can see you", isCorrect: false },
          { text: "It doesn't matter on the phone", isCorrect: false },
        ], "Smiling changes your vocal tone, making you sound warmer and more welcoming."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-greeting-customers-JcDnpvFk8FExohkHSiULc3.webp",
  },

  // 8. Handling Complaints Calmly
  {
    title: "Handling Complaints Calmly",
    description: "Learn the HEARD technique for de-escalating customer complaints and turning negative experiences into loyalty-building moments.",
    contentType: "mixed", durationMinutes: 5, difficulty: "intermediate",
    category: "Customer Service & Soft Skills", tags: ["complaints", "de-escalation", "customer service"], language: "en",
    content: {
      blocks: [
        tb("hc8-b1", "Customer complaints are inevitable — but how you handle them determines whether you lose a customer or create a loyal advocate. Studies show that customers whose complaints are resolved quickly are more loyal than those who never had a problem.\n\nThe HEARD Technique:\n• H — Hear them out. Let the customer speak without interrupting.\n• E — Empathize. Show you understand their frustration: 'I can see why that would be frustrating.'\n• A — Apologize sincerely. Even if it's not your fault: 'I'm sorry you had this experience.'\n• R — Resolve the issue. Take action or escalate to someone who can.\n• D — Diagnose. After resolving, identify the root cause to prevent recurrence.", 0),
        ib("handling-complaints--img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-handling-complaints-dsmJKss9c3B73Bwm2FYsvL.webp", "Handling Complaints Calmly", 1),
        tb("hc8-b2", "De-escalation Tips:\n\n• Keep your voice calm and steady — match their volume going DOWN, not up\n• Use the customer's name — it personalizes the interaction\n• Never say 'That's not my department' — own the problem\n• Avoid defensive language: 'But...' or 'Actually...'\n• Offer choices: 'I can do X or Y for you — which would you prefer?'\n• If a customer becomes abusive, calmly set boundaries: 'I want to help you, but I need us to speak respectfully.'\n\nRemember: The customer is not always right, but they always deserve respect.", 1),
      ],
      quizQuestions: [
        qq("hc8-q1", "What does the 'E' in the HEARD technique stand for?", [
          { text: "Explain your position", isCorrect: false },
          { text: "Empathize with the customer", isCorrect: true },
          { text: "Escalate to management", isCorrect: false },
          { text: "Evaluate the complaint", isCorrect: false },
        ], "The 'E' stands for Empathize — show you understand their frustration."),
        qq("hc8-q2", "What should you do if a customer is speaking loudly?", [
          { text: "Match their volume", isCorrect: false },
          { text: "Speak louder to be heard", isCorrect: false },
          { text: "Keep your voice calm and steady", isCorrect: true },
          { text: "Walk away", isCorrect: false },
        ], "Keep your voice calm — this naturally encourages the customer to lower their volume."),
        qq("hc8-q3", "Why should you avoid saying 'That's not my department'?", [
          { text: "It's grammatically incorrect", isCorrect: false },
          { text: "It makes the customer feel passed around and unvalued", isCorrect: true },
          { text: "It's against company policy", isCorrect: false },
          { text: "Customers don't understand departments", isCorrect: false },
        ], "Customers want solutions, not excuses. Own the problem and help find a resolution."),
        qq("hc8-q4", "What is the final step in the HEARD technique?", [
          { text: "Dismiss the customer", isCorrect: false },
          { text: "Document the complaint", isCorrect: false },
          { text: "Diagnose the root cause to prevent recurrence", isCorrect: true },
          { text: "Deliver a refund", isCorrect: false },
        ], "Diagnose means identifying the root cause so the same issue doesn't happen again."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-handling-complaints-dsmJKss9c3B73Bwm2FYsvL.webp",
  },

  // 9. Active Listening in Busy Environments
  {
    title: "Active Listening in Busy Environments",
    description: "Develop active listening skills that help you understand customers and colleagues accurately, even in noisy or fast-paced work settings.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Customer Service & Soft Skills", tags: ["listening", "communication", "customer service"], language: "en",
    content: {
      blocks: [
        tb("al9-b1", "Active listening means fully concentrating on what someone is saying rather than just passively hearing words. In busy shift environments with noise, interruptions, and time pressure, this skill is critical.\n\nThe RASA Framework for Active Listening:\n• R — Receive: Give your full attention. Face the speaker, make eye contact.\n• A — Appreciate: Show you're listening with nods, 'I see,' 'Go on.'\n• S — Summarize: Repeat back key points: 'So what you're saying is...'\n• A — Ask: Ask clarifying questions to ensure understanding.", 0),
        tb("al9-b2", "Barriers to Listening in Shift Work:\n\n• Background noise from machinery, music, or crowds\n• Multitasking — trying to listen while doing another task\n• Fatigue — especially on long or night shifts\n• Assumptions — thinking you know what they'll say\n• Emotional reactions — getting defensive before they finish\n\nTips for noisy environments:\n• Move to a quieter area if possible\n• Lean in slightly to hear better\n• Confirm understanding: 'Just to make sure I got that right...'\n• Use written notes for complex information\n• Ask the speaker to repeat if needed — it shows you care about accuracy", 1),
      ],
      quizQuestions: [
        qq("al9-q1", "What does the 'S' in the RASA framework stand for?", [
          { text: "Speak your opinion", isCorrect: false },
          { text: "Summarize key points", isCorrect: true },
          { text: "Stay silent", isCorrect: false },
          { text: "Solve the problem", isCorrect: false },
        ], "Summarize means repeating back key points to confirm understanding."),
        qq("al9-q2", "Which of these is a barrier to active listening during shift work?", [
          { text: "Making eye contact", isCorrect: false },
          { text: "Taking notes", isCorrect: false },
          { text: "Fatigue from long shifts", isCorrect: true },
          { text: "Asking questions", isCorrect: false },
        ], "Fatigue reduces concentration and makes it harder to listen actively."),
        qq("al9-q3", "What should you do if you can't hear someone in a noisy environment?", [
          { text: "Pretend you understood", isCorrect: false },
          { text: "Nod and walk away", isCorrect: false },
          { text: "Ask them to repeat — it shows you care about accuracy", isCorrect: true },
          { text: "Ignore them", isCorrect: false },
        ], "Asking someone to repeat shows respect and ensures accurate communication."),
      ],
      passingScore: 70,
    },
  },

  // 10. Positive Body Language at Work
  {
    title: "Positive Body Language at Work",
    description: "Understand how non-verbal communication impacts workplace interactions and learn to project confidence and approachability.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Customer Service & Soft Skills", tags: ["body language", "communication", "soft skills"], language: "en",
    content: {
      blocks: [
        tb("bl10-b1", "Studies show that 55% of communication is body language, 38% is tone of voice, and only 7% is the actual words. Your body speaks louder than your mouth.\n\nPositive Body Language Signals:\n• Open posture — uncrossed arms, facing the person directly\n• Eye contact — shows confidence and engagement (aim for 60-70% of the time)\n• Genuine smile — engages muscles around the eyes, not just the mouth\n• Nodding — shows you're listening and understanding\n• Leaning slightly forward — indicates interest\n• Mirroring — subtly matching the other person's posture builds rapport", 0),
        tb("bl10-b2", "Negative Body Language to Avoid:\n\n• Crossed arms — signals defensiveness or disinterest\n• Avoiding eye contact — suggests dishonesty or discomfort\n• Checking your phone — the ultimate sign of disrespect\n• Tapping feet or fidgeting — shows impatience\n• Turning away — signals you want to leave the conversation\n• Hands in pockets — can appear disengaged or nervous\n\nCultural Awareness:\nBody language varies across cultures. Eye contact norms, personal space, and gestures differ. When working with diverse teams or customers, be observant and adaptable.", 1),
      ],
      quizQuestions: [
        qq("bl10-q1", "What percentage of communication is body language?", [
          { text: "7%", isCorrect: false },
          { text: "38%", isCorrect: false },
          { text: "55%", isCorrect: true },
          { text: "90%", isCorrect: false },
        ], "Research shows 55% of communication is conveyed through body language."),
        qq("bl10-q2", "Which body language signal shows you are actively listening?", [
          { text: "Crossing your arms", isCorrect: false },
          { text: "Looking at your phone", isCorrect: false },
          { text: "Nodding and leaning slightly forward", isCorrect: true },
          { text: "Tapping your feet", isCorrect: false },
        ], "Nodding and leaning forward show engagement and active listening."),
        qq("bl10-q3", "Why should you be aware of cultural differences in body language?", [
          { text: "To avoid legal issues", isCorrect: false },
          { text: "Gestures and norms vary across cultures", isCorrect: true },
          { text: "It's not important", isCorrect: false },
          { text: "To impress your manager", isCorrect: false },
        ], "Body language norms differ across cultures — being aware prevents misunderstandings."),
      ],
      passingScore: 70,
    },
  },

  // 11. Cross-Cultural Communication Basics
  {
    title: "Cross-Cultural Communication Basics",
    description: "Navigate cultural differences in the workplace with respect and understanding to build stronger team relationships.",
    contentType: "article", durationMinutes: 5, difficulty: "intermediate",
    category: "Customer Service & Soft Skills", tags: ["culture", "diversity", "communication"], language: "en",
    content: {
      blocks: [
        tb("cc11-b1", "Modern workplaces are increasingly diverse. You may work alongside people from different countries, religions, and cultural backgrounds. Cross-cultural communication skills help you collaborate effectively and avoid misunderstandings.\n\nKey Cultural Dimensions:\n• Direct vs. Indirect communication — Some cultures value bluntness, others prefer subtlety\n• Individualism vs. Collectivism — Some prioritize personal achievement, others group harmony\n• Time orientation — Strict punctuality vs. flexible time attitudes\n• Power distance — Formal hierarchies vs. flat structures\n• High-context vs. Low-context — Relying on context and non-verbal cues vs. explicit verbal communication", 0),
        tb("cc11-b2", "Practical Tips for Cross-Cultural Communication:\n\n1. Listen more than you speak — especially when working with someone from a different culture\n2. Avoid idioms and slang — 'Break a leg' or 'Piece of cake' may confuse non-native speakers\n3. Ask respectful questions — 'How do you prefer to be addressed?' shows respect\n4. Don't assume — what's normal in your culture may be offensive in another\n5. Be patient with language barriers — speak clearly and at a moderate pace\n6. Learn basic greetings in your colleagues' languages — it shows effort and respect\n7. Focus on shared goals — cultural differences fade when teams focus on common objectives", 1),
      ],
      quizQuestions: [
        qq("cc11-q1", "Why should you avoid using idioms with colleagues from different cultures?", [
          { text: "Idioms are unprofessional", isCorrect: false },
          { text: "They may not translate and cause confusion", isCorrect: true },
          { text: "They are too informal", isCorrect: false },
          { text: "Idioms are always offensive", isCorrect: false },
        ], "Idioms often don't translate across languages and can cause misunderstandings."),
        qq("cc11-q2", "What does 'high-context communication' mean?", [
          { text: "Using very long sentences", isCorrect: false },
          { text: "Relying heavily on context and non-verbal cues", isCorrect: true },
          { text: "Speaking loudly", isCorrect: false },
          { text: "Using technical jargon", isCorrect: false },
        ], "High-context communication relies on context, tone, and non-verbal cues rather than explicit words."),
        qq("cc11-q3", "What is a simple way to show respect for a colleague's culture?", [
          { text: "Ignore cultural differences", isCorrect: false },
          { text: "Learn basic greetings in their language", isCorrect: true },
          { text: "Avoid talking to them", isCorrect: false },
          { text: "Only speak in English", isCorrect: false },
        ], "Learning basic greetings shows effort, respect, and willingness to connect."),
      ],
      passingScore: 70,
    },
  },

  // 12. Team Collaboration in Shift Work
  {
    title: "Team Collaboration in Shift Work",
    description: "Build effective teamwork skills for shift-based environments where communication gaps between shifts can impact safety and productivity.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Customer Service & Soft Skills", tags: ["teamwork", "collaboration", "shift work"], language: "en",
    content: {
      blocks: [
        tb("tc12-b1", "Shift work creates unique teamwork challenges. You may rarely see colleagues on other shifts, yet your work directly impacts theirs. Effective collaboration across shifts is essential for safety, productivity, and morale.\n\nThe 4 Pillars of Shift Team Collaboration:\n1. Clear Handovers — Document what happened, what's pending, and what needs attention\n2. Shared Standards — Follow the same procedures regardless of shift\n3. Mutual Respect — Value the work done by other shifts\n4. Open Communication — Use shared logs, boards, or digital tools to stay connected", 0),
        tb("tc12-b2", "Effective Shift Handover Checklist:\n\n✓ Summarize completed tasks\n✓ Highlight pending or urgent items\n✓ Note any safety concerns or equipment issues\n✓ Communicate customer or client updates\n✓ Pass along management messages\n✓ Update shared logs or digital systems\n\nCommon Teamwork Pitfalls:\n• 'That's not my job' mentality — everyone contributes to the whole\n• Blaming other shifts for problems — focus on solutions\n• Not documenting issues — if it's not written down, it didn't happen\n• Gossiping about colleagues on other shifts — it destroys trust", 1),
      ],
      quizQuestions: [
        qq("tc12-q1", "What is the most important element of a shift handover?", [
          { text: "Complaining about the previous shift", isCorrect: false },
          { text: "Clear documentation of completed, pending, and urgent items", isCorrect: true },
          { text: "Leaving as quickly as possible", isCorrect: false },
          { text: "Verbal summary only", isCorrect: false },
        ], "Clear documentation ensures nothing falls through the cracks between shifts."),
        qq("tc12-q2", "Why is the 'that's not my job' mentality harmful in shift work?", [
          { text: "It's technically correct", isCorrect: false },
          { text: "It creates gaps in work and damages team trust", isCorrect: true },
          { text: "It saves time", isCorrect: false },
          { text: "It's only a problem for managers", isCorrect: false },
        ], "This mentality creates gaps in work, damages trust, and can compromise safety."),
        qq("tc12-q3", "What should you include in a shared shift log?", [
          { text: "Personal opinions about coworkers", isCorrect: false },
          { text: "Only positive updates", isCorrect: false },
          { text: "Completed tasks, pending items, safety concerns, and equipment issues", isCorrect: true },
          { text: "Your break schedule", isCorrect: false },
        ], "Shared logs should contain factual, actionable information for the next shift."),
      ],
      passingScore: 70,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 3: Productivity & Efficiency (5 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 13. Time Management During Shifts
  {
    title: "Time Management During Shifts",
    description: "Learn practical time management strategies designed for shift workers to maximize productivity and reduce end-of-shift rushing.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Productivity & Efficiency", tags: ["time management", "productivity", "shifts"], language: "en",
    content: {
      blocks: [
        tb("tm13-b1", "Shift work has a fixed time boundary — when the clock runs out, your shift is over. Effective time management ensures you complete your tasks without rushing at the end or leaving work for the next shift.\n\nThe Shift Time Management Framework:\n1. First 15 minutes — Review tasks, prioritize, and plan your shift\n2. Power blocks — Tackle the hardest tasks when your energy is highest\n3. Batch similar tasks — Group related activities to reduce context-switching\n4. Built-in buffers — Leave 10-15% of your shift for unexpected issues\n5. Last 15 minutes — Clean up, document, and prepare handover", 0),
        ib("time-management-duri-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-time-management-EYcKMMZkNzFQUrMTZp2zgR.webp", "Time Management During Shifts", 1),
        tb("tm13-b2", "Time Wasters to Eliminate:\n\n• Excessive socializing during peak work periods\n• Repeatedly checking your phone\n• Not having materials ready before starting a task\n• Redoing work because of unclear instructions — ask questions upfront\n• Perfectionism on tasks that need 'good enough'\n\nThe 2-Minute Rule:\nIf a task takes less than 2 minutes, do it immediately. Don't add it to your list — the time spent tracking it exceeds the time to complete it.\n\nRemember: Time management isn't about working faster — it's about working smarter.", 1),
      ],
      quizQuestions: [
        qq("tm13-q1", "What should you do in the first 15 minutes of your shift?", [
          { text: "Start working immediately on the first task you see", isCorrect: false },
          { text: "Review tasks, prioritize, and plan your shift", isCorrect: true },
          { text: "Chat with coworkers about the previous shift", isCorrect: false },
          { text: "Take a break", isCorrect: false },
        ], "The first 15 minutes should be used to plan and prioritize your shift."),
        qq("tm13-q2", "What is the 2-Minute Rule?", [
          { text: "Take a 2-minute break every hour", isCorrect: false },
          { text: "If a task takes less than 2 minutes, do it immediately", isCorrect: true },
          { text: "Spend only 2 minutes on each task", isCorrect: false },
          { text: "Arrive 2 minutes early", isCorrect: false },
        ], "The 2-Minute Rule: if it takes less than 2 minutes, do it now rather than tracking it."),
        qq("tm13-q3", "Why should you leave 10-15% of your shift as buffer time?", [
          { text: "For extra breaks", isCorrect: false },
          { text: "To handle unexpected issues without falling behind", isCorrect: true },
          { text: "To leave early", isCorrect: false },
          { text: "Buffer time isn't necessary", isCorrect: false },
        ], "Buffer time accounts for unexpected issues, interruptions, and urgent tasks."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-time-management-EYcKMMZkNzFQUrMTZp2zgR.webp",
  },

  // 14. Prioritizing Tasks Under Pressure
  {
    title: "Prioritizing Tasks Under Pressure",
    description: "Master the Eisenhower Matrix and other prioritization techniques to stay focused when workload exceeds available time.",
    contentType: "mixed", durationMinutes: 5, difficulty: "intermediate",
    category: "Productivity & Efficiency", tags: ["prioritization", "pressure", "productivity"], language: "en",
    content: {
      blocks: [
        tb("pt14-b1", "When everything feels urgent, nothing gets done well. Prioritization is the skill of deciding what matters most when you can't do everything.\n\nThe Eisenhower Matrix:\n• Urgent + Important → DO IT NOW (safety issues, customer emergencies)\n• Important + Not Urgent → SCHEDULE IT (training, maintenance, planning)\n• Urgent + Not Important → DELEGATE IT (routine requests, some emails)\n• Not Urgent + Not Important → ELIMINATE IT (time wasters, unnecessary meetings)\n\nIn shift work, safety always comes first. Any safety concern is automatically Urgent + Important.", 0),
        tb("pt14-b2", "The ABC Method for Shift Prioritization:\n\nA tasks — Must be done this shift (consequences if not completed)\nB tasks — Should be done this shift (important but can wait one shift)\nC tasks — Nice to do (no immediate consequences if delayed)\n\nWhen overwhelmed:\n1. Stop and take 3 deep breaths\n2. Write down everything on your plate\n3. Apply the ABC method\n4. Start with A1 — the single most critical task\n5. Communicate with your supervisor if the workload is unmanageable\n\nRemember: Saying 'I need help prioritizing' is a sign of professionalism, not weakness.", 1),
      ],
      quizQuestions: [
        qq("pt14-q1", "In the Eisenhower Matrix, what should you do with tasks that are Urgent AND Important?", [
          { text: "Schedule them for later", isCorrect: false },
          { text: "Delegate them", isCorrect: false },
          { text: "Do them immediately", isCorrect: true },
          { text: "Eliminate them", isCorrect: false },
        ], "Urgent + Important tasks require immediate action."),
        qq("pt14-q2", "What does an 'A task' mean in the ABC method?", [
          { text: "A task that's nice to do", isCorrect: false },
          { text: "A task that must be done this shift", isCorrect: true },
          { text: "A task for the next shift", isCorrect: false },
          { text: "An administrative task", isCorrect: false },
        ], "A tasks are critical — they must be completed during this shift."),
        qq("pt14-q3", "What should you do first when feeling overwhelmed by tasks?", [
          { text: "Work faster", isCorrect: false },
          { text: "Skip your break", isCorrect: false },
          { text: "Stop, breathe, and write down everything on your plate", isCorrect: true },
          { text: "Leave the difficult tasks for the next shift", isCorrect: false },
        ], "Pausing to organize your thoughts prevents panic and helps you prioritize effectively."),
      ],
      passingScore: 70,
    },
  },

  // 15. Using Checklists Effectively
  {
    title: "Using Checklists Effectively",
    description: "Learn how checklists prevent errors, improve consistency, and save time — from aviation-grade safety to daily shift routines.",
    contentType: "article", durationMinutes: 4, difficulty: "beginner",
    category: "Productivity & Efficiency", tags: ["checklists", "productivity", "quality"], language: "en",
    content: {
      blocks: [
        tb("cl15-b1", "Checklists are used by surgeons, pilots, and astronauts — not because they're forgetful, but because checklists catch errors that even experts miss. In shift work, checklists ensure consistency across shifts and prevent costly mistakes.\n\nWhy Checklists Work:\n• They reduce reliance on memory (especially during fatigue)\n• They ensure every step is completed in the correct order\n• They create accountability — you can prove work was done\n• They speed up routine tasks by eliminating decision-making\n• They improve handovers — the next shift knows exactly what's been done", 0),
        ib("using-checklists-eff-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-checklist-MqfkHYJhYP7UB97wWcomdS.webp", "Using Checklists Effectively", 1),
        tb("cl15-b2", "Creating Effective Checklists:\n\n1. Keep items short and actionable — 'Check oil level' not 'Make sure the oil is okay'\n2. List items in logical order — follow the natural workflow\n3. Include only critical steps — too many items cause checklist fatigue\n4. Use checkboxes — the physical act of checking creates satisfaction\n5. Review and update regularly — remove outdated items, add new ones\n\nTypes of Shift Checklists:\n• Opening checklist — tasks to start the shift\n• Closing checklist — tasks to end the shift\n• Safety checklist — equipment and environment checks\n• Handover checklist — information for the next shift\n• Quality checklist — standards verification", 1),
      ],
      quizQuestions: [
        qq("cl15-q1", "Why do experts like surgeons and pilots use checklists?", [
          { text: "Because they are forgetful", isCorrect: false },
          { text: "Because checklists catch errors that even experts miss", isCorrect: true },
          { text: "Because their managers require it", isCorrect: false },
          { text: "Because they are beginners", isCorrect: false },
        ], "Checklists catch errors that even experienced professionals might miss under pressure."),
        qq("cl15-q2", "How should checklist items be written?", [
          { text: "Long and detailed paragraphs", isCorrect: false },
          { text: "Short and actionable", isCorrect: true },
          { text: "In question format", isCorrect: false },
          { text: "Using technical jargon only", isCorrect: false },
        ], "Checklist items should be short, clear, and actionable for quick use."),
        qq("cl15-q3", "What is a key benefit of checklists for shift handovers?", [
          { text: "They replace verbal communication entirely", isCorrect: false },
          { text: "The next shift knows exactly what's been done", isCorrect: true },
          { text: "They eliminate the need for training", isCorrect: false },
          { text: "They make shifts shorter", isCorrect: false },
        ], "Checklists provide clear documentation of what was completed during the shift."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-checklist-MqfkHYJhYP7UB97wWcomdS.webp",
  },

  // 16. Reducing Workplace Distractions
  {
    title: "Reducing Workplace Distractions",
    description: "Identify common workplace distractions and learn practical strategies to maintain focus and productivity during your shift.",
    contentType: "article", durationMinutes: 4, difficulty: "beginner",
    category: "Productivity & Efficiency", tags: ["focus", "distractions", "productivity"], language: "en",
    content: {
      blocks: [
        tb("rd16-b1", "The average worker is interrupted every 11 minutes and takes 23 minutes to regain full focus. In shift work, distractions don't just reduce productivity — they can compromise safety.\n\nTop Workplace Distractions:\n• Personal phone use (texts, social media, notifications)\n• Chatty coworkers during critical tasks\n• Noise from equipment, music, or conversations\n• Multitasking — trying to do too many things at once\n• Unclear priorities — not knowing what to focus on\n• Hunger, thirst, or physical discomfort", 0),
        tb("rd16-b2", "Strategies to Reduce Distractions:\n\n1. Phone management — Put your phone on silent or in your locker during critical tasks\n2. Time-blocking — Dedicate specific periods to focused work\n3. Signal system — Use headphones or a 'do not disturb' signal when focusing\n4. Batch interruptions — Tell colleagues 'I'll be available in 20 minutes'\n5. Environment control — Adjust lighting, temperature, or position if possible\n6. Single-tasking — Focus on one task at a time for better quality and speed\n\nThe 5-Second Rule: When you notice a distraction, count 5-4-3-2-1 and redirect your attention to your task. This interrupts the distraction habit loop.", 1),
      ],
      quizQuestions: [
        qq("rd16-q1", "How long does it take to regain full focus after an interruption?", [
          { text: "2 minutes", isCorrect: false },
          { text: "5 minutes", isCorrect: false },
          { text: "23 minutes", isCorrect: true },
          { text: "1 hour", isCorrect: false },
        ], "Research shows it takes an average of 23 minutes to regain full focus after an interruption."),
        qq("rd16-q2", "What is single-tasking?", [
          { text: "Doing only easy tasks", isCorrect: false },
          { text: "Focusing on one task at a time", isCorrect: true },
          { text: "Working alone", isCorrect: false },
          { text: "Doing tasks in alphabetical order", isCorrect: false },
        ], "Single-tasking means focusing on one task at a time for better quality and speed."),
        qq("rd16-q3", "What is the 5-Second Rule for distractions?", [
          { text: "Take a 5-second break", isCorrect: false },
          { text: "Count 5-4-3-2-1 and redirect attention to your task", isCorrect: true },
          { text: "Wait 5 seconds before responding", isCorrect: false },
          { text: "Check your phone for 5 seconds only", isCorrect: false },
        ], "The 5-Second Rule interrupts the distraction habit loop by counting down and refocusing."),
      ],
      passingScore: 70,
    },
  },

  // 17. Quick Problem-Solving Framework (STOP method)
  {
    title: "Quick Problem-Solving Framework: The STOP Method",
    description: "Learn the STOP method (Situation, Task, Options, Plan) for making quick, effective decisions under pressure during your shift.",
    contentType: "mixed", durationMinutes: 5, difficulty: "intermediate",
    category: "Productivity & Efficiency", tags: ["problem solving", "decision making", "STOP method"], language: "en",
    content: {
      blocks: [
        tb("ps17-b1", "Shift workers face unexpected problems constantly — equipment breakdowns, customer emergencies, supply shortages, staffing gaps. The STOP method gives you a structured way to solve problems quickly without panicking.\n\nThe STOP Method:\n• S — Situation: What exactly is happening? Gather facts, not assumptions.\n• T — Task: What needs to be achieved? Define the goal clearly.\n• O — Options: What are your possible solutions? List at least 2-3 options.\n• P — Plan: Choose the best option and act. Assign who does what and by when.", 0),
        tb("ps17-b2", "STOP in Action — Example:\n\nSituation: The dishwasher broke down during the dinner rush.\nTask: We need clean dishes for the next 2 hours of service.\nOptions:\n1. Hand-wash dishes (slow but immediate)\n2. Use disposable plates (fast but costly)\n3. Call emergency repair service (uncertain timeline)\nPlan: Start hand-washing immediately (Option 1), switch to disposables for peak hour (Option 2), and call repair for tomorrow (Option 3).\n\nKey Principles:\n• Don't skip straight to solutions — understand the situation first\n• Consider safety implications of every option\n• Communicate your plan to the team\n• Review after: Did the solution work? What would you do differently?", 1),
      ],
      quizQuestions: [
        qq("ps17-q1", "What does the 'S' in the STOP method stand for?", [
          { text: "Solution", isCorrect: false },
          { text: "Situation", isCorrect: true },
          { text: "Strategy", isCorrect: false },
          { text: "Safety", isCorrect: false },
        ], "S stands for Situation — understanding what is actually happening before acting."),
        qq("ps17-q2", "How many options should you consider before choosing a solution?", [
          { text: "Just one — the first idea", isCorrect: false },
          { text: "At least 2-3 options", isCorrect: true },
          { text: "As many as possible, even if it takes hours", isCorrect: false },
          { text: "Options aren't necessary", isCorrect: false },
        ], "Considering at least 2-3 options helps you find the best solution, not just the first one."),
        qq("ps17-q3", "What should you do after implementing your solution?", [
          { text: "Forget about it and move on", isCorrect: false },
          { text: "Review whether the solution worked and what you'd do differently", isCorrect: true },
          { text: "Take credit for solving it", isCorrect: false },
          { text: "Nothing — the problem is solved", isCorrect: false },
        ], "Reviewing outcomes helps you improve your problem-solving for future situations."),
        qq("ps17-q4", "Why should you NOT skip straight to solutions?", [
          { text: "It's against company policy", isCorrect: false },
          { text: "You might solve the wrong problem without understanding the situation", isCorrect: true },
          { text: "It takes too long", isCorrect: false },
          { text: "Solutions are always obvious", isCorrect: false },
        ], "Without understanding the situation, you risk solving the wrong problem or making it worse."),
      ],
      passingScore: 75,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 4: Health & Wellbeing (5 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 18. Managing Fatigue on Night Shifts
  {
    title: "Managing Fatigue on Night Shifts",
    description: "Understand the science of fatigue and learn evidence-based strategies to stay alert, safe, and healthy during night shifts.",
    contentType: "mixed", durationMinutes: 6, difficulty: "intermediate",
    category: "Health & Wellbeing", tags: ["fatigue", "night shift", "health", "sleep"], language: "en",
    content: {
      blocks: [
        tb("mf18-b1", "Night shift workers are 30% more likely to have accidents than day shift workers. Your body's circadian rhythm naturally promotes sleep at night, making night shifts inherently challenging.\n\nThe Science of Fatigue:\n• Your body temperature drops between 2-6 AM — this is your lowest alertness period\n• Sleep debt accumulates — you can't 'make up' lost sleep in one day\n• Fatigue impairs judgment similar to alcohol — 17 hours awake = 0.05% BAC equivalent\n• Chronic sleep deprivation increases risk of heart disease, diabetes, and depression", 0),
        ib("managing-fatigue-on--img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-fatigue-management-6dmH7V9jsG6EJsFeXVZEdW.webp", "Managing Fatigue on Night Shifts", 1),
        tb("mf18-b2", "Fatigue Management Strategies:\n\nBefore Your Shift:\n• Sleep 7-9 hours in a dark, cool, quiet room\n• Use blackout curtains and white noise machines\n• Avoid caffeine 6 hours before planned sleep\n• Take a 20-minute 'power nap' before your shift\n\nDuring Your Shift:\n• Strategic caffeine — drink coffee early in the shift, not late\n• Bright light exposure — helps reset your alertness\n• Move regularly — walk, stretch, change positions every 30-60 minutes\n• Eat light, protein-rich meals — avoid heavy carbs that cause drowsiness\n• Stay hydrated — dehydration worsens fatigue\n\nAfter Your Shift:\n• Wear sunglasses on the drive home to reduce light exposure\n• Go to sleep as soon as possible\n• Maintain a consistent sleep schedule, even on days off", 1),
      ],
      quizQuestions: [
        qq("mf18-q1", "When is alertness typically lowest during a night shift?", [
          { text: "10 PM - 12 AM", isCorrect: false },
          { text: "2 AM - 6 AM", isCorrect: true },
          { text: "8 PM - 10 PM", isCorrect: false },
          { text: "6 AM - 8 AM", isCorrect: false },
        ], "Body temperature and alertness drop to their lowest between 2-6 AM."),
        qq("mf18-q2", "How long should a pre-shift power nap be?", [
          { text: "5 minutes", isCorrect: false },
          { text: "20 minutes", isCorrect: true },
          { text: "1 hour", isCorrect: false },
          { text: "2 hours", isCorrect: false },
        ], "A 20-minute nap boosts alertness without causing grogginess from deep sleep."),
        qq("mf18-q3", "When should you drink caffeine during a night shift?", [
          { text: "Right before the shift ends", isCorrect: false },
          { text: "Early in the shift", isCorrect: true },
          { text: "Throughout the entire shift", isCorrect: false },
          { text: "Caffeine should be avoided entirely", isCorrect: false },
        ], "Drink caffeine early in the shift so it doesn't interfere with post-shift sleep."),
        qq("mf18-q4", "What should you wear on the drive home after a night shift?", [
          { text: "A hat", isCorrect: false },
          { text: "Sunglasses to reduce light exposure", isCorrect: true },
          { text: "Bright clothing", isCorrect: false },
          { text: "Nothing special", isCorrect: false },
        ], "Sunglasses reduce light exposure, helping your body prepare for sleep."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-fatigue-management-6dmH7V9jsG6EJsFeXVZEdW.webp",
  },

  // 19. Quick Stretching Routines at Work
  {
    title: "Quick Stretching Routines at Work",
    description: "Learn simple 2-minute stretching routines you can do at your workstation to reduce muscle tension, prevent injury, and boost energy.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Health & Wellbeing", tags: ["stretching", "exercise", "health", "wellness"], language: "en",
    content: {
      blocks: [
        tb("sr19-b1", "Sitting or standing in the same position for hours causes muscle stiffness, reduced circulation, and increased injury risk. Just 2 minutes of stretching every hour can dramatically reduce these risks.\n\nUpper Body Stretches (30 seconds each):\n• Neck rolls — Slowly roll your head in a circle, 5 times each direction\n• Shoulder shrugs — Raise shoulders to ears, hold 3 seconds, release\n• Chest opener — Clasp hands behind back, squeeze shoulder blades together\n• Wrist circles — Extend arms and rotate wrists, 10 times each direction", 0),
        ib("quick-stretching-rou-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-stretching-5p7qtkKPmLpidVX2FfPDsw.webp", "Quick Stretching Routines at Work", 1),
        tb("sr19-b2", "Lower Body Stretches (30 seconds each):\n• Standing quad stretch — Hold one foot behind you, keep knees together\n• Calf raises — Rise onto toes, hold 3 seconds, lower slowly\n• Hip circles — Hands on hips, rotate hips in large circles\n• Hamstring stretch — Place heel on a low surface, lean forward gently\n\nWhen to Stretch:\n• At the start of your shift (warm-up)\n• Every 60 minutes during your shift\n• After any heavy lifting or repetitive task\n• When you feel stiffness or tension building\n\nRemember: Stretch gently — never bounce or force a stretch. If it hurts, stop.", 1),
      ],
      quizQuestions: [
        qq("sr19-q1", "How often should you stretch during a shift?", [
          { text: "Once at the beginning", isCorrect: false },
          { text: "Every 60 minutes", isCorrect: true },
          { text: "Only when you feel pain", isCorrect: false },
          { text: "Once at the end", isCorrect: false },
        ], "Stretching every 60 minutes prevents muscle stiffness and reduces injury risk."),
        qq("sr19-q2", "What should you do if a stretch causes pain?", [
          { text: "Push through the pain", isCorrect: false },
          { text: "Bounce to loosen the muscle", isCorrect: false },
          { text: "Stop immediately", isCorrect: true },
          { text: "Hold it longer", isCorrect: false },
        ], "Pain during stretching means you've gone too far — stop immediately to prevent injury."),
        qq("sr19-q3", "Which stretch helps relieve tension from sitting at a desk?", [
          { text: "Running in place", isCorrect: false },
          { text: "Chest opener — clasp hands behind back, squeeze shoulder blades", isCorrect: true },
          { text: "Jumping jacks", isCorrect: false },
          { text: "Push-ups", isCorrect: false },
        ], "The chest opener counteracts the forward-hunching posture caused by desk work."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-stretching-5p7qtkKPmLpidVX2FfPDsw.webp",
  },

  // 20. Hydration and Nutrition Tips
  {
    title: "Hydration and Nutrition Tips for Long Shifts",
    description: "Optimize your diet and hydration for shift work with practical meal planning and energy management strategies.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner",
    category: "Health & Wellbeing", tags: ["nutrition", "hydration", "health", "energy"], language: "en",
    content: {
      blocks: [
        tb("hn20-b1", "What you eat and drink during your shift directly impacts your energy, focus, and safety. Poor nutrition is one of the top contributors to workplace fatigue and errors.\n\nHydration Rules:\n• Drink at least 8 glasses (2 liters) of water per shift\n• Don't wait until you're thirsty — thirst means you're already dehydrated\n• Dehydration reduces concentration by up to 25%\n• Avoid excessive caffeine and sugary drinks — they cause energy crashes\n• Keep a water bottle at your workstation as a visual reminder\n\nSigns of dehydration:\n• Headache, dizziness, or lightheadedness\n• Dark-colored urine\n• Fatigue and difficulty concentrating\n• Dry mouth and lips", 0),
        tb("hn20-b2", "Nutrition for Shift Workers:\n\nEnergy-Sustaining Foods:\n• Complex carbs — whole grains, oats, brown rice (slow energy release)\n• Lean proteins — chicken, fish, eggs, beans (sustained fullness)\n• Healthy fats — nuts, avocado, olive oil (brain fuel)\n• Fruits and vegetables — vitamins and natural energy\n\nFoods to Avoid During Shifts:\n• Heavy, greasy meals — cause drowsiness\n• Excessive sugar — causes energy spikes and crashes\n• Large meals — eat smaller, more frequent meals instead\n\nMeal Timing:\n• Eat your main meal before your shift\n• Have light snacks every 3-4 hours during your shift\n• Avoid heavy eating within 2 hours of sleep\n• Prepare meals in advance to avoid vending machine temptation", 1),
      ],
      quizQuestions: [
        qq("hn20-q1", "How much water should you aim to drink per shift?", [
          { text: "1 glass", isCorrect: false },
          { text: "At least 8 glasses (2 liters)", isCorrect: true },
          { text: "Only when thirsty", isCorrect: false },
          { text: "As much coffee as possible", isCorrect: false },
        ], "Aim for at least 2 liters of water per shift to maintain hydration and focus."),
        qq("hn20-q2", "By how much can dehydration reduce concentration?", [
          { text: "5%", isCorrect: false },
          { text: "10%", isCorrect: false },
          { text: "Up to 25%", isCorrect: true },
          { text: "50%", isCorrect: false },
        ], "Dehydration can reduce concentration by up to 25%, significantly impacting performance."),
        qq("hn20-q3", "What type of food provides slow, sustained energy during a shift?", [
          { text: "Candy bars", isCorrect: false },
          { text: "Complex carbohydrates like whole grains", isCorrect: true },
          { text: "Energy drinks", isCorrect: false },
          { text: "Fast food", isCorrect: false },
        ], "Complex carbs provide slow-release energy that sustains you through the shift."),
        qq("hn20-q4", "When should you eat your main meal?", [
          { text: "During the middle of your shift", isCorrect: false },
          { text: "Before your shift", isCorrect: true },
          { text: "Right before sleep", isCorrect: false },
          { text: "After your shift", isCorrect: false },
        ], "Eating your main meal before your shift provides energy without mid-shift drowsiness."),
      ],
      passingScore: 70,
    },
  },

  // 21. Stress Management Micro-techniques
  {
    title: "Stress Management Micro-techniques",
    description: "Learn quick, practical stress-relief techniques you can use during your shift to stay calm, focused, and resilient.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Health & Wellbeing", tags: ["stress", "mental health", "wellness", "techniques"], language: "en",
    content: {
      blocks: [
        tb("sm21-b1", "Workplace stress is normal — but unmanaged stress leads to burnout, health problems, and errors. The key is having quick techniques you can use in the moment, even during a busy shift.\n\nThe 4-7-8 Breathing Technique:\n1. Breathe in through your nose for 4 seconds\n2. Hold your breath for 7 seconds\n3. Exhale slowly through your mouth for 8 seconds\n4. Repeat 3-4 times\n\nThis activates your parasympathetic nervous system, reducing heart rate and anxiety in under 60 seconds.", 0),
        tb("sm21-b2", "More Micro-techniques:\n\n• The 5-4-3-2-1 Grounding Method (for anxiety):\n  - Name 5 things you can see\n  - 4 things you can touch\n  - 3 things you can hear\n  - 2 things you can smell\n  - 1 thing you can taste\n\n• Progressive Muscle Relaxation:\n  - Tense a muscle group for 5 seconds, then release\n  - Start with feet, work up to shoulders and face\n  - Takes 2-3 minutes for a full-body reset\n\n• Positive Self-Talk:\n  - Replace 'I can't handle this' with 'I've handled difficult situations before'\n  - Replace 'Everything is going wrong' with 'I'll focus on what I can control'\n\nRemember: Taking 60 seconds to manage stress is not wasting time — it's investing in better performance.", 1),
      ],
      quizQuestions: [
        qq("sm21-q1", "In the 4-7-8 breathing technique, how long do you hold your breath?", [
          { text: "4 seconds", isCorrect: false },
          { text: "7 seconds", isCorrect: true },
          { text: "8 seconds", isCorrect: false },
          { text: "10 seconds", isCorrect: false },
        ], "In the 4-7-8 technique, you hold your breath for 7 seconds."),
        qq("sm21-q2", "What does the 5-4-3-2-1 grounding method help with?", [
          { text: "Physical pain", isCorrect: false },
          { text: "Anxiety and overwhelm", isCorrect: true },
          { text: "Hunger", isCorrect: false },
          { text: "Fatigue", isCorrect: false },
        ], "The 5-4-3-2-1 method grounds you in the present moment, reducing anxiety."),
        qq("sm21-q3", "What is an example of positive self-talk?", [
          { text: "'I can't handle this'", isCorrect: false },
          { text: "'Everything is going wrong'", isCorrect: false },
          { text: "'I've handled difficult situations before'", isCorrect: true },
          { text: "'This is impossible'", isCorrect: false },
        ], "Positive self-talk reframes challenges as manageable based on past experience."),
      ],
      passingScore: 70,
    },
  },

  // 22. Mental Health Awareness for Shift Workers
  {
    title: "Mental Health Awareness for Shift Workers",
    description: "Recognize signs of mental health challenges common in shift work and learn where to find support and resources.",
    contentType: "article", durationMinutes: 5, difficulty: "intermediate",
    category: "Health & Wellbeing", tags: ["mental health", "awareness", "support", "wellbeing"], language: "en",
    content: {
      blocks: [
        tb("mh22-b1", "Shift workers are 33% more likely to experience depression and anxiety compared to regular-hour workers. The disruption to sleep, social life, and routine takes a real toll on mental health.\n\nCommon Mental Health Challenges in Shift Work:\n• Sleep disorders — insomnia, disrupted circadian rhythm\n• Social isolation — missing family events, friends on different schedules\n• Burnout — emotional exhaustion from demanding work\n• Anxiety — worry about performance, safety, or job security\n• Depression — persistent sadness, loss of interest, fatigue beyond normal tiredness\n\nWarning Signs to Watch For (in yourself and colleagues):\n• Withdrawing from team interactions\n• Increased irritability or mood swings\n• Difficulty concentrating or making decisions\n• Changes in appetite or sleep patterns\n• Expressing hopelessness or feeling trapped", 0),
        tb("mh22-b2", "What You Can Do:\n\nFor Yourself:\n• Maintain a consistent routine, even on days off\n• Stay connected with family and friends — schedule regular calls or meetups\n• Exercise regularly — even 20 minutes of walking helps\n• Limit alcohol and avoid using substances to cope\n• Seek professional help if symptoms persist for more than 2 weeks\n\nFor Colleagues:\n• Check in: 'How are you really doing?'\n• Listen without judgment\n• Don't try to diagnose or fix — just be present\n• Encourage professional support: 'Have you thought about talking to someone?'\n• Know your company's Employee Assistance Program (EAP) resources\n\nRemember: Asking for help is a sign of strength, not weakness. Mental health is health.", 1),
      ],
      quizQuestions: [
        qq("mh22-q1", "Shift workers are how much more likely to experience depression?", [
          { text: "10% more likely", isCorrect: false },
          { text: "33% more likely", isCorrect: true },
          { text: "50% more likely", isCorrect: false },
          { text: "No more likely than others", isCorrect: false },
        ], "Research shows shift workers are 33% more likely to experience depression and anxiety."),
        qq("mh22-q2", "What is a warning sign of mental health struggles in a colleague?", [
          { text: "Being very productive", isCorrect: false },
          { text: "Withdrawing from team interactions", isCorrect: true },
          { text: "Asking for more shifts", isCorrect: false },
          { text: "Arriving early to work", isCorrect: false },
        ], "Withdrawal from social interactions is a common warning sign of mental health challenges."),
        qq("mh22-q3", "When should you seek professional help for mental health symptoms?", [
          { text: "Only when you can't work at all", isCorrect: false },
          { text: "If symptoms persist for more than 2 weeks", isCorrect: true },
          { text: "Never — it will pass on its own", isCorrect: false },
          { text: "Only if your manager tells you to", isCorrect: false },
        ], "If symptoms persist for more than 2 weeks, professional support is recommended."),
        qq("mh22-q4", "What is an EAP?", [
          { text: "Emergency Action Plan", isCorrect: false },
          { text: "Employee Assistance Program", isCorrect: true },
          { text: "Employer Assessment Protocol", isCorrect: false },
          { text: "Exit and Assembly Point", isCorrect: false },
        ], "EAP stands for Employee Assistance Program — a confidential support service for employees."),
      ],
      passingScore: 70,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 5: Technical & Job Skills (5 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 23. Operating Barcode Scanners Correctly
  {
    title: "Operating Barcode Scanners Correctly",
    description: "Learn proper barcode scanner operation including scanning techniques, troubleshooting common errors, and maintaining accuracy.",
    contentType: "mixed", durationMinutes: 4, difficulty: "beginner",
    category: "Technical & Job Skills", tags: ["barcode", "scanner", "inventory", "technology"], language: "en",
    content: {
      blocks: [
        tb("bs23-b1", "Barcode scanners are essential tools in retail, warehousing, healthcare, and logistics. Proper use ensures accurate inventory, faster checkouts, and fewer errors.\n\nTypes of Barcode Scanners:\n• Handheld laser scanners — point and click, most common\n• CCD (LED) scanners — close-range, good for retail\n• 2D imagers — can read QR codes and damaged barcodes\n• Ring scanners — worn on the finger, hands-free for warehouse work\n• Fixed-mount scanners — built into checkout counters", 0),
        tb("bs23-b2", "Proper Scanning Technique:\n\n1. Hold the scanner 4-6 inches from the barcode\n2. Aim the laser line across the entire barcode\n3. Keep the scanner steady — don't wave it around\n4. Wait for the confirmation beep before moving to the next item\n5. If it doesn't scan, try adjusting the angle slightly\n\nTroubleshooting:\n• Barcode won't scan → Check for damage, dirt, or wrinkles. Try a different angle.\n• Wrong item scanned → Verify the barcode matches the product. Use manual entry if needed.\n• Scanner not responding → Check battery, connection, and restart if necessary.\n• Double scan → Wait for confirmation beep before scanning the next item.\n\nAccuracy matters: One scanning error can cascade through inventory, ordering, and billing systems.", 1),
      ],
      quizQuestions: [
        qq("bs23-q1", "How far should you hold a handheld scanner from the barcode?", [
          { text: "1 inch", isCorrect: false },
          { text: "4-6 inches", isCorrect: true },
          { text: "12 inches", isCorrect: false },
          { text: "As close as possible", isCorrect: false },
        ], "The optimal scanning distance for most handheld scanners is 4-6 inches."),
        qq("bs23-q2", "What should you do if a barcode won't scan?", [
          { text: "Skip the item", isCorrect: false },
          { text: "Check for damage and try a different angle", isCorrect: true },
          { text: "Enter a random code", isCorrect: false },
          { text: "Throw the scanner away", isCorrect: false },
        ], "Check for barcode damage, dirt, or wrinkles, and try adjusting the scanning angle."),
        qq("bs23-q3", "Why is scanning accuracy important?", [
          { text: "It's not that important", isCorrect: false },
          { text: "Errors cascade through inventory, ordering, and billing", isCorrect: true },
          { text: "Only for the checkout speed", isCorrect: false },
          { text: "It only matters for expensive items", isCorrect: false },
        ], "One scanning error can cause problems across inventory, ordering, and billing systems."),
      ],
      passingScore: 70,
    },
  },

  // 24. Basic Inventory Counting Methods
  {
    title: "Basic Inventory Counting Methods",
    description: "Learn fundamental inventory counting techniques including cycle counting, ABC analysis, and common error prevention strategies.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner",
    category: "Technical & Job Skills", tags: ["inventory", "counting", "warehouse", "accuracy"], language: "en",
    content: {
      blocks: [
        tb("ic24-b1", "Accurate inventory counts are the foundation of any business that handles physical goods. Inaccurate counts lead to stockouts, overstocking, lost sales, and financial discrepancies.\n\nInventory Counting Methods:\n\n1. Full Physical Count — Counting every item in the facility. Usually done annually. Time-consuming but comprehensive.\n\n2. Cycle Counting — Counting a small portion of inventory on a rotating schedule. Less disruptive and catches errors faster.\n\n3. ABC Analysis:\n   • A items — High value, low quantity (count frequently)\n   • B items — Medium value, medium quantity (count regularly)\n   • C items — Low value, high quantity (count less often)\n   This focuses your effort where it matters most.", 0),
        tb("ic24-b2", "Counting Best Practices:\n\n• Count in pairs — one person counts, another records\n• Count in the same direction every time (left to right, top to bottom)\n• Use a systematic pattern — don't jump around\n• Mark counted sections to avoid double-counting\n• Count during low-activity periods when possible\n• Never estimate — count every single item\n\nCommon Errors to Avoid:\n• Counting items in wrong units (boxes vs. individual items)\n• Miscounting due to distractions or rushing\n• Not accounting for items in transit or on hold\n• Skipping hard-to-reach areas\n• Recording numbers incorrectly (transposing digits)\n\nRemember: If your count doesn't match the system, recount before adjusting.", 1),
      ],
      quizQuestions: [
        qq("ic24-q1", "What is cycle counting?", [
          { text: "Counting inventory while riding a bicycle", isCorrect: false },
          { text: "Counting a small portion of inventory on a rotating schedule", isCorrect: true },
          { text: "Counting everything once a year", isCorrect: false },
          { text: "Counting only damaged items", isCorrect: false },
        ], "Cycle counting means counting a portion of inventory regularly on a rotating schedule."),
        qq("ic24-q2", "In ABC analysis, which items should be counted most frequently?", [
          { text: "C items (low value)", isCorrect: false },
          { text: "B items (medium value)", isCorrect: false },
          { text: "A items (high value)", isCorrect: true },
          { text: "All items equally", isCorrect: false },
        ], "A items are high-value and should be counted most frequently to prevent costly errors."),
        qq("ic24-q3", "What should you do if your count doesn't match the system?", [
          { text: "Adjust the system to match your count", isCorrect: false },
          { text: "Recount before making any adjustments", isCorrect: true },
          { text: "Ignore the difference", isCorrect: false },
          { text: "Average the two numbers", isCorrect: false },
        ], "Always recount before adjusting system records to ensure accuracy."),
      ],
      passingScore: 70,
    },
  },

  // 25. Safe Forklift Operation Principles
  {
    title: "Safe Forklift Operation Principles",
    description: "Essential safety principles for forklift operation including pre-use inspection, load handling, and pedestrian awareness.",
    contentType: "mixed", durationMinutes: 6, difficulty: "intermediate",
    category: "Technical & Job Skills", tags: ["forklift", "safety", "warehouse", "operation"], language: "en",
    content: {
      blocks: [
        tb("fo25-b1", "Forklifts are responsible for approximately 85 deaths and 34,900 serious injuries in the workplace each year. They are powerful machines that demand respect and proper training.\n\nPre-Operation Inspection (Every Shift):\n✓ Tires — check for damage and proper inflation\n✓ Forks — check for cracks, bends, or wear\n✓ Fluid levels — hydraulic fluid, engine oil, coolant\n✓ Brakes — test both service and parking brakes\n✓ Lights and horn — ensure all are working\n✓ Seat belt — must be functional and worn at all times\n✓ Mast and chains — check for damage or unusual wear\n\nNever operate a forklift that fails inspection. Report it immediately.", 0),
        ib("safe-forklift-operat-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-forklift-SPYniiQmwTK7K96y8xa6fR.webp", "Safe Forklift Operation Principles", 1),
        tb("fo25-b2", "Safe Operating Principles:\n\n• Always wear your seat belt — tip-overs are the #1 cause of forklift deaths\n• Travel with forks 4-6 inches off the ground\n• Never exceed the rated load capacity\n• Look in the direction of travel — use mirrors and spotters\n• Slow down at intersections, corners, and near pedestrians\n• Never allow passengers on the forklift\n• Sound the horn at blind corners and intersections\n• Keep a safe following distance from other vehicles\n\nLoad Handling:\n• Center the load on the forks\n• Tilt the mast back slightly to stabilize\n• If the load blocks your view, travel in reverse\n• Never raise or lower loads while moving\n• Set loads down gently — don't drop them", 1),
      ],
      quizQuestions: [
        qq("fo25-q1", "What is the #1 cause of forklift-related deaths?", [
          { text: "Collisions with other vehicles", isCorrect: false },
          { text: "Tip-overs", isCorrect: true },
          { text: "Falling loads", isCorrect: false },
          { text: "Pedestrian strikes", isCorrect: false },
        ], "Tip-overs are the leading cause of forklift fatalities — always wear your seat belt."),
        qq("fo25-q2", "How high should forks be when traveling without a load?", [
          { text: "On the ground", isCorrect: false },
          { text: "4-6 inches off the ground", isCorrect: true },
          { text: "At waist height", isCorrect: false },
          { text: "As high as possible", isCorrect: false },
        ], "Travel with forks 4-6 inches off the ground to maintain stability and clearance."),
        qq("fo25-q3", "What should you do if a load blocks your forward view?", [
          { text: "Drive slowly forward", isCorrect: false },
          { text: "Travel in reverse", isCorrect: true },
          { text: "Ask someone to walk ahead", isCorrect: false },
          { text: "Raise the load higher", isCorrect: false },
        ], "When a load blocks your view, travel in reverse so you can see where you're going."),
        qq("fo25-q4", "When should you perform a pre-operation forklift inspection?", [
          { text: "Once a week", isCorrect: false },
          { text: "Once a month", isCorrect: false },
          { text: "Every shift before use", isCorrect: true },
          { text: "Only after an incident", isCorrect: false },
        ], "Pre-operation inspections must be done every shift before the forklift is used."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-forklift-SPYniiQmwTK7K96y8xa6fR.webp",
  },

  // 26. Handling Hazardous Materials (intro)
  {
    title: "Handling Hazardous Materials: Introduction",
    description: "Introduction to hazardous materials awareness including GHS labeling, Safety Data Sheets, and basic handling precautions.",
    contentType: "mixed", durationMinutes: 6, difficulty: "intermediate",
    category: "Technical & Job Skills", tags: ["hazmat", "safety", "chemicals", "GHS"], language: "en",
    content: {
      blocks: [
        tb("hm26-b1", "Hazardous materials (hazmat) are substances that can cause harm to people, property, or the environment. They're found in nearly every industry — cleaning chemicals in hospitality, solvents in manufacturing, medications in healthcare.\n\nThe GHS Labeling System (Globally Harmonized System):\nAll hazardous chemicals must have labels with:\n• Product identifier — chemical name\n• Signal word — 'Danger' (severe) or 'Warning' (less severe)\n• Hazard pictograms — red-bordered diamond symbols showing hazard types\n• Hazard statements — describe the nature of the hazard\n• Precautionary statements — how to handle, store, and dispose safely\n• Supplier information — manufacturer contact details", 0),
        ib("handling-hazardous-m-img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-hazmat-P2ANfJBJatAwEPFS7L2t7T.webp", "Handling Hazardous Materials", 1),
        tb("hm26-b2", "Safety Data Sheets (SDS):\n\nEvery hazardous chemical in your workplace has a 16-section SDS. Key sections to know:\n• Section 2 — Hazard identification\n• Section 4 — First aid measures\n• Section 7 — Handling and storage\n• Section 8 — Exposure controls and PPE requirements\n\nBasic Handling Rules:\n1. Read the label BEFORE handling any chemical\n2. Wear the required PPE (check the SDS)\n3. Never mix chemicals unless specifically instructed\n4. Use chemicals only for their intended purpose\n5. Store chemicals in their original containers\n6. Know the location of eyewash stations and emergency showers\n7. Report spills immediately — do not attempt cleanup without proper training\n\nRemember: If you don't know what it is, don't touch it.", 1),
      ],
      quizQuestions: [
        qq("hm26-q1", "What does GHS stand for?", [
          { text: "General Hazard Standards", isCorrect: false },
          { text: "Globally Harmonized System", isCorrect: true },
          { text: "Government Health and Safety", isCorrect: false },
          { text: "Global Handling Specifications", isCorrect: false },
        ], "GHS stands for Globally Harmonized System of Classification and Labelling of Chemicals."),
        qq("hm26-q2", "Which SDS section tells you what PPE to wear?", [
          { text: "Section 2", isCorrect: false },
          { text: "Section 4", isCorrect: false },
          { text: "Section 8", isCorrect: true },
          { text: "Section 16", isCorrect: false },
        ], "Section 8 of the SDS covers exposure controls and personal protection equipment."),
        qq("hm26-q3", "What should you do if you encounter an unknown chemical spill?", [
          { text: "Clean it up with paper towels", isCorrect: false },
          { text: "Report it immediately and do not attempt cleanup without training", isCorrect: true },
          { text: "Pour water on it", isCorrect: false },
          { text: "Ignore it if it's small", isCorrect: false },
        ], "Never attempt to clean up unknown chemicals — report immediately and let trained personnel handle it."),
        qq("hm26-q4", "What signal word on a chemical label indicates the most severe hazard?", [
          { text: "Caution", isCorrect: false },
          { text: "Warning", isCorrect: false },
          { text: "Danger", isCorrect: true },
          { text: "Notice", isCorrect: false },
        ], "'Danger' indicates the most severe hazards; 'Warning' is for less severe hazards."),
      ],
      passingScore: 75,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-hazmat-P2ANfJBJatAwEPFS7L2t7T.webp",
  },

  // 27. Digital Tools: Logging into HR Systems
  {
    title: "Digital Tools: Logging into HR Systems",
    description: "Step-by-step guide to accessing workplace HR systems including password management, self-service portals, and common troubleshooting.",
    contentType: "article", durationMinutes: 4, difficulty: "beginner",
    category: "Technical & Job Skills", tags: ["digital", "HR", "technology", "login"], language: "en",
    content: {
      blocks: [
        tb("dt27-b1", "Many shift workers need to access HR systems for schedules, pay stubs, time-off requests, and benefits. These systems can feel intimidating, but they follow simple patterns.\n\nCommon HR System Tasks:\n• Viewing your schedule and requesting shift swaps\n• Checking pay stubs and tax documents\n• Requesting time off or sick leave\n• Updating personal information (address, emergency contacts)\n• Completing required training modules\n• Viewing benefits and enrollment options", 0),
        tb("dt27-b2", "Login Best Practices:\n\n1. Use your company-provided credentials (usually employee ID + password)\n2. Never share your login with anyone — you're responsible for actions under your account\n3. Use a strong password: 12+ characters, mix of letters, numbers, and symbols\n4. Enable two-factor authentication (2FA) if available\n5. Log out when finished, especially on shared computers\n6. Bookmark the correct URL — don't click links in suspicious emails\n\nTroubleshooting:\n• Forgot password → Use the 'Forgot Password' link, not a coworker's account\n• Account locked → Contact IT or HR — usually unlocks after 30 minutes\n• Can't find a feature → Check the help section or ask your supervisor\n• System is slow → Try a different browser or clear your cache\n\nSecurity Tip: HR systems contain sensitive personal data. Treat your login credentials like your bank PIN.", 1),
      ],
      quizQuestions: [
        qq("dt27-q1", "What should you do if you forget your HR system password?", [
          { text: "Use a coworker's account", isCorrect: false },
          { text: "Use the 'Forgot Password' link", isCorrect: true },
          { text: "Try common passwords until one works", isCorrect: false },
          { text: "Create a new account", isCorrect: false },
        ], "Always use the official 'Forgot Password' function to reset your credentials securely."),
        qq("dt27-q2", "Why should you never share your HR system login?", [
          { text: "It's not a big deal", isCorrect: false },
          { text: "You're responsible for all actions under your account", isCorrect: true },
          { text: "The system will crash", isCorrect: false },
          { text: "It only matters for managers", isCorrect: false },
        ], "You are accountable for everything done under your login — sharing creates security and liability risks."),
        qq("dt27-q3", "What makes a strong password?", [
          { text: "Your name and birthday", isCorrect: false },
          { text: "The word 'password'", isCorrect: false },
          { text: "12+ characters with letters, numbers, and symbols", isCorrect: true },
          { text: "A short, easy-to-remember word", isCorrect: false },
        ], "Strong passwords are at least 12 characters with a mix of letters, numbers, and symbols."),
      ],
      passingScore: 70,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CATEGORY 6: Personal Development (3 lessons)
  // ═══════════════════════════════════════════════════════════════════════

  // 28. Setting SMART Goals for Career Growth
  {
    title: "Setting SMART Goals for Career Growth",
    description: "Learn the SMART goal framework to set clear, achievable career objectives that drive professional growth in shift-based roles.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Personal Development", tags: ["goals", "career", "SMART", "development"], language: "en",
    content: {
      blocks: [
        tb("sg28-b1", "Career growth doesn't happen by accident — it happens by design. The SMART framework turns vague wishes into actionable plans.\n\nSMART Goals:\n• S — Specific: What exactly do you want to achieve?\n• M — Measurable: How will you know you've achieved it?\n• A — Achievable: Is it realistic given your current situation?\n• R — Relevant: Does it align with your career direction?\n• T — Time-bound: When will you achieve it by?\n\nVague goal: 'I want to get promoted.'\nSMART goal: 'I will complete the shift supervisor certification by September 30th by studying 30 minutes per day and passing the exam with 85% or higher.'", 0),
        ib("setting-smart-goals--img", "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-smart-goals-CojxDmKMXgCjLR8y62Ffmw.webp", "Setting SMART Goals for Career Growth", 1),
        tb("sg28-b2", "Career Growth Paths for Shift Workers:\n\n• Lateral moves — Learn different roles to become more versatile\n• Vertical moves — Advance to supervisor, team lead, or manager\n• Skill-based growth — Get certified in specialized areas\n• Cross-training — Learn adjacent roles to increase your value\n\nAction Steps:\n1. Identify where you want to be in 1 year and 3 years\n2. Talk to people who are already in those roles\n3. Identify the skills and certifications you need\n4. Set 3 SMART goals for the next 90 days\n5. Review progress weekly and adjust as needed\n\nRemember: Small, consistent steps beat big, sporadic efforts. 30 minutes of learning per day = 182 hours per year.", 1),
      ],
      quizQuestions: [
        qq("sg28-q1", "What does the 'M' in SMART goals stand for?", [
          { text: "Motivating", isCorrect: false },
          { text: "Measurable", isCorrect: true },
          { text: "Meaningful", isCorrect: false },
          { text: "Manageable", isCorrect: false },
        ], "M stands for Measurable — you need a way to track progress and know when you've achieved it."),
        qq("sg28-q2", "Which is an example of a SMART goal?", [
          { text: "'I want to be successful'", isCorrect: false },
          { text: "'I'll complete the safety certification by June 30th'", isCorrect: true },
          { text: "'I'll try to do better at work'", isCorrect: false },
          { text: "'I want more money'", isCorrect: false },
        ], "A SMART goal is specific, measurable, achievable, relevant, and time-bound."),
        qq("sg28-q3", "How often should you review your SMART goals?", [
          { text: "Once a year", isCorrect: false },
          { text: "Weekly", isCorrect: true },
          { text: "Never — just set and forget", isCorrect: false },
          { text: "Only when your manager asks", isCorrect: false },
        ], "Weekly reviews help you stay on track and make adjustments as needed."),
        qq("sg28-q4", "How many hours of learning does 30 minutes per day add up to in a year?", [
          { text: "52 hours", isCorrect: false },
          { text: "100 hours", isCorrect: false },
          { text: "182 hours", isCorrect: true },
          { text: "365 hours", isCorrect: false },
        ], "30 minutes × 365 days = 182.5 hours of learning per year."),
      ],
      passingScore: 70,
    },
    thumbnailUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029149863/hiMSRR6jLFgWQvJW7KXFLZ/lesson-smart-goals-CojxDmKMXgCjLR8y62Ffmw.webp",
  },

  // 29. Building Confidence in Workplace Communication
  {
    title: "Building Confidence in Workplace Communication",
    description: "Develop the confidence to speak up, share ideas, and communicate effectively with managers, colleagues, and customers.",
    contentType: "article", durationMinutes: 5, difficulty: "beginner",
    category: "Personal Development", tags: ["confidence", "communication", "speaking", "development"], language: "en",
    content: {
      blocks: [
        tb("bc29-b1", "Many shift workers hesitate to speak up — whether it's sharing an idea, reporting a concern, or asking a question. Building communication confidence is a skill that can be developed with practice.\n\nWhy Confidence Matters:\n• Confident communicators are more likely to be promoted\n• Speaking up about safety concerns prevents accidents\n• Sharing ideas leads to process improvements\n• Clear communication reduces errors and misunderstandings\n\nThe Confidence-Competence Loop:\nConfidence grows from competence, and competence grows from practice. The more you communicate, the better you get, and the more confident you become.", 0),
        tb("bc29-b2", "Practical Confidence-Building Strategies:\n\n1. Start small — Share one idea per shift in team discussions\n2. Prepare what you want to say — Even 10 seconds of mental rehearsal helps\n3. Use 'I' statements — 'I noticed...' or 'I suggest...' instead of hedging\n4. Accept imperfection — You don't need perfect words, just clear intent\n5. Ask questions — Curious people are seen as engaged, not ignorant\n6. Practice with trusted colleagues first before larger groups\n7. Celebrate small wins — Each time you speak up, acknowledge it\n\nPhrases for Speaking Up:\n• 'I have a suggestion about...'\n• 'I noticed something that might help...'\n• 'Can I share an observation?'\n• 'I'm not sure I understand — could you explain...?'\n• 'I respectfully disagree because...'\n\nRemember: Your perspective is valuable. No one else sees the work from your exact vantage point.", 1),
      ],
      quizQuestions: [
        qq("bc29-q1", "What is the Confidence-Competence Loop?", [
          { text: "Confidence and competence are unrelated", isCorrect: false },
          { text: "Practice builds competence, which builds confidence, which encourages more practice", isCorrect: true },
          { text: "You're either confident or you're not", isCorrect: false },
          { text: "Confidence comes from job title only", isCorrect: false },
        ], "The loop: practice → competence → confidence → more practice. It's a positive cycle."),
        qq("bc29-q2", "What is a good way to start building communication confidence?", [
          { text: "Give a speech to the entire company", isCorrect: false },
          { text: "Share one idea per shift in team discussions", isCorrect: true },
          { text: "Wait until you're fully confident before speaking", isCorrect: false },
          { text: "Only communicate in writing", isCorrect: false },
        ], "Starting small with one idea per shift builds confidence gradually without overwhelming you."),
        qq("bc29-q3", "Why are 'I' statements effective in workplace communication?", [
          { text: "They sound more authoritative", isCorrect: false },
          { text: "They own your perspective without blaming others", isCorrect: true },
          { text: "They are required by HR", isCorrect: false },
          { text: "They are more grammatically correct", isCorrect: false },
        ], "'I' statements own your perspective and avoid sounding accusatory or defensive."),
      ],
      passingScore: 70,
    },
  },

  // 30. Continuous Learning Mindset
  {
    title: "Continuous Learning Mindset: Why Micro-Learning Matters",
    description: "Understand the science behind micro-learning and develop a growth mindset that drives continuous professional improvement.",
    contentType: "mixed", durationMinutes: 5, difficulty: "beginner",
    category: "Personal Development", tags: ["learning", "growth mindset", "micro-learning", "development"], language: "en",
    content: {
      blocks: [
        tb("cl30-b1", "The half-life of skills is shrinking. Skills that were relevant 10 years ago may be obsolete today. Continuous learning isn't optional — it's survival.\n\nWhy Micro-Learning Works:\n• Bite-sized lessons (3-10 minutes) fit into busy shift schedules\n• Spaced repetition improves long-term retention by up to 80%\n• Just-in-time learning delivers knowledge when you need it\n• Mobile-friendly format means you can learn anywhere\n• Completion rates for micro-learning are 300% higher than traditional training\n\nThe Forgetting Curve:\nWithout reinforcement, we forget 70% of new information within 24 hours and 90% within a week. Micro-learning combats this through short, frequent sessions that reinforce key concepts.", 0),
        tb("cl30-b2", "Developing a Growth Mindset:\n\nFixed Mindset: 'I'm not good at this. I'll never learn it.'\nGrowth Mindset: 'I'm not good at this YET. I can improve with practice.'\n\nThe word 'yet' is the most powerful word in learning. It transforms limitations into possibilities.\n\nBuilding Your Learning Habit:\n1. Commit to 5 minutes of learning per day — that's all it takes to start\n2. Link learning to an existing habit (e.g., learn during your commute or break)\n3. Track your progress — visible progress motivates continued effort\n4. Teach what you learn — explaining to others deepens your understanding\n5. Embrace mistakes — they are data points for improvement, not failures\n\nRemember: The person who learns the fastest wins. In a changing world, your ability to learn is your most valuable skill.", 1),
      ],
      quizQuestions: [
        qq("cl30-q1", "How much new information do we forget within 24 hours without reinforcement?", [
          { text: "10%", isCorrect: false },
          { text: "30%", isCorrect: false },
          { text: "70%", isCorrect: true },
          { text: "100%", isCorrect: false },
        ], "The forgetting curve shows we lose about 70% of new information within 24 hours."),
        qq("cl30-q2", "What makes micro-learning effective for shift workers?", [
          { text: "It's very long and detailed", isCorrect: false },
          { text: "Bite-sized lessons fit into busy schedules", isCorrect: true },
          { text: "It replaces all other training", isCorrect: false },
          { text: "It doesn't require any effort", isCorrect: false },
        ], "Short 3-10 minute lessons fit into the gaps in busy shift schedules."),
        qq("cl30-q3", "What is the key difference between a fixed and growth mindset?", [
          { text: "Fixed mindset people are smarter", isCorrect: false },
          { text: "Growth mindset believes abilities can be developed through effort", isCorrect: true },
          { text: "There is no real difference", isCorrect: false },
          { text: "Fixed mindset is better for shift work", isCorrect: false },
        ], "Growth mindset believes abilities can be developed; fixed mindset believes they're innate."),
        qq("cl30-q4", "How many minutes per day does it take to build a learning habit?", [
          { text: "30 minutes", isCorrect: false },
          { text: "1 hour", isCorrect: false },
          { text: "5 minutes", isCorrect: true },
          { text: "2 hours", isCorrect: false },
        ], "Just 5 minutes per day is enough to start building a consistent learning habit."),
      ],
      passingScore: 70,
    },
  },
];
