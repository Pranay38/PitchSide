import { handleSocialThread } from '@/server/endpoints/social-thread';

export async function POST(req: Request) {
  return handleSocialThread(req);
}
