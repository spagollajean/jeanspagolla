// Normalização de telefone pro formato canônico salvo em profiles.phone.
//
// BR:            "55" + DDD (2 dígitos) + celular com 9º dígito = 13 dígitos.
// Internacional: só os dígitos, como veio (DDI 44, 1, etc.).
//
// Por que existe: o bot do WhatsApp identifica o usuário pelo telefone, e o
// wa_id da Meta chega SEM o 9º dígito pra números BR antigos. Sem formato
// canônico, o mesmo número vira duas contas (ex.: usuário digita
// 5541984317383 no checkout, mas o WhatsApp manda 554184317383).
//
// Espelhada em SQL como public.normalize_phone_br (trigger em profiles) e no
// Windmill em lib_whatsapp.ts (normalizePhoneBR) — mudou aqui, muda lá.
export function normalizePhone(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');

  // Celular BR antigo tem 8 dígitos começando em 6-9; o 9º dígito é prefixado.
  // Fixo (2-5) fica como está — não existe 9º dígito pra fixo.
  const withNinthDigit = (ddd: string, rest: string) =>
    rest.length === 8 && /^[6-9]/.test(rest) ? `55${ddd}9${rest}` : `55${ddd}${rest}`;

  // Já veio com DDI 55: 12 dígitos = falta o 9º, 13 = completo
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    return withNinthDigit(d.slice(2, 4), d.slice(4));
  }
  // 11 dígitos com 9 na 3ª posição = DDD + celular sem DDI (ex.: 41991945937)
  if (d.length === 11 && d[2] === '9') return `55${d}`;
  // 10 dígitos = DDD + número antigo sem DDI
  if (d.length === 10) return withNinthDigit(d.slice(0, 2), d.slice(2));

  // Qualquer outro formato (internacional etc.): não arriscar palpite
  return d;
}
