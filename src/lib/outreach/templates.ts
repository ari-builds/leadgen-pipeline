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
};

type EmailOutput = {
  subject: string;
  body: string;
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

const SIGNATURE = `Ariana
Digital Marketing Director | NetClicks by Ari
On behalf of Legacy Memorial Restorations
netclicksbyari@gmail.com | Yakima, WA`;

export function generateEmailTemplate(
  type: "initial" | "followup_1" | "followup_2",
  lead: Lead,
): EmailOutput {
  const name = capitalize(lead.contact_name || "Friend");
  const hook = extractHook(lead);
  const role = detectRole(lead);
  const score = lead.score || 5;
  const tier = scoreTier(score);
  const seed = makeSeed(lead);
  const locationRef = lead.location ? ` in ${lead.location}` : "";

  if (type === "initial") {
    return generateInitialEmail(name, hook, role, tier, seed, locationRef, lead.location);
  }
  if (type === "followup_1") {
    return generateFollowup1(name, hook, role, tier, seed);
  }
  return generateFollowup2(name, hook, role, tier, seed);
}

function generateInitialEmail(
  name: string,
  hook: string,
  role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
  locationRef: string,
  location?: string,
): EmailOutput {
  // --- SUBJECT LINES (varies by tier + seed) ---
  const hotSubjects = [
    `${name}, I found something for you`,
    `A thought about ${hook}`,
    `Quick question for you, ${name}`,
    `${name} — this reminded me of you`,
    `I couldn't help but think of you`,
  ];
  const warmSubjects = [
    `Preserving what matters most${locationRef ? ` in ${location}` : ""}`,
    `A local resource for ${hook}`,
    `Something you might find meaningful`,
    `Connecting you with Legacy Memorial Restorations`,
    `${name}, a quick note about memorial care`,
  ];
  const coolSubjects = [
    `A resource for families in Yakima`,
    `Headstone care — just in case you need it`,
    `Local restoration services available`,
    `Quick note about memorial preservation`,
    `Something for your family to know about`,
  ];

  const subject = pick(tier === "hot" ? hotSubjects : tier === "warm" ? warmSubjects : coolSubjects, seed);

  // --- OPENING LINES (varies by role) ---
  const openings: Record<string, string[]> = {
    funeral_director: [
      `I know you help families through some of their hardest moments every day, so I wanted to reach out about something that might complement the care you already provide.`,
      `As someone who works closely with grieving families, you understand how much a beautiful memorial means. I wanted to share a resource that could help.`,
      `You already do so much for the families you serve. I wanted to let you know about a service that could add even more value to what you offer.`,
    ],
    cemetery_staff: [
      `I know you see headstones and memorials every day, and I imagine you notice when they need attention. I wanted to share something that might be useful.`,
      `Working at a cemetery, you understand better than anyone how weather affects memorials over time. I wanted to reach out about a local solution.`,
      `You're probably more familiar than most with how headstones age and weather. I came across something I think you'd want to know about.`,
    ],
    genealogist: [
      `Your work preserving family history is truly meaningful, and I wanted to reach out about something that ties directly into that mission.`,
      `As someone who cares deeply about preserving the past, I thought you'd appreciate knowing about a local service that helps protect the physical memorials too.`,
      `The work you do tracing family histories is incredible. I wanted to share a resource that could help preserve the actual headstones and markers your research uncovers.`,
    ],
    veteran: [
      `Thank you for your service and for honoring those who served alongside you. I wanted to share something that might help preserve those veterans' memorials.`,
      `As a veteran, you understand the importance of honoring those who served. I wanted to let you know about a service that helps preserve veterans' headstones.`,
      `Your commitment to honoring our veterans' memories is inspiring. I wanted to reach out about a resource that could help maintain those sacred memorials.`,
    ],
    restoration_enthusiast: [
      `I noticed your interest in headstone care and restoration, and I wanted to share a local resource that might be right up your alley.`,
      `It's clear you care about preserving memorials. I wanted to let you know about a Yakima-based team that does excellent restoration work.`,
      `Someone who appreciates the importance of headstone restoration — I wanted to connect you with a local team doing great work in this space.`,
    ],
    family_member: [
      `I hope this message finds you well. I came across your connection to ${hook}, and I wanted to share something that might be meaningful to you.`,
      `I'm reaching out because I think you might appreciate knowing about a local resource for memorial care.`,
      `I wanted to reach out personally because I think this could matter to you and your family.`,
    ],
  };

  const opening = pick(openings[role] || openings.family_member, seed);

  // --- BODY PARAGRAPHS (varies by tier) ---
  const hotBody = `

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — gentle cleaning, full restoration, and even placing fresh flowers and lights for special occasions.

I'm reaching out now because ${hook} — and I didn't want you to miss the chance to have that taken care of while the weather is good. Joseph and his team are already working with families across the Yakima Valley, and they offer a 50% veteran discount as their way of giving back.

Would you like me to connect you directly with Joseph? He can give you a quick, no-obligation estimate for any memorials you have in mind.`;

  const warmBody = `

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — whether it's gentle cleaning, full restoration, or placing fresh flowers and lights for special occasions.

I thought of you because ${hook}. If this is something you've been thinking about, I'd love to connect you with Joseph and his team. They're easy to work with and truly care about honoring every memorial they restore.

They also offer a 50% veteran discount, which is their way of honoring those who served.`;

  const coolBody = `

Legacy Memorial Restorations is a Yakima-based team that specializes in headstone cleaning and restoration. They help families preserve the beauty and dignity of memorials — from gentle cleaning to full restoration, and even flower and light placements for special occasions.

If ${hook} is something you've ever thought about, this might be worth knowing about. No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.

They also offer a 50% veteran discount.`;

  const bodyParagraphs = tier === "hot" ? hotBody : tier === "warm" ? warmBody : coolBody;

  // --- CLOSINGS (varies by tier + seed) ---
  const hotClosings = [
    `I'd love to hear from you, ${name}. Even a quick reply just so I know you saw this would be great.`,
    `Let me know if you'd like to connect with Joseph, ${name}. I think you'll really like what they do.`,
    `I'm here if you have any questions, ${name}. Just hit reply.`,
  ];
  const warmClosings = [
    `No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.`,
    `Feel free to reply anytime if you'd like more information. I'm happy to help.`,
    `I hope this is helpful, ${name}. Wishing you and your family well.`,
  ];
  const coolClosings = [
    `No pressure at all — just wanted to make sure you knew this was available.`,
    `If you ever need it, you know where to find us. Wishing you well.`,
    `Just in case this is ever useful to you or your family. Take care, ${name}.`,
  ];

  const closing = pick(tier === "hot" ? hotClosings : tier === "warm" ? warmClosings : coolClosings, seed);

  const body = `Hi ${name},

${opening}${bodyParagraphs}

${closing}

${SIGNATURE}`;

  return { subject, body };
}

function generateFollowup1(
  name: string,
  hook: string,
  _role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
): EmailOutput {
  const subjects = [
    `Following up, ${name}`,
    `Did you get a chance to see this?`,
    `Quick follow-up — ${hook}`,
    `${name}, just circling back`,
    `Still here if you need me`,
  ];
  const subject = pick(subjects, seed);

  const bodies: Record<string, string[]> = {
    hot: [
      `I reached out recently about ${hook} and I wanted to make sure my message didn't get lost. I know how busy life gets, and I genuinely think Legacy Memorial Restorations could help.\n\nJoseph and his team are already working with families across Yakima, and I'd hate for you to miss out on getting ${hook} taken care of while the timing is right.\n\nWould it help if I just connected you two directly?`,
      `Hi ${name}, I know you're busy, so I'll keep this short. I sent you a note about ${hook} and I'd love to know if it's something worth exploring.\n\nEven a quick "not right now" would help me know where things stand. And if the timing is perfect — even better. Joseph at Legacy Memorial Restorations is ready to help whenever you are.`,
    ],
    warm: [
      `I just wanted to follow up on my last message about ${hook}. I know life gets busy, and I don't want to be a bother, but I wanted to make sure you saw this.\n\nIf this is something you've been meaning to look into, I'm happy to answer any questions or just point you in the right direction. Joseph and the team at Legacy Memorial Restorations are easy to work with.\n\nFeel free to reply anytime — I'm here to help however I can.`,
      `Hi ${name}, I hope you're doing well. I wanted to circle back on the resource I shared about headstone care in Yakima.\n\nIf ${hook} is still on your mind, Joseph and his team at Legacy Memorial Restorations would love to help. No rush at all — just keeping the door open.`,
    ],
    cool: [
      `I know I reached out recently and I don't want to take up too much of your time. I just wanted to make sure you knew that Legacy Memorial Restorations is available if ${hook} is ever something you'd like to explore.\n\nNo pressure — just here to help if you ever need it.`,
      `Hi ${name}, quick follow-up on my earlier message. If headstone care isn't on your radar right now, no worries at all. But if it ever becomes relevant, I wanted you to know we're here.\n\nWishing you well.`,
    ],
  };

  const body = `Hi ${name},

${pick(bodies[tier] || bodies.warm, seed)}

${SIGNATURE}`;

  return { subject, body };
}

function generateFollowup2(
  name: string,
  hook: string,
  _role: string,
  tier: "hot" | "warm" | "cool",
  seed: number,
): EmailOutput {
  const subjects = [
    `One last note, ${name}`,
    `Closing the loop`,
    `Still thinking of you, ${name}`,
    `Before I go quiet`,
    `${name}, a final thought`,
  ];
  const subject = pick(subjects, seed);

  const bodies: Record<string, string[]> = {
    hot: [
      `${name}, I've reached out a couple of times about ${hook} and I want to respect your time. This is my last note unless you tell me otherwise.\n\nJoseph and Legacy Memorial Restorations are here whenever you're ready. Even if it's months from now, the offer stands. Sometimes the timing just isn't right, and that's completely okay.\n\nIf you'd like me to connect you, just reply "yes" and I'll make it happen. If not, I'll leave you in peace. Either way, I wish you and your family all the best.`,
      `Hi ${name}, I know I've sent a few messages and I don't want to overstep. I just really believe that ${hook} is worth taking care of, and I wanted to leave the door open one last time.\n\nIf the timing isn't right, I completely understand. If you've already handled it, that's wonderful. And if you'd like to explore it, I'm just a reply away.\n\nWishing you well, ${name}.`,
    ],
    warm: [
      `I wanted to send one last note because I really do think this could be a wonderful thing for your family. ${capitalize(hook)} — and making sure that memorial stays beautiful for years to come — is exactly the kind of work Joseph and Legacy Memorial Restorations pour their hearts into.\n\nIf the timing isn't right, I completely understand. But if there's still a need, even a small one, please don't hesitate to reach out.`,
      `Hi ${name}, this is my final follow-up. I know you're busy and I don't want to be a bother.\n\nIf ${hook} is ever something you'd like to explore, I'm here. If not, I completely understand. Wishing you and your family well.`,
    ],
    cool: [
      `Hi ${name}, I just wanted to send one final note. If headstone care isn't something you need right now, no worries at all.\n\nBut if it ever becomes relevant — whether it's for your own family or someone you know — Legacy Memorial Restorations in Yakima is here to help.\n\nTake care, ${name}.`,
      `This is my last message, ${name}. I wanted to make sure you knew about Legacy Memorial Restorations in case ${hook} is ever something you'd like to address.\n\nNo pressure, no rush. Just here if you ever need us. Wishing you well.`,
    ],
  };

  const body = `Hi ${name},

${pick(bodies[tier] || bodies.warm, seed)}

${SIGNATURE}`;

  return { subject, body };
}

export function generateDMScript(
  platform: "facebook" | "instagram" | "twitter" | "other",
  lead: Lead,
): string {
  const name = capitalize(lead.contact_name || "Friend");
  const hook = extractHook(lead);
  const score = lead.score || 5;
  const tier = scoreTier(score);
  const seed = makeSeed(lead);

  if (platform === "facebook") {
    const msgs: Record<string, string[]> = {
      hot: [
        `Hi ${name}! I came across your profile and wanted to reach out personally. I work with Legacy Memorial Restorations here in Yakima — they specialize in headstone cleaning and restoration. I noticed ${hook}, and I thought of you immediately. Would you be open to a quick chat about it? I'd love to connect you with Joseph and his team. No pressure at all — I just love connecting people with services that truly matter.`,
        `Hey ${name}! I'm Ariana from NetClicks by Ari. I work with a local Yakima team that helps families preserve their loved ones' memorials. ${capitalize(hook)} — and I thought you might be interested. Would it be okay if I shared some details with you?`,
      ],
      warm: [
        `Hi ${name}! I saw your post and wanted to reach out. I work with Legacy Memorial Restorations in Yakima — they specialize in headstone cleaning and restoration. I noticed ${hook}, and I thought of you. Would you be open to hearing more? No pressure at all.`,
        `Hey ${name}! I'm Ariana from NetClicks by Ari. I work with a local restoration team that helps families preserve headstones. ${capitalize(hook)} — thought you might be interested. Let me know if you'd like to know more!`,
      ],
      cool: [
        `Hi ${name}! I wanted to reach out because I work with a local Yakima team that does headstone cleaning and restoration. ${capitalize(hook)} — just thought you might want to know this resource exists. No pressure at all!`,
        `Hey ${name}! Quick note — I work with Legacy Memorial Restorations in Yakima. They help families preserve and restore headstones. ${capitalize(hook)}. If you're ever interested, I'd love to connect you. Take care!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 100);
  }

  if (platform === "instagram") {
    const msgs: Record<string, string[]> = {
      hot: [
        `Hey ${name}! Saw your post and had to reach out. I work with a Yakima restoration team that helps families preserve headstones. ${capitalize(hook)} — thought of you! Would love to connect if you're interested. No pressure!`,
        `${name}! Your post caught my eye. I work with Legacy Memorial Restorations in Yakima — they clean and restore headstones. ${capitalize(hook)}. Want to know more?`,
      ],
      warm: [
        `Hey ${name}! Saw your post and wanted to reach out. I work with a local Yakima team that preserves headstones. ${capitalize(hook)} — thought of you! Interested?`,
        `Hi ${name}! I work with a headstone restoration team in Yakima. ${capitalize(hook)}. Would love to connect you if interested!`,
      ],
      cool: [
        `Hey ${name}! Quick note — I work with a Yakima team that does headstone care. ${capitalize(hook)}. Let me know if you'd like info!`,
        `Hi ${name}! Saw your post. I work with local restoration services in Yakima. ${capitalize(hook)}. Happy to share more if interested!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 80);
  }

  if (platform === "twitter") {
    const msgs: Record<string, string[]> = {
      hot: [
        `Hey ${name}! I work with a Yakima headstone restoration team. ${capitalize(hook)} — thought you might be interested. DM me if you'd like to know more!`,
        `${name}! Quick note — Legacy Memorial Restorations in Yakima helps families preserve headstones. ${capitalize(hook)}. Happy to connect you!`,
      ],
      warm: [
        `Hey ${name}! I work with a local restoration team in Yakima. ${capitalize(hook)}. Let me know if you'd like info!`,
        `Hi ${name}! Thought you might want to know about headstone restoration services in Yakima. ${capitalize(hook)}. DM me!`,
      ],
      cool: [
        `Hey ${name}! Headstone restoration services in Yakima. ${capitalize(hook)}. Let me know if interested!`,
        `Hi ${name}! Local Yakima team does headstone care. ${capitalize(hook)}. Happy to share more!`,
      ],
    };
    return truncateToWordLimit(pick(msgs[tier] || msgs.warm, seed), 50);
  }

  const msg = `Hi ${name}, I'm Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations in Yakima — they specialize in headstone cleaning and restoration. I noticed ${hook} and thought you might be interested. Let me know if you'd like to learn more!`;
  return truncateToWordLimit(msg, 100);
}

export function generateFollowUpScript(
  platform: string,
  lead: Lead,
  previousMessages: string[],
): string {
  const name = capitalize(lead.contact_name || "Friend");
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
    return `Hi ${name}, I completely understand and respect your decision. I won't reach out again about this. Wishing you and your family all the best.`;
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
      `That's great, ${name}! I'm so glad this resonated with you. Joseph and the team at Legacy Memorial Restorations are wonderful to work with. They offer headstone cleaning starting at $200–$325 and bronze restoration at $275+. They also do flower and light placements. Would it help if I connected you directly with Joseph so you can chat about ${hook}? Just let me know what works best for you!`,
      `Awesome, ${name}! Legacy Memorial Restorations offers headstone cleaning ($200–$325+), bronze restoration ($275+), and flower placements. They also have a 50% veteran discount. Want me to set up a quick chat with Joseph? He's super easy to work with.`,
    ];
    return pick(followups, seed);
  }

  if (
    lastMessage.includes("price") ||
    lastMessage.includes("cost") ||
    lastMessage.includes("how much")
  ) {
    const priceResponses = [
      `Great question, ${name}! Here's a quick breakdown: Headstone cleaning starts at $200–$325 depending on the size and condition. Bronze cleaning is $275+. They also offer flower and light placements for ongoing care. And if your loved one was a veteran, there's a 50% discount — it's Joseph's way of giving back. Want me to get you a free estimate?`,
      `Sure thing, ${name}! Headstone cleaning: $200–$325. Bronze restoration: $275+. Flower/light placements also available. Veteran? 50% off. Want a free estimate from Joseph?`,
    ];
    return pick(priceResponses, seed);
  }

  if (messageCount >= 3) {
    return `Hi ${name}, I know I've reached out a few times and I don't want to be a bother. I just wanted to leave the door open — if ${hook} is ever something you'd like to explore, I'm here. Wishing you well!`;
  }

  const genericFollowups = [
    `Hi ${name}! Just circling back on ${hook}. I know timing isn't always perfect, but I wanted to make sure you knew this was an option whenever you're ready. No rush at all — just here to help when the time is right.`,
    `Hey ${name}! Just wanted to follow up. ${capitalize(hook)} — still something you'd like to explore? I'm here whenever you're ready.`,
  ];
  return pick(genericFollowups, seed);
}

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
