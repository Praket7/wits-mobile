/**
 * usePrefetchTodayDetail (audit: one aggregation, not six blocking fetches).
 *
 * The hook must NOT start the detail fetches synchronously during render —
 * they run after the first animation frame so Today's first viewport paints
 * from the /today aggregation alone. Fetches go through the shared
 * QueryClient's cache so subscriber hooks (useCourses etc.) later attach to
 * the prefetched entries without re-fetching.
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages, usePrefetchTodayDetail } from './useWits';
import { repository } from '@/data/mockRepository';

jest.mock('@/state/appState', () => ({
  useSession: () => ({ role: 'student', userId: 'stu-alex', selectedStudentId: 'stu-alex' }),
}));

jest.mock('@/data/mockRepository', () => ({
  repository: {
    getCourses: jest.fn().mockResolvedValue([]),
    getAssignments: jest.fn().mockResolvedValue([]),
    getCalendar: jest.fn().mockResolvedValue([]),
    getMessages: jest.fn().mockResolvedValue([]),
  },
}));

function Probe({ studentId, onReady }: { studentId: string; onReady: (started: boolean) => void }) {
  const started = usePrefetchTodayDetail(studentId);
  React.useEffect(() => {
    onReady(started);
  }, [started, onReady]);
  // Unmounting a probe must not leave pending rAF callbacks or in-flight
  // queries open — otherwise Jest warns about open handles after the run.
  React.useEffect(() => {
    return () => {
      queryClient.removeQueries();
    };
  }, []);
  return null;
}

function MessagesProbe() {
  useMessages(false);
  return null;
}

let queryClient: QueryClient;
let frames: FrameRequestCallback[];

describe('usePrefetchTodayDetail', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.mount();
    frames = [];
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    jest.clearAllMocks();
  });
  afterEach(() => {
    queryClient.unmount();
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it('defers prefetching until after the first animation frame', async () => {
    const onReady = jest.fn();
    const { unmount } = await render(
      <QueryClientProvider client={queryClient}>
        <Probe studentId="stu-alex" onReady={onReady} />
      </QueryClientProvider>,
    );

    // Synchronously after render, nothing has been fetched yet — the first
    // viewport paints from the /today aggregation alone.
    expect(repository.getCourses).not.toHaveBeenCalled();
    expect(repository.getAssignments).not.toHaveBeenCalled();
    expect(onReady).toHaveBeenCalledWith(false);

    // Flush the deferred frame explicitly so this remains timing-independent.
    await act(async () => {
      frames.splice(0).forEach((callback) => callback(0));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(repository.getCourses).toHaveBeenCalledWith('stu-alex');
      expect(repository.getAssignments).toHaveBeenCalledWith('stu-alex');
      expect(repository.getCalendar).toHaveBeenCalledWith('stu-alex');
    });
    await waitFor(() => expect(onReady).toHaveBeenCalledWith(true));
    unmount();
  });

  it('cancels the pending prefetch when unmounted before the frame fires', async () => {
    const { unmount } = await render(
      <QueryClientProvider client={queryClient}>
        <Probe studentId="stu-alex" onReady={() => {}} />
      </QueryClientProvider>,
    );
    // Unmount before the deferred frame runs: the cancelled callback must
    // never start a fetch for a screen that is already gone.
    unmount();
    expect(repository.getCourses).not.toHaveBeenCalled();
    expect(repository.getAssignments).not.toHaveBeenCalled();
    expect(repository.getCalendar).not.toHaveBeenCalled();
  });

  it('prefetches into the shared cache exactly once per student', async () => {
    const { unmount } = await render(
      <QueryClientProvider client={queryClient}>
        <Probe studentId="stu-alex" onReady={() => {}} />
      </QueryClientProvider>,
    );
    await act(async () => {
      frames.splice(0).forEach((callback) => callback(0));
      await Promise.resolve();
    });
    await waitFor(() => expect(repository.getCourses).toHaveBeenCalledTimes(1));
    // Cache entries exist with resolved data (a later useCourses would
    // attach, not refetch, within staleTime) — wait for success, not just
    // the fetch start.
    await waitFor(() =>
      expect(queryClient.getQueryState(['courses', 'stu-alex'])?.status).toBe('success'),
    );
    expect(queryClient.getQueryData(['courses', 'stu-alex'])).toEqual([]);
    unmount();
  });

  it('keeps course and message requests disabled while the unread badge is deferred', async () => {
    const { unmount } = await render(
      <QueryClientProvider client={queryClient}>
        <MessagesProbe />
      </QueryClientProvider>,
    );
    expect(repository.getCourses).not.toHaveBeenCalled();
    expect(repository.getMessages).not.toHaveBeenCalled();
    unmount();
  });
});
