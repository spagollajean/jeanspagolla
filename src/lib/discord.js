import 'server-only';

const API = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// Troca o "code" do OAuth por um access token, e retorna o usuario logado +
// o proprio access_token (precisamos dele pra adicionar a pessoa no
// servidor via addMemberToGuild -- guilds.join exige o token DELA, o bot
// token sozinho nao basta).
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
  const user = await userRes.json();
  return { ...user, _oauthAccessToken: access_token };
}

// Adiciona a pessoa DIRETO no servidor (sem link de convite público) e já
// atribui o cargo de assinante se ela tiver pagamento ativo. Precisa do
// access_token OAuth dela (escopo guilds.join) + do bot token. Chamado no
// callback de conexão -- é o único momento em que temos o token dela.
export async function addMemberToGuild(discordUserId, userAccessToken, grantRole) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${discordUserId}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: userAccessToken,
      roles: grantRole ? [ROLE_ID] : [],
    }),
  });
  // 201 = entrou agora | 204 = já era membro (token só atualizado)
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    console.error('Discord addMemberToGuild falhou:', res.status, await res.text());
  }
  return res.status;
}

// Da o cargo "Assinante" pra quem ja esta no servidor -- usado na renovacao
// (o webhook so tem o discord_user_id salvo, nao um OAuth token novo pra
// re-adicionar via addMemberToGuild).
export async function grantSubscriberRole(discordUserId) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${discordUserId}/roles/${ROLE_ID}`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error('Discord grantSubscriberRole falhou:', res.status, await res.text());
  }
  return res.status;
}

// Remove a pessoa DO SERVIDOR (nao so o cargo) -- chamado quando a
// assinatura cancela/expira de verdade. Servidor exclusivo: sem
// assinatura ativa, sem acesso nenhum ao servidor.
export async function removeMemberFromGuild(discordUserId) {
  const res = await fetch(`${API}/guilds/${GUILD_ID}/members/${discordUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error('Discord removeMemberFromGuild falhou:', res.status, await res.text());
  }
  return res.status;
}

// `state` carrega o access_token do Supabase de quem está conectando --
// é como o callback sabe pra qual conta gravar o discord_user_id (esse
// endpoint não tem sessão/cookie ambiente, só o que vier no state).
// guilds.join é o que permite adicionar a pessoa direto no servidor, sem
// convite público.
export function buildDiscordOAuthUrl(state) {
  return `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI || '')}&scope=${encodeURIComponent('identify guilds.join')}` +
    `&state=${encodeURIComponent(state)}`;
}
