"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface OutreachEmail {
  id: number;
  lead_id: number;
  client_id: number | null;
  template_type: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  company_name: string | null;
  client_name: string | null;
  score: number | null;
  notes: string | null;
}

interface OutreachThread {
  id: number;
  lead_id: number;
  client_id: number | null;
  platform: string;
  status: string;
  created_at: string;
  last_message_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  company_name: string | null;
  client_name: string | null;
  last_message: string | null;
  message_count: number;
  score: number | null;
  notes: string | null;
}

interface OutreachMessage {
  id: number;
  thread_id: number;
  direction: string;
  platform: string | null;
  content: string;
  is_ai_generated: number;
  sent_at: string;
}

const emailStatusColors: Record<string, string> = {
  draft: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
  delivered: "bg-green-100 text-green-800",
  opened: "bg-purple-100 text-purple-800",
  bounced: "bg-red-100 text-red-800",
  replied: "bg-emerald-100 text-emerald-800",
};

const threadStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-800",
};

type Tab = "emails" | "dms" | "conversations";

function extractHook(notes: string | null): string {
  if (!notes) return "";
  const match = notes.match(/Hook:\s*(.+?)(?:\n|$)/i);
  return match ? match[1].trim() : "";
}

function ScoreBadge({ score, notes }: { score: number | null; notes: string | null }) {
  const s = score || 0;
  const hook = extractHook(notes);
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
        s >= 9 ? "bg-red-100 text-red-800" :
        s >= 7 ? "bg-orange-100 text-orange-800" :
        s >= 5 ? "bg-yellow-100 text-yellow-800" :
        "bg-gray-100 text-gray-800"
      }`}>
        {s}
      </span>
      {hook && <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={hook}>{hook}</span>}
    </div>
  );
}

export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState<Tab>("emails");
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [threads, setThreads] = useState<OutreachThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingDrafts, setSendingDrafts] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState<OutreachEmail | null>(null);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<OutreachMessage[]>([]);
  const [logReplyThread, setLogReplyThread] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedConversation, setExpandedConversation] = useState<number | null>(null);
  const [conversationMessages, setConversationMessages] = useState<OutreachMessage[]>([]);
  const [followUpLeadId, setFollowUpLeadId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [emailRes, threadRes] = await Promise.all([
        fetch("/api/outreach"),
        fetch("/api/outreach/threads"),
      ]);
      setEmails(await emailRes.json());
      setThreads(await threadRes.json());
    } catch {
      toast.error("Failed to load outreach data");
    } finally {
      setLoading(false);
    }
  }

  async function generateAllEmails() {
    const leadIds = Array.from(new Set(emails.map((e) => e.lead_id)));
    if (leadIds.length === 0) {
      toast.info("No leads with outreach emails to regenerate");
      return;
    }
    setGenerating(true);
    try {
      let count = 0;
      for (const leadId of leadIds) {
        const res = await fetch("/api/outreach/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadId, type: "email_initial" }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetch("/api/outreach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lead_id: leadId,
              subject: data.subject,
              body: data.body,
              template_type: "email_initial",
            }),
          });
          count++;
        }
      }
      toast.success(`Generated ${count} email(s)`);
      fetchData();
    } catch {
      toast.error("Failed to generate emails");
    } finally {
      setGenerating(false);
    }
  }

  async function sendAllDrafts() {
    const drafts = emails.filter((e) => e.status === "draft");
    if (drafts.length === 0) {
      toast.info("No drafts to send");
      return;
    }
    setSendingDrafts(true);
    let sent = 0;
    let failed = 0;
    for (const draft of drafts) {
      try {
        const res = await fetch("/api/outreach/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outreach_email_id: draft.id }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSendingDrafts(false);
    if (failed > 0) {
      toast.error(`Sent ${sent}, failed ${failed}`);
    } else {
      toast.success(`Sent ${sent} email(s)`);
    }
    fetchData();
  }

  async function generateDMScripts(platform: "facebook" | "instagram") {
    const leadIds = Array.from(new Set(threads.filter((t) => t.platform === platform).map((t) => t.lead_id)));
    if (leadIds.length === 0) {
      toast.info(`No threads for ${platform} to generate scripts for`);
      return;
    }
    setGenerating(true);
    let count = 0;
    for (const leadId of leadIds) {
      try {
        const res = await fetch("/api/outreach/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadId,
            type: platform === "facebook" ? "dm_facebook" : "dm_instagram",
          }),
        });
        if (res.ok) count++;
      } catch {
        // continue
      }
    }
    setGenerating(false);
    toast.success(`Generated ${count} ${platform} script(s)`);
    fetchData();
  }

  async function viewThreadMessages(threadId: number) {
    if (selectedThread === threadId) {
      setSelectedThread(null);
      setThreadMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/outreach/threads/${threadId}/messages`);
      const msgs = await res.json();
      setSelectedThread(threadId);
      setThreadMessages(msgs);
    } catch {
      toast.error("Failed to load messages");
    }
  }

  async function logReply(thread: OutreachThread) {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    try {
      await fetch(`/api/outreach/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "inbound",
          platform: thread.platform,
          content: replyContent.trim(),
          is_ai_generated: false,
        }),
      });
      toast.success("Reply logged");
      setLogReplyThread(null);
      setReplyContent("");
      fetchData();
      if (selectedThread === thread.id) {
        viewThreadMessages(thread.id);
      }
    } catch {
      toast.error("Failed to log reply");
    }
  }

  async function expandConversation(thread: OutreachThread) {
    if (expandedConversation === thread.id) {
      setExpandedConversation(null);
      setConversationMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/outreach/threads/${thread.id}/messages`);
      const msgs = await res.json();
      setExpandedConversation(thread.id);
      setConversationMessages(msgs);
    } catch {
      toast.error("Failed to load conversation");
    }
  }

  async function generateFollowUp(leadId: number) {
    setFollowUpLeadId(leadId);
    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, type: "followup_script" }),
      });
      if (res.ok) {
        toast.success("Follow-up script generated");
        fetchData();
      } else {
        toast.error("Failed to generate follow-up");
      }
    } catch {
      toast.error("Failed to generate follow-up");
    } finally {
      setFollowUpLeadId(null);
    }
  }

  const totalEmails = emails.length;
  const sentCount = emails.filter((e) => e.status === "sent").length;
  const draftCount = emails.filter((e) => e.status === "draft").length;
  const activeThreads = threads.filter((t) => t.status === "active").length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "emails", label: "Email Campaigns" },
    { key: "dms", label: "DM Scripts" },
    { key: "conversations", label: "Conversations" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading outreach...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Outreach</h1>
        <p className="text-muted-foreground mt-1">
          Manage email campaigns and DM conversations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Outreach</CardDescription>
            <CardTitle className="text-3xl">{totalEmails}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-3xl">{sentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-3xl">{draftCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Threads</CardDescription>
            <CardTitle className="text-3xl">{activeThreads}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-muted-foreground hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Email Campaigns Tab */}
      {activeTab === "emails" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={generateAllEmails} disabled={generating}>
              {generating ? "Generating..." : "Generate All"}
            </Button>
            <Button
              variant="secondary"
              onClick={sendAllDrafts}
              disabled={sendingDrafts}
            >
              {sendingDrafts ? "Sending..." : "Send Drafts"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {emails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No outreach emails yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">
                          {email.contact_name || "—"}
                        </TableCell>
                        <TableCell>
                          <ScoreBadge score={email.score} notes={email.notes} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {email.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              emailStatusColors[email.status] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {email.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(email.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setSelectedEmail(
                                selectedEmail?.id === email.id ? null : email
                              )
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {selectedEmail && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedEmail.subject}
                    </CardTitle>
                    <CardDescription>
                      To: {selectedEmail.contact_name} &lt;
                      {selectedEmail.contact_email}&gt; | Status:{" "}
                      {selectedEmail.status}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmail(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                  {selectedEmail.body}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* DM Scripts Tab */}
      {activeTab === "dms" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => generateDMScripts("facebook")}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Facebook Scripts"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => generateDMScripts("instagram")}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Instagram Scripts"}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {threads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No DM threads yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threads.map((thread) => (
                      <TableRow key={thread.id}>
                        <TableCell className="font-medium">
                          {thread.contact_name || "—"}
                        </TableCell>
                        <TableCell>
                          <ScoreBadge score={thread.score} notes={thread.notes} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{thread.platform}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              threadStatusColors[thread.status] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {thread.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {thread.last_message || "No messages yet"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewThreadMessages(thread.id)}
                            >
                              View Script
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setLogReplyThread(
                                  logReplyThread === thread.id
                                    ? null
                                    : thread.id
                                )
                              }
                            >
                              Log Reply
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {selectedThread && threadMessages.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Thread Messages</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedThread(null);
                      setThreadMessages([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {threadMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.direction === "outbound"
                        ? "bg-blue-50 border border-blue-200 ml-8"
                        : "bg-gray-50 border border-gray-200 mr-8"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          msg.direction === "outbound" ? "default" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {msg.direction === "outbound" ? "Sent" : "Received"}
                      </Badge>
                      {msg.is_ai_generated ? (
                        <span className="text-[10px] text-muted-foreground">
                          AI Generated
                        </span>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(msg.sent_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {logReplyThread && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Log Reply</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogReplyThread(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="What did the lead say back?"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button
                  onClick={() => {
                    const thread = threads.find(
                      (t) => t.id === logReplyThread
                    );
                    if (thread) logReply(thread);
                  }}
                >
                  Save Reply
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === "conversations" && (
        <div className="space-y-4">
          {threads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            threads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => expandConversation(thread)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">
                          {thread.contact_name || "Unknown"}
                          {thread.company_name && (
                            <span className="text-muted-foreground text-sm ml-1">
                              ({thread.company_name})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {thread.platform}
                          </Badge>
                          <Badge
                            className={`text-[10px] ${
                              threadStatusColors[thread.status] || ""
                            }`}
                          >
                            {thread.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {thread.message_count} message
                            {thread.message_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {thread.last_message && (
                        <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {thread.last_message}
                        </p>
                      )}
                      {thread.last_message_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            thread.last_message_at
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {expandedConversation === thread.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {conversationMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No messages in this conversation yet
                        </p>
                      ) : (
                        conversationMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg text-sm ${
                              msg.direction === "outbound"
                                ? "bg-blue-50 border border-blue-200 ml-8"
                                : "bg-gray-50 border border-gray-200 mr-8"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  msg.direction === "outbound"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {msg.direction === "outbound"
                                  ? "Sent"
                                  : "Received"}
                              </Badge>
                              {msg.is_ai_generated ? (
                                <span className="text-[10px] text-muted-foreground">
                                  AI
                                </span>
                              ) : null}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {new Date(msg.sent_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={followUpLeadId === thread.lead_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          generateFollowUp(thread.lead_id);
                        }}
                      >
                        {followUpLeadId === thread.lead_id
                          ? "Generating..."
                          : "Generate Follow-up Script"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
