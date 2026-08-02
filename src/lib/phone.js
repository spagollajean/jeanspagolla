// Normalização de telefone pro formato canônico salvo em profiles.phone.
//
// BR:            "55" + DDD (2 dígitos) + celular com 9º dígito = 13 dígitos.
// Internacional: só os dígitos, como veio (DDI 44, 1, etc.).
//
// Por que existe: o bot do WhatsApp (Viora) identifica o usuário pelo
// telefone, e o wa_id da Meta chega SEM o 9º dígito pra números BR antigos.
// Sem formato canônico, o mesmo número vira duas contas.
//
// Espelhada em SQL como public.normalize_phone_br (trigger em profiles) e no
// Windmill em lib_whatsapp.ts (normalizePhoneBR) — mudou aqui, muda lá.
export function normalizePhone(raw) {
  const d = (raw || '').replace(/\D/g, '');

  const withNinthDigit = (ddd, rest) =>
    rest.length === 8 && /^[6-9]/.test(rest) ? `55${ddd}9${rest}` : `55${ddd}${rest}`;

  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    return withNinthDigit(d.slice(2, 4), d.slice(4));
  }
  if (d.length === 11 && d[2] === '9') return `55${d}`;
  if (d.length === 10) return withNinthDigit(d.slice(0, 2), d.slice(2));

  return d;
}
