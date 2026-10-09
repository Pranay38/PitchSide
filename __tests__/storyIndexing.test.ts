import React from 'react';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import StoryRoute, { generateMetadata } from '../app/stories/[slug]/page';

const state = vi.hoisted(() => ({ getStory: vi.fn() }));
vi.stubGlobal('React', React);
vi.mock('@/lib/server-data', () => ({ getStoryBySlugServer: state.getStory }));
vi.mock('@/app/pages/StoryPage', () => ({ StoryPage: () => null }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_NOT_FOUND'); } }));
const props = (preview = false) => ({
  params: Promise.resolve({ slug: 'calciopoli-the-game-behind-the-game' }),
  searchParams: Promise.resolve(preview ? { preview: '1' } : {}),
});
beforeEach(() => { state.getStory.mockReset(); });
afterAll(() => vi.unstubAllGlobals());

describe('story indexing route', () => {
  it('supplies the published article to the initial render', async () => {
    const story = { title: 'Calciopoli', slug: 'calciopoli-the-game-behind-the-game', chapters: [{ body: ['Published chapter'] }] };
    state.getStory.mockResolvedValue(story);
    const page = await StoryRoute(props());
    expect(page.props.initialStory).toEqual(story);
    expect((await generateMetadata(props())).alternates?.canonical).toBe('https://www.thetouchlinedribble.in/stories/calciopoli-the-game-behind-the-game');
  });
  it('returns a real not-found response for missing public stories', async () => {
    state.getStory.mockResolvedValue(null);
    await expect(StoryRoute(props())).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateMetadata(props())).rejects.toThrow('NEXT_NOT_FOUND');
  });
  it('keeps unpublished browser previews available and non-indexable', async () => {
    state.getStory.mockResolvedValue(null);
    await expect(StoryRoute(props(true))).resolves.toBeTruthy();
    expect((await generateMetadata(props(true))).robots).toEqual({ index: false, follow: false });
    expect(state.getStory).toHaveBeenCalledWith('calciopoli-the-game-behind-the-game');
  });
  it('does not turn a database failure into a missing story', async () => {
    state.getStory.mockRejectedValue(new Error('Database unavailable'));
    await expect(StoryRoute(props())).rejects.toThrow('Database unavailable');
  });
});
