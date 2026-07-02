import { supabase } from "../lib/supabaseClient";

export async function listMyNotifications(limit = 30) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw error;
}

export async function createNotification({ agent_id, title, message, link }) {
  const { error } = await supabase.from("notifications").insert({ agent_id, title, message: message ?? null, link: link ?? null });
  if (error) throw error;
}

// Brique "Emails automatiques" (comm_emails) : relais d'un événement vers
// un e-mail transactionnel, pour les agents non connectés à l'instant T.
export async function sendNotificationEmail({ to, subject, text }) {
  const { data, error } = await supabase.functions.invoke("send-notification-email", { body: { to, subject, text } });
  if (error || data?.error) throw new Error(data?.error || error.message);
}
