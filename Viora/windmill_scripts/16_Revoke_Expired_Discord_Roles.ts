//nobundling
import { createClient } from "@supabase/supabase-js";
import * as wmill from "windmill-client";

/**
 * Windmill Script 16: Revoke Expired Discord Roles
 *
 * Backstop diario -- o acesso ao Discord ja e removido na hora pelo webhook
 * da Stripe (customer.subscription.deleted), mas isso e ESTATICO (nao
 * reavalia sozinho como o Viora faz via valid_until). Esse script varre
 * assinaturas vencidas de quem ainda esta no servidor e remove, cobrindo
 * qualquer webhook perdido/falho. Servidor exclusivo (sem convite publico):
 * remove a pessoa do servidor de verdade, nao so o cargo.
 */
export async function main() {
  const SUPABASE_URL = await wmill.getVariable("u/admin/SUPABASE_URL");
  const SUPABASE_KEY = await wmill.getVariable("u/admin/SUPABASE_SERVICE_ROLE_KEY");
  const DISCORD_BOT_TOKEN = await wmill.getVariable("u/admin/DISCORD_BOT_TOKEN");
  const DISCORD_GUILD_ID = await wmill.getVariable("u/admin/DISCORD_GUILD_ID");

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
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      { method: "DELETE", headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (res.ok || res.status === 404) revoked++;
    else console.error("Falha ao remover do servidor Discord:", discordUserId, res.status, await res.text());

    if (row.status === "active") {
      await supabase.from("subscriptions").update({ status: "canceled" }).eq("user_id", row.user_id);
    }
  }

  return { checked: expired.length, revoked };
}
