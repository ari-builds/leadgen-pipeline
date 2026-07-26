export const PERSONALIZATION_FIELDS = [
  "contact_name",
  "hook",
  "location",
  "cemetery_name",
  "service_type",
  "notes",
] as const;

type Lead = {
  contact_name: string;
  notes: string;
  score?: number;
  hook?: string;
  location?: string;
  id?: number;
  contact_email?: string;
  contact_phone?: string;
  contact_facebook?: string;
  contact_instagram?: string;
  contact_twitter?: string;
  contact_linkedin?: string;
  website?: string;
};

type EmailOutput = {
  subject: string;
  body: string;
  finding_instructions?: string;
};

function extractHook(lead: Lead): string {
  if (lead.hook && lead.hook.trim().length > 0) {
    return lead.hook.trim();
  }

  const lowerNotes = lead.notes.toLowerCase();

  if (lowerNotes.includes("veteran") || lowerNotes.includes("military")) {
    return "your family's veteran headstone";
  }
  if (lowerNotes.includes("genealog") || lowerNotes.includes("family history")) {
    return "your work preserving your family's history";
  }
  if (lowerNotes.includes("west hill")) {
    return "your family headstones at West Hills";
  }
  if (lowerNotes.includes("yakima")) {
    return "your family's memorial in Yakima";
  }
  if (lowerNotes.includes("clean") || lowerNotes.includes("restore")) {
    return "getting your loved one's headstone cleaned and restored";
  }
  if (lowerNotes.includes("tahoma")) {
    return "your family's plot at Tahoma Cemetery";
  }
  if (lowerNotes.includes("calvary")) {
    return "your family's memorial at Calvary Cemetery";
  }
  if (lowerNotes.includes("terrace")) {
    return "your family's headstone at Terrace Heights";
  }
  if (lowerNotes.includes("funeral")) {
    return "the families you serve with headstone care";
  }
  if (lowerNotes.includes("stolen") || lowerNotes.includes("vandal")) {
    return "restoring and protecting memorials";
  }
  if (lowerNotes.includes("mower") || lowerNotes.includes("damaged")) {
    return "repairing weather-worn headstones";
  }

  const sentences = lead.notes
    .split(/[.!\n]+/)
    .filter((s) => s.trim().length > 0);
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 100);
  }

  return "honoring your loved one's memory";
}

