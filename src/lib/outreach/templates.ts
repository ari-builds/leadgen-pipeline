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
  hook?: string;
  location?: string;
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
  const sentences = lead.notes.split(/[.!?\n]+/).filter((s) => s.trim().length > 0);

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

  if (sentences.length > 0) {
    return sentences[0].trim();
  }

  return "honoring your loved one's memory";
}

function capitalize(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function generateEmailTemplate(
  type: "initial" | "followup_1" | "followup_2",
  lead: Lead,
): EmailOutput {
  const name = capitalize(lead.contact_name);
  const hook = extractHook(lead);
  const locationRef = lead.location ? ` near ${lead.location}` : "";

  const signature = `---
Ariana, Founder & CEO
NetClicks by Ari
netclicksbyari@gmail.com`;

  switch (type) {
    case "initial": {
      const subject = `Preserving your family's memorial${locationRef ? ` in ${lead.location}` : ""}`;
      const body = `Hi ${name},

I hope this message finds you well. I'm reaching out because I came across your connection to ${hook}, and I wanted to share something that might be meaningful to you.

Legacy Memorial Restorations, based right here in Yakima, specializes in headstone cleaning and restoration. They help families bring back the beauty and dignity of memorials that have weathered over time — whether it's gentle cleaning, full restoration, or even placing fresh flowers and lights for special occasions.

I know how important it is to keep a loved one's memorial looking its best, and I thought of you because ${hook}. If this is something you've been thinking about, I'd love to connect you with Joseph and his team.

They also offer a 50% veteran discount, which is their way of honoring those who served.

No pressure at all — just wanted to make sure you knew this resource existed here in Yakima.

${signature}`;
      return { subject, body };
    }

    case "followup_1": {
      const subject = `Quick follow-up — ${hook}`;
      const body = `Hi ${name},

I just wanted to follow up on my last message. I know life gets busy, and I don't want to be a bother, but I wanted to make sure you saw this in case it's something you've been meaning to look into.

If ${hook} is still on your mind, I'm happy to answer any questions or just point you in the right direction. Joseph and the team at Legacy Memorial Restorations are easy to work with and truly care about honoring every memorial they restore.

Feel free to reply to this email anytime — I'm here to help however I can.

${signature}`;
      return { subject, body };
    }

    case "followup_2": {
      const subject = `Still thinking of you, ${name}`;
      const body = `Hi ${name},

I wanted to send one last note because I really do think this could be a wonderful thing for your family. ${capitalize(hook)} — and making sure that memorial stays beautiful for years to come — is exactly the kind of work Joseph and Legacy Memorial Restorations pour their hearts into.

If the timing isn't right, I completely understand. And if you've already taken care of things, that's wonderful too.

But if there's still a need, even a small one, please don't hesitate to reach out. Sometimes all it takes is a quick conversation to see what's possible.

Wishing you and your family well, ${name}.

${signature}`;
      return { subject, body };
    }
  }
}

export function generateDMScript(
  platform: "facebook" | "instagram" | "other",
  lead: Lead,
): string {
  const name = capitalize(lead.contact_name);
  const hook = extractHook(lead);

  if (platform === "facebook") {
    const msg = `Hi ${name}! I saw your post and wanted to reach out personally. I'm Ariana from NetClicks by Ari, and I work with Legacy Memorial Restorations here in Yakima. They specialize in headstone cleaning and restoration — helping families preserve the beauty of their loved ones' memorials. I noticed ${hook}, and I thought of you. Would you be open to a quick chat about it? No pressure at all — I just love connecting people with services that truly matter.`;
    return truncateToWordLimit(msg, 100);
  }

  if (platform === "instagram") {
    const msg = `Hey ${name}! 👋 Saw your post and wanted to reach out. I work with a local Yakima restoration team that helps families preserve and clean headstones. ${capitalize(hook)} — thought of you! Would love to connect you if you're interested. No pressure 😊`;
    return truncateToWordLimit(msg, 80);
  }

  const msg = `Hi ${name}, I'm Ariana from NetClicks by Ari. I work with Legacy Memorial Restorations in Yakima — they specialize in headstone cleaning and restoration. I noticed ${hook} and thought you might be interested. Let me know if you'd like to learn more!`;
  return truncateToWordLimit(msg, 100);
}

export function generateFollowUpScript(
  platform: string,
  lead: Lead,
  previousMessages: string[],
): string {
  const name = capitalize(lead.contact_name);
  const hook = extractHook(lead);

  const lastMessage = previousMessages[previousMessages.length - 1]?.toLowerCase() ?? "";
  const messageCount = previousMessages.length;

  if (lastMessage.includes("not interested") || lastMessage.includes("no thank") || lastMessage.includes("stop")) {
    return `Hi ${name}, I completely understand and respect your decision. I won't reach out again about this. Wishing you and your family all the best.`;
  }

  if (messageCount === 0) {
    return generateDMScript(
      platform === "instagram" ? "instagram" : "facebook",
      lead,
    );
  }

  if (lastMessage.includes("tell me more") || lastMessage.includes("interested") || lastMessage.includes("sounds like")) {
    return `That's great, ${name}! I'm so glad this resonated with you. Joseph and the team at Legacy Memorial Restorations are wonderful to work with. They offer headstone cleaning starting at $200–$325 and bronze restoration at $275+. They also do flower and light placements. Would it help if I connected you directly with Joseph so you can chat about ${hook}? Just let me know what works best for you!`;
  }

  if (lastMessage.includes("price") || lastMessage.includes("cost") || lastMessage.includes("how much")) {
    return `Great question, ${name}! Here's a quick breakdown: Headstone cleaning starts at $200–$325 depending on the size and condition. Bronze cleaning is $275+. They also offer flower and light placements for ongoing care. And if your loved one was a veteran, there's a 50% discount — it's Joseph's way of giving back. Want me to get you a free estimate?`;
  }

  if (messageCount >= 3) {
    return `Hi ${name}, I know I've reached out a few times and I don't want to be a bother. I just wanted to leave the door open — if ${hook} is ever something you'd like to explore, I'm here. Wishing you well!`;
  }

  return `Hi ${name}! Just circling back on ${hook}. I know timing isn't always perfect, but I wanted to make sure you knew this was an option whenever you're ready. No rush at all — just here to help when the time is right.`;
}

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
