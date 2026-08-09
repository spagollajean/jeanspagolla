/**
 * Windmill Script 1: Extract Payload
 *
 * Primeiro passo do Flow. Pega o payload que a Evolution API manda no
 * webhook (evento MESSAGES_UPSERT) e extrai só o suco -- mesmo formato de
 * saida de antes (quando era Meta Cloud API), pra nao precisar mexer no
 * resto do Flow nem nos scripts seguintes.
 *
 * Como o menu virou texto numerado (Evolution/WhatsApp pessoal nao suporta
 * bem os botoes/listas da Meta Business API), esse script tambem converte
 * respostas tipo "1", "2", "3" em `interactive_id` -- o significado de cada
 * numero e resolvido pelo 4_Send_Interactive_Menu.ts, que guarda o contexto
 * do ultimo menu mandado em whatsapp_sessions.temp_data.
 *
 * CONFIGURAÇÃO NO WINDMILL:
 * - Flow com trigger Webhook (Background execution ativada).
 * - Este script como primeiro passo.
 * - Input: `payload` (tipo `object`) = flow_input inteiro (o corpo cru que a
 *   Evolution manda pro webhook do Flow).
 */

export async function main(payload: any) {
  // A Evolution manda varios tipos de evento no mesmo webhook -- só interessa
  // mensagem nova.
  if (payload?.event !== "messages.upsert") {
    return { is_valid_message: false, reason: "Not a messages.upsert event" };
  }

  const data = payload.data;
  const key = data?.key;

  // Mensagens que o proprio bot mandou tambem passam pelo webhook (eco) -- ignora.
  if (!key || key.fromMe) {
    return { is_valid_message: false, reason: "fromMe or missing key" };
  }

  const message = data.message || {};
  const messageType = data.messageType || Object.keys(message)[0] || "";

  const is_image = messageType === "imageMessage" || !!message.imageMessage;

  let text_message = "";
  if (typeof message.conversation === "string") {
    text_message = message.conversation;
  } else if (message.extendedTextMessage?.text) {
    text_message = message.extendedTextMessage.text;
  } else if (is_image && message.imageMessage?.caption) {
    text_message = message.imageMessage.caption;
  }

  const remote_jid = key.remoteJid as string;
  const message_id = key.id as string;
  // media_id aqui e o proprio message_id -- a Evolution nao tem um ID de
  // midia separado como a Meta tinha, busca a midia pela key da mensagem.
  const media_id = is_image ? message_id : null;

  // Cliques do menu antigo (botao/lista Meta) nao existem mais -- respostas
  // numericas (1, 2, 3...) sao convertidas pro mesmo `interactive_id` que o
  // resto do fluxo ja espera receber. O 4_Send_Interactive_Menu.ts decide o
  // significado de cada numero pelo contexto (menu principal vs "mais opções"
  // vs pergunta de meta), entao aqui so repassa o numero cru quando for texto
  // curto e puramente numerico -- quem resolve o significado é o proprio
  // script do menu, olhando pro numero.
  let interactive_id = "";
  const trimmed = text_message.trim();
  if (/^[1-9]$/.test(trimmed)) {
    interactive_id = `menu_option_${trimmed}`;
  }

  const sender_number = remote_jid.replace(/\D/g, "").replace(/@.*/, "");

  console.log(`[EXTRACT] sender=${sender_number}, isImage=${is_image}, text="${text_message}", id="${interactive_id}"`);

  return {
    is_valid_message: true,
    remote_jid,
    sender_number,
    message_id,
    media_id,
    text_message,
    interactive_id,
    is_image
  };
}
