/**
 * HttpWitsRepository behavior tests (audit P0): one hardened request path,
 * no automatic retry of mutations, bearer auth seam, and error hygiene —
 * internal paths/IDs never appear in user-facing error messages.
 *
 * EXPO_PUBLIC_API_BASE_URL is seeded in src/test/setup.ts (the module reads
 * it at import time) and a mocked global fetch intercepts every request.
 */
import {
  HttpWitsRepository,
  setAuthTokenProvider,
  fetchServerCapabilities,
} from './httpRepository';
import { AppError } from '@/utils/errors';

const BASE = 'https://api.test.example';

const fetchMock = jest.fn();
(globalThis as { fetch: unknown }).fetch = fetchMock;

const ok = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const fail = (status: number) =>
  ({
    ok: false,
    status,
    text: async () => 'internal detail',
    json: async () => ({}),
  }) as unknown as Response;

// Minimal valid user payload for the schema boundary.
const USER = {
  id: 'stu-alex',
  name: 'Alex Williams',
  role: 'student',
  initials: 'AW',
  school: 'Williamsville East High School',
};

beforeEach(() => {
  fetchMock.mockReset();
});

describe('HttpWitsRepository (audit-hardened request path)', () => {
  it('sends bearer token when an auth provider is registered', async () => {
    fetchMock.mockResolvedValueOnce(ok(USER));
    setAuthTokenProvider(() => 'token-123');
    const repo = new HttpWitsRepository();
    await repo.getMe('student');
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer token-123');
    expect(headers['X-Correlation-ID']).toBeTruthy();
    setAuthTokenProvider(() => null);
  });

  it('derives role server-side: /me never carries a role parameter', async () => {
    fetchMock.mockResolvedValueOnce(ok(USER));
    const repo = new HttpWitsRepository();
    await repo.getMe('teacher'); // ignored on purpose
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe(`${BASE}/v1/me`);
    expect(url).not.toContain('role=');
  });

  it('reads students from the authorized /me/students relationship endpoint', async () => {
    fetchMock.mockResolvedValueOnce(ok([]));
    const repo = new HttpWitsRepository();
    await repo.getStudents();
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/v1/me/students`);
  });

  it('never retries a POST mutation (no duplicate writes)', async () => {
    fetchMock.mockResolvedValue(fail(500));
    const repo = new HttpWitsRepository();
    await expect(repo.sendMessage('t1', 'hello', { senderId: 'u', senderName: 'U' })).rejects.toThrow(
      AppError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never retries a POST when the response is lost (server error)', async () => {
    fetchMock.mockResolvedValue(fail(503));
    const repo = new HttpWitsRepository();
    await expect(
      repo.signForm('form-1'),
    ).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a GET once on a transient 5xx', async () => {
    fetchMock
      .mockResolvedValueOnce(fail(503))
      .mockResolvedValueOnce(ok({ id: 'e1', title: 'Event', start: '2026-09-18T13:00:00', end: null, allDay: false, location: null, category: 'school', source: 'school', audience: 'all', sourceLabel: 'School' }));
    const repo = new HttpWitsRepository();
    const event = await repo.getEvent('e1');
    expect(event?.id).toBe('e1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry GETs that fail authorization', async () => {
    fetchMock.mockResolvedValue(fail(403));
    const repo = new HttpWitsRepository();
    await expect(repo.getStudents()).rejects.toBeInstanceOf(AppError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('user-facing errors never contain the request path', async () => {
    fetchMock.mockResolvedValue(fail(404));
    const repo = new HttpWitsRepository();
    try {
      await repo.getAssignment('secret-student-id-42');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as Error).message).not.toContain('/v1/');
      expect((e as Error).message).not.toContain('secret-student-id-42');
    }
  });

  it('routes replies through the OpenAPI threads path', async () => {
    fetchMock.mockResolvedValueOnce(ok({ ok: true }));
    const repo = new HttpWitsRepository();
    await repo.sendMessage('thread-9', 'hi', { senderId: 'u', senderName: 'U' });
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/v1/messages/threads/thread-9/reply`);
  });

  it('monthly attendance lives under /students/{id}/attendance/monthly', async () => {
    fetchMock.mockResolvedValueOnce(ok({}));
    const repo = new HttpWitsRepository();
    await repo.getMonthlyAttendance({ studentId: 'stu-alex', year: 2026, month: 9 });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `${BASE}/v1/students/stu-alex/attendance/monthly`,
    );
  });

  it('fetchServerCapabilities returns the server declaration', async () => {
    fetchMock.mockResolvedValueOnce(
      ok({ messagingReply: true, attendanceReporting: false }),
    );
    const caps = await fetchServerCapabilities();
    expect(caps.messagingReply).toBe(true);
    expect(caps.attendanceReporting).toBe(false);
  });
});