function extractDeceasedName(lead: Lead): string | null {
  // Try to find deceased person's name from notes
  const notes = lead.notes;
  // Common patterns: "in memory of [Name]", "for [Name]'s family", "[Name] headstone"
  const patterns = [
    /in memory of ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /for ([A-Z][a-z]+ [A-Z][a-z]+)'s family/i,
    /([A-Z][a-z]+ [A-Z][a-z]+)'s headstone/i,
    /([A-Z][a-z]+ [A-Z][a-z]+)'s memorial/i,
    /honoring ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /clean(?:ed|ing)? ([A-Z][a-z]+ [A-Z][a-z]+)'s/i,
    /restore[ds]? ([A-Z][a-z]+ [A-Z][a-z]+)'s/i,
  ];

  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function detectRole(lead: Lead): string {
  const lower = lead.notes.toLowerCase();
  if (lower.includes("funeral director") || lower.includes("funeral home")) {
    return "funeral_director";
  }
  if (lower.includes("cemetery") && (lower.includes("manager") || lower.includes("director") || lower.includes("staff"))) {
    return "cemetery_staff";
  }
  if (lower.includes("genealog") || lower.includes("family history") || lower.includes("ancestors")) {
    return "genealogist";
  }
  if (lower.includes("veteran") || lower.includes("military") || lower.includes("vfw") || lower.includes("legion")) {
    return "veteran";
  }
  if (lower.includes("restoration") || lower.includes("clean")) {
    return "restoration_enthusiast";
  }
  return "family_member";
}

function capitalize(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function makeSeed(lead: Lead): number {
  return (lead.id || 0) * 7 + (lead.contact_name || "").length * 13;
}

function scoreTier(score: number): "hot" | "warm" | "cool" {
  if (score >= 9) return "hot";
  if (score >= 7) return "warm";
  return "cool";
}

function hasContactInfo(lead: Lead): boolean {
  return !!(
    lead.contact_email ||
    lead.contact_phone ||
    lead.contact_facebook ||
    lead.contact_instagram ||
    lead.contact_twitter ||
    lead.contact_linkedin
  );
}

function getHowToFindThem(lead: Lead): string {
  const instructions: string[] = [];

  if (lead.website) {
    instructions.push(`Website: ${lead.website}`);
  }

  if (!lead.contact_facebook && lead.notes.toLowerCase().includes("funeral")) {
    instructions.push("Search Facebook for their funeral home name to find their page");
  }

  if (!lead.contact_instagram && lead.notes.toLowerCase().includes("floral")) {
    instructions.push("Search Instagram for their shop name + Yakima");
  }

  if (!lead.contact_phone && lead.website) {
    instructions.push("Check their website for a phone number or contact form");
  }

  if (!lead.contact_email && lead.website) {
    instructions.push("Check their website for an email address");
  }

  if (instructions.length === 0) {
    instructions.push("Search their business name on Google to find contact info");
    instructions.push("Check their website or social media pages for a phone/email");
  }

  return instructions.join("\n");
}

function getGreeting(lead: Lead): string {
  if (lead.contact_name && lead.contact_name.trim().length > 0) {
    return `Hi ${capitalize(lead.contact_name)}`;
  }
  return "Hi";
}

const SIGNATURE = `Ariana
On behalf of Legacy Memorial Restorations
netclicksbyari@gmail.com | Yakima, WA`;

export function generateEmailTemplate(
  type: "initial" | "followup_1" | "followup_2",
  lead: Lead,
): EmailOutput {
  const greeting = getGreeting(lead);
  const hook = extractHook(lead);
  const role = detectRole(lead);
  const score = lead.score || 5;
  const tier = scoreTier(score);
  const seed = makeSeed(lead);
  const locationRef = lead.location ? ` in ${lead.location}` : "";
  const deceasedName = extractDeceasedName(lead);
  const missingContact = !hasContactInfo(lead);
  const findingInstructions = missingContact ? getHowToFindThem(lead) : undefined;

  if (type === "initial") {
    return generateInitialEmail(greeting, hook, role, tier, seed, locationRef, lead.location, deceasedName, missingContact, findingInstructions);
  }
  if (type === "followup_1") {
    return generateFollowup1(greeting, hook, role, tier, seed, deceasedName);
  }
  return generateFollowup2(greeting, hook, role, tier, seed, deceasedName);
}

function generateInitialEmail(
  greeting: string,
  hook: string,
  role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
  locationRef: string,
  location?: string,
  deceasedName?: string | null,
  missingContact?: boolean,
  findingInstructions?: string,
): EmailOutput {
  const hotSubjects = [
    `A thought about ${hook}`,
    `Quick question for you`,
    `This reminded me of you`,
    `I couldn't help but think of you`,
    `Something worth knowing about`,
  ];
  const warmSubjects = [
    `Preserving what matters most${locationRef ? ` in ${location}` : ""}`,
    `A local resource for ${hook}`,
    `Something you might find meaningful`,
    `A quick note about memorial care`,
  ];
  const coolSubjects = [
    `A resource for families in Yakima`,
    `Headstone care â€” just in case you need it`,
    `Local restoration services available`,
    `Quick note about memorial preservation`,
  ];

  const subject = pick(tier === "hot" ? hotSubjects : tier === "warm" ? warmSubjects : coolSubjects, seed);

  const openings: Record<string, string[]> = {
    funeral_director: [
      `I know you help families through some of their hardest moments every day, so I wanted to reach out about something that might complement the care you already provide.`,
      `As someone who works closely with grieving families, you understand how much a beautiful memorial means. I wanted to share a resource that could help.`,
      `You already do so much for the families you serve. I wanted to let you know about a service that could add even more value to what you offer.`,
    ],
    cemetery_staff: [
      `I know you see headstones and memorials every day, and I imagine you notice when they need attention. I wanted to share something that might be useful.`,
      `Working at a cemetery, you understand better than anyone how weather affects memorials over time. I wanted to reach out about a local solution.`,
    ],
    genealogist: [
      `Your work preserving family history is truly meaningful, and I wanted to reach out about something that ties directly into that mission.`,
      `As someone who cares deeply about preserving the past, I thought you'd appreciate knowing about a local service that helps protect the actual memorials too.`,
    ],
    veteran: [
      `Thank you for your service and for honoring those who served alongside you. I wanted to share something that might help preserve those veterans' memorials.`,
      `As a veteran, you understand the importance of honoring those who served. I wanted to let you know about a service that helps preserve veterans' headstones.`,
    ],
    restoration_enthusiast: [
      `I noticed your interest in headstone care and restoration, and I wanted to share a local resource that might be right up your alley.`,
      `It's clear you care about preserving memorials. I wanted to let you know about a Yakima-based team that does excellent restoration work.`,
    ],
    family_member: deceasedName
      ? [
          `I came across your connection to ${deceasedName}'s memorial, and I wanted to share something that might be meaningful to you and your family.`,
          `I'm reaching out because I think you might appreciate knowing about a local resource for caring for ${deceasedName}'s headstone.`,
        ]
      : [
          `I hope this message finds you well. I came across your connection to ${hook}, and I wanted to share something that might be meaningful to you.`,
          `I'm reaching out because I think you might appreciate knowing about a local resource for memorial care.`,
        ],
  };

  const opening = pick(openings[role] || openings.family_member, seed);

  const hotBody = `
Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time â€” gentle cleaning, full restoration, and even placing fresh flowers and lights for special occasions.

I'm reaching out now because ${hook} â€” and I didn't want you to miss the chance to have that taken care of while the weather is good. Joseph and his team are already working with families across the Yakima Valley, and they offer a 50% veteran discount as their way of giving back.

Would you like me to connect you directly with Joseph? He can give you a quick, no-obligation estimate for any memorials you have in mind.`;

  const warmBody = `
Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time â€” whether it's gentle cleaning, full restoration, or placing fresh flowers and lights for special occasions.

I thought of you because ${hook}. If this is something you've been thinking about, I'd love to connect you with Joseph and his team. They're easy to work with and truly care about honoring every memorial they restore.

They also offer a 50% veteran discount, which is their way of honoring those who served.`;

  const coolBody = `
Legacy Memorial Restorations is a Yakima-based team that specializes in headstone cleaning and restoration. They help families preserve the beauty and dignity of memorials â€” from gentle cleaning to full restoration, and even flower and light placements for special occasions.

If ${hook} is something you've ever thought about, this might be worth knowing about. No pressure at all â€” just wanted to make sure you knew this resource existed here in Yakima.

They also offer a 50% veteran discount.`;

  const bodyParagraphs = tier === "hot" ? hotBody : tier === "warm" ? warmBody : coolBody;

  const hotClosings = [
    `I'd love to hear from you. Even a quick reply just so I know you saw this would be great.`,
    `Let me know if you'd like to connect with Joseph. I think you'll really like what they do.`,
    `I'm here if you have any questions. Just hit reply.`,
  ];
  const warmClosings = [
    `No pressure at all â€” just wanted to make sure you knew this resource existed here in Yakima.`,
    `Feel free to reply anytime if you'd like more information. I'm happy to help.`,
    `I hope this is helpful. Wishing you and your family well.`,
  ];
  const coolClosings = [
    `No pressure at all â€” just wanted to make sure you knew this was available.`,
    `If you ever need it, you know where to find us. Wishing you well.`,
    `Just in case this is ever useful to you or your family. Take care.`,
  ];

  const closing = pick(tier === "hot" ? hotClosings : tier === "warm" ? warmClosings : coolClosings, seed);

  let missingContactNote = "";
  if (missingContact && findingInstructions) {
    missingContactNote = `\n\n--- HOW TO REACH THEM ---\nNo email, phone, or social media was found for this lead. To reach them:\n${findingInstructions}\n---`;
  }

  const body = `${greeting},

${opening}${bodyParagraphs}

${closing}

${SIGNATURE}${missingContactNote}`;

  return { subject, body, finding_instructions: findingInstructions };
}

function generateFollowup1(
  greeting: string,
  hook: string,
  _role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
  deceasedName?: string | null,
): EmailOutput {
  const subjects = [
    `Following up`,
    `Did you get a chance to see this?`,
    `Quick follow-up â€” ${hook}`,
    `Just circling back`,
    `Still here if you need me`,
  ];
  const subject = pick(subjects, seed);

  const nameRef = deceasedName ? ` about ${deceasedName}'s memorial` : "";

  const bodies: Record<string, string[]> = {
    hot: [
      `I reached out recently${nameRef} and I wanted to make sure my message didn't get lost. I know how busy life gets, and I genuinely think Legacy Memorial Restorations could help.\n\nJoseph and his team are already working with families across Yakima, and I'd hate for you to miss out on getting ${hook} taken care of while the timing is right.\n\nWould it help if I just connected you two directly?`,
      `I know you're busy, so I'll keep this short. I sent you a note${nameRef} and I'd love to know if it's something worth exploring.\n\nEven a quick "not right now" would help me know where things stand. And if the timing is perfect â€” even better. Joseph at Legacy Memorial Restorations is ready to help whenever you are.`,
    ],
    warm: [
      `I just wanted to follow up on my last message${nameRef}. I know life gets busy, and I don't want to be a bother, but I wanted to make sure you saw this.\n\nIf this is something you've been meaning to look into, I'm happy to answer any questions or just point you in the right direction. Joseph and the team at Legacy Memorial Restorations are easy to work with.\n\nFeel free to reply anytime â€” I'm here to help however I can.`,
      `I hope you're doing well. I wanted to circle back on the resource I shared about headstone care in Yakima.\n\nIf ${hook} is still on your mind, Joseph and his team at Legacy Memorial Restorations would love to help. No rush at all â€” just keeping the door open.`,
    ],
    cool: [
      `I know I reached out recently and I don't want to take up too much of your time. I just wanted to make sure you knew that Legacy Memorial Restorations is available if ${hook} is ever something you'd like to explore.\n\nNo pressure â€” just here to help if you ever need it.`,
      `Quick follow-up on my earlier message. If headstone care isn't on your radar right now, no worries at all. But if it ever becomes relevant, I wanted you to know we're here.\n\nWishing you well.`,
    ],
  };

  const body = `${greeting},

${pick(bodies[tier] || bodies.warm, seed)}

${SIGNATURE}`;

  return { subject, body };
}

function generateFollowup2(
  greeting: string,
  hook: string,
  _role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
  deceasedName?: string | null,
): EmailOutput {
  const subjects = [
    `One last note`,
    `Closing the loop`,
    `A final thought`,
    `Before I go quiet`,
    `Last note from me`,
  ];
  const subject = pick(subjects, seed);

  const nameRef = deceasedName ? ` about ${deceasedName}'s memorial` : "";

  const bodies: Record<string, string[]> = {
    hot: [
      `I've reached out a couple of times${nameRef} and I want to respect your time. This is my last note unless you tell me otherwise.\n\nJoseph and Legacy Memorial Restorations are here whenever you're ready. Even if it's months from now, the offer stands. Sometimes the timing just isn't right, and that's completely okay.\n\nIf you'd like me to connect you, just reply "yes" and I'll make it happen. If not, I'll leave you in peace. Either way, I wish you and your family all the best.`,
      `I know I've sent a few messages and I don't want to overstep. I just really believe that ${hook} is worth taking care of, and I wanted to leave the door open one last time.\n\nIf the timing isn't right, I completely understand. If you've already handled it, that's wonderful. And if you'd like to explore it, I'm just a reply away.\n\nWishing you well.`,
    ],
    warm: [
      `I wanted to send one last note because I really do think this could be a wonderful thing for your family. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” and making sure that memorial stays beautiful for years to come â€” is exactly the kind of work Joseph and Legacy Memorial Restorations pour their hearts into.\n\nIf the timing isn't right, I completely understand. But if there's still a need, even a small one, please don't hesitate to reach out.`,
      `This is my final follow-up. I know you're busy and I don't want to be a bother.\n\nIf ${hook} is ever something you'd like to explore, I'm here. If not, I completely understand. Wishing you and your family well.`,
    ],
    cool: [
      `I just wanted to send one final note. If headstone care isn't something you need right now, no worries at all.\n\nBut if it ever becomes relevant â€” whether it's for your own family or someone you know â€” Legacy Memorial Restorations in Yakima is here to help.\n\nTake care.`,
      `This is my last message. I wanted to make sure you knew about Legacy Memorial Restorations in case ${hook} is ever something you'd like to address.\n\nNo pressure, no rush. Just here if you ever need us. Wishing you well.`,
    ],
  };

  const body = `${greeting},

${pick(bodies[tier] || bodies.warm, seed)}

${SIGNATURE}`;

  return { subject, body };
}

export function generateDMScript(
  platform: "facebook" | "instagram" | "twitter" | "other",
  lead: Lead,
): string {
  const hook = extractHook(lead);
  const score = lead.score || 5;
  const tier = scoreTier(score);
  const seed = makeSeed(lead);

  const hasFB = !!lead.contact_facebook;
  const hasIG = !!lead.contact_instagram;
  const hasTwitter = !!lead.contact_twitter;

  let findInstructions = "";
  if (platform === "facebook" && !hasFB) {
    findInstructions = "\n\n[FIND ON FACEBOOK: Search their business name on Facebook]";
  } else if (platform === "instagram" && !hasIG) {
    findInstructions = "\n\n[FIND ON INSTAGRAM: Search their business name on Instagram]";
  } else if (platform === "twitter" && !hasTwitter) {
    findInstructions = "\n\n[FIND ON X: Search their business name on X/Twitter]";
  }

  if (platform === "facebook") {
    const msgs: Record<string, string[]> = {
      hot: [
        `I came across your profile and wanted to reach out personally. I work with Legacy Memorial Restorations here in Yakima â€” they specialize in headstone cleaning and restoration. I noticed ${hook}, and I thought of you immediately. Would you be open to a quick chat about it? I'd love to connect you with Joseph and his team. No pressure at all â€” I just love connecting people with services that truly matter.`,
        `I'm Ariana. I work with a local Yakima team that helps families preserve their loved ones' memorials. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” and I thought you might be interested. Would it be okay if I shared some details with you?`,
      ],
      warm: [
        `I saw your post and wanted to reach out. I work with Legacy Memorial Restorations in Yakima â€” they specialize in headstone cleaning and restoration. I noticed ${hook}, and I thought of you. Would you be open to hearing more? No pressure at all.`,
        `I'm Ariana. I work with a local restoration team that helps families preserve headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” thought you might be interested. Let me know if you'd like to know more!`,
      ],
      cool: [
        `I wanted to reach out because I work with a local Yakima team that does headstone cleaning and restoration. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” just thought you might want to know this resource exists. No pressure at all!`,
        `Quick note â€” I work with Legacy Memorial Restorations in Yakima. They help families preserve and restore headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. If you're ever interested, I'd love to connect you. Take care!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 100) + findInstructions;
  }

  if (platform === "instagram") {
    const msgs: Record<string, string[]> = {
      hot: [
        `Saw your post and had to reach out. I work with a Yakima restoration team that helps families preserve headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” thought of you! Would love to connect if you're interested. No pressure!`,
        `Your post caught my eye. I work with Legacy Memorial Restorations in Yakima â€” they clean and restore headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Want to know more?`,
      ],
      warm: [
        `Saw your post and wanted to reach out. I work with a local Yakima team that preserves headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” thought of you! Interested?`,
        `I work with a headstone restoration team in Yakima. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Would love to connect you if interested!`,
      ],
      cool: [
        `Quick note â€” I work with a Yakima team that does headstone care. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Let me know if you'd like info!`,
        `Saw your post. I work with local restoration services in Yakima. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Happy to share more if interested!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 80) + findInstructions;
  }

  if (platform === "twitter") {
    const msgs: Record<string, string[]> = {
      hot: [
        `I work with a Yakima headstone restoration team. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” thought you might be interested. DM me if you'd like to know more!`,
        `Quick note â€” Legacy Memorial Restorations in Yakima helps families preserve headstones. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Happy to connect you!`,
      ],
      warm: [
        `I work with a local restoration team in Yakima. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Let me know if you'd like info!`,
        `Thought you might want to know about headstone restoration services in Yakima. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. DM me!`,
      ],
      cool: [
        `Headstone restoration services in Yakima. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Let me know if interested!`,
        `Local Yakima team does headstone care. ${hook.charAt(0).toUpperCase() + hook.slice(1)}. Happy to share more!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 50) + findInstructions;
  }

  const msg = `I'm Ariana. I work with Legacy Memorial Restorations in Yakima â€” they specialize in headstone cleaning and restoration. I noticed ${hook} and thought you might be interested. Let me know if you'd like to learn more!`;
  return truncateToWordLimit(msg, 100) + findInstructions;
}

export function generateFollowUpScript(
  platform: string,
  lead: Lead,
  previousMessages: string[],
): string {
  const hook = extractHook(lead);
  const seed = makeSeed(lead);

  const lastMessage =
    previousMessages[previousMessages.length - 1]?.toLowerCase() ?? "";
  const messageCount = previousMessages.length;

  if (
    lastMessage.includes("not interested") ||
    lastMessage.includes("no thank") ||
    lastMessage.includes("stop")
  ) {
    return `I completely understand and respect your decision. I won't reach out again about this. Wishing you and your family all the best.`;
  }

  if (messageCount === 0) {
    return generateDMScript(
      platform === "instagram"
        ? "instagram"
        : platform === "twitter"
          ? "twitter"
          : "facebook",
      lead,
    );
  }

  if (
    lastMessage.includes("tell me more") ||
    lastMessage.includes("interested") ||
    lastMessage.includes("sounds like")
  ) {
    const followups = [
      `That's great! I'm so glad this resonated with you. Joseph and the team at Legacy Memorial Restorations are wonderful to work with. They offer headstone cleaning starting at $200â€“$325 and bronze restoration at $275+. They also do flower and light placements. Would it help if I connected you directly with Joseph so you can chat about ${hook}? Just let me know what works best for you!`,
      `Awesome! Legacy Memorial Restorations offers headstone cleaning ($200â€“$325+), bronze restoration ($275+), and flower placements. They also have a 50% veteran discount. Want me to set up a quick chat with Joseph? He's super easy to work with.`,
    ];
    return pick(followups, seed);
  }

  if (
    lastMessage.includes("price") ||
    lastMessage.includes("cost") ||
    lastMessage.includes("how much")
  ) {
    const priceResponses = [
      `Great question! Here's a quick breakdown: Headstone cleaning starts at $200â€“$325 depending on the size and condition. Bronze cleaning is $275+. They also offer flower and light placements for ongoing care. And if your loved one was a veteran, there's a 50% discount â€” it's Joseph's way of giving back. Want me to get you a free estimate?`,
      `Sure thing! Headstone cleaning: $200â€“$325. Bronze restoration: $275+. Flower/light placements also available. Veteran? 50% off. Want a free estimate from Joseph?`,
    ];
    return pick(priceResponses, seed);
  }

  if (messageCount >= 3) {
    return `I know I've reached out a few times and I don't want to be a bother. I just wanted to leave the door open â€” if ${hook} is ever something you'd like to explore, I'm here. Wishing you well!`;
  }

  const genericFollowups = [
    `Just circling back on ${hook}. I know timing isn't always perfect, but I wanted to make sure you knew this was an option whenever you're ready. No rush at all â€” just here to help when the time is right.`,
    `Just wanted to follow up. ${hook.charAt(0).toUpperCase() + hook.slice(1)} â€” still something you'd like to explore? I'm here whenever you're ready.`,
  ];
  return pick(genericFollowups, seed);
}

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

