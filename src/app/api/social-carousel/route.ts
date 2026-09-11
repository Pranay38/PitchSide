import { handleSocialCarousel } from '@/server/endpoints/social-carousel';

export async function POST(req: Request) {
  return handleSocialCarousel(req);
}
