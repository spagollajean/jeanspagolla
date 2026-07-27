import EfiPay from 'sdk-node-apis-efi';

const sandbox = process.env.EFI_SANDBOX !== 'false';

export const efi = new EfiPay({
  sandbox,
  client_id: process.env.EFI_CLIENT_ID!,
  client_secret: process.env.EFI_CLIENT_SECRET!,
  certificate: process.env.EFI_CERT_BASE64!,
  cert_base64: true,
});

export const EFI_PIX_KEY = process.env.EFI_PIX_KEY!;
