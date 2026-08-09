//nobundling
import { createClient } from "@supabase/supabase-js";
import * as wmill from "windmill-client";

/**
 * Windmill Script 16: Revoke Expired Discord Roles
 *
 * Backstop diario -- o cargo do Discord ja e revogado na hora pelo webhook
 * da Stripe (customer.subscription.deleted), mas o cargo e ESTATICO (nao
 * reavalia sozinho como o Viora faz via valid_until). Esse script varre
 * assinaturas vencidas que ainda tem o cargo e tira, cobrindo qualquer
 * webhook perdido/falho.
 */
export async function main() {
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL");
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY");
  const DISCORD_BOT_TOKEN = await wmill.getVariable("u/admin/DISCORD_BOT_TOKEN");
  const DISCORD_GUILD_ID = await wmill.getVariable("u/admin/DISCORD_GUILD_ID");
  const DISCORD_ROLE_ID = await wmill.getVariable("u/admin/DISCORD_SUBSCRIBER_ROLE_ID");

  const supabase = createClient(SUPABASE_URL as string, SUPABASE_KEY as string);

  const { data: expired, error } = await supabase
    .from("subscriptions")
    .select("user_id, valid_until, status, profiles!inner(discord_user_id)")
    .lt("valid_until", new Date().toISOString())
    .not("profiles.discord_user_id", "is", null);

  if (error) {
    throw new Error(`Erro ao buscar assinaturas vencidas: ${error.message}`);
  }
  if (!expired || expired.length === 0) {
    return { checked: 0, revoked: 0 };
  }

  let revoked = 0;
  for (const row of expired) {
    const discordUserId = (row as any).profiles?.discord_user_id;
    if (!discordUserId) continue;

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_ROLE_ID}`,
      { method: "DELETE", headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (res.ok || res.status === 404) revoked++;
    else console.error("Falha ao revogar cargo Discord:", discordUserId, res.status, await res.text());

    if (row.status === "active") {
      await supabase.from("subscriptions").update({ status: "canceled" }).eq("user_id", row.user_id);
    }
  }

  return { checked: expired.length, revoked };
}
