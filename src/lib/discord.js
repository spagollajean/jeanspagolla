import 'server-only';

const API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Troca o "code" do OAuth por um access token, e retorna o usuario logado
// (so precisamos do ID -- e o que a gente grava em profiles.discord_user_id).
export async function exchangeCodeForDiscordUser(code) {
  const tokenRes = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Discord token exchange falhou: ${await tokenRes.text()}`);
  }
  const { access_token } = await tokenRes.json();

  const userRes = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Discord /users/@me falhou: ${await userRes.text()}`);
  }
  return userRes.json();
}

// Da o cargo "Assinante" -- chamado quando o pagamento e aprovado (webhook)
// ou quando a pessoa conecta o Discord depois de ja ter pago.
export async function grantSubscriberRole(discordUserId) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${ROLE_ID}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  // 404 = pessoa nao entrou no servidor ainda (precisa entrar pelo convite
  // antes do bot conseguir dar o cargo) -- nao trata como erro fatal.
  if (!res.ok && res.status !== 404) {
    console.error('Discord grantSubscriberRole falhou:', res.status, await res.text());
  }
  return res.status;
}

// Tira o cargo -- chamado quando a assinatura cancela/expira.
export async function revokeSubscriberRole(discordUserId) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${ROLE_ID}`, {
    method: 'DELETE',
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error('Discord revokeSubscriberRole falhou:', res.status, await res.text());
  }
  return res.status;
}

// `state` carrega o access_token do Supabase de quem está conectando --
// é como o callback sabe pra qual conta gravar o discord_user_id (esse
// endpoint não tem sessão/cookie ambiente, só o que vier no state).
export function buildDiscordOAuthUrl(state) {
  return `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI || '')}&scope=identify` +
    `&state=${encodeURIComponent(state)}`;
}
