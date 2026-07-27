// A EFI envia as notificações de pagamento pra URL cadastrada acrescida de
// "/pix" (padrão BACEN) — a URL registrada recebe só o teste de validação no
// cadastro do webhook. Esta sub-rota atende as notificações reais com o mesmo
// handler.
export { POST } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
