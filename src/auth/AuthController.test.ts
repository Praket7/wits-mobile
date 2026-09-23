import { authController } from './AuthController';
import { getCapabilities, getCapabilitiesSource, resetCapabilities } from '@/config/capabilities';

/**
 * AuthController lifecycle (security pass): the boot sequence — sign in →
 * GET /me (identity) → authenticated GET /capabilities — must leave the app
 * in a coherent state, and sign-out must reset capabilities fail-closed.
 */
describe('AuthController (demo provider)', () => {
  afterEach(() => resetCapabilities());

  it('signs in through the demo provider and derives identity from /me', async () => {
    await authController.signIn();
    const state = authController.getState();
    expect(state.status).toBe('signed-in');
    if (state.status === 'signed-in') {
      // Role comes from the repository's session actor — no client-chosen role.
      expect(state.user.role).toBe('student');
      expect(state.user.id).toBe('stu-alex');
    }
  });

  it('applies the demo capability baseline on sign-in (prototype writes)', async () => {
    await authController.signIn();
    expect(getCapabilitiesSource()).toBe('demo');
    expect(getCapabilities().messagingReply).toBe(true);
    expect(getCapabilities().attendanceReporting).toBe(true);
  });

  it('sign-out resets capabilities fail-closed and clears auth state', async () => {
    await authController.signIn();
    expect(getCapabilitiesSource()).toBe('demo');
    await authController.signOut();
    expect(getCapabilitiesSource()).toBe('production');
    expect(getCapabilities().messagingReply).toBe(false);
    expect(authController.getState().status).toBe('signed-out');
  });
});
