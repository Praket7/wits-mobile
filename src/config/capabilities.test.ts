import {
  getCapabilities,
  setCapabilities,
  resetCapabilities,
  getCapabilitiesSource,
  DEMO_CAPABILITIES,
  PRODUCTION_CAPABILITIES,
  type Capabilities,
} from '../config/capabilities';
import { features } from '../config/features';

const MUTATING_KEYS: (keyof Capabilities)[] = [
  'messagingReply',
  'messagingCompose',
  'attendanceReporting',
  'teacherAttendanceWrite',
  'teacherAnnouncements',
  'forms',
];

describe('fail-closed capability system (audit P0)', () => {
  afterEach(() => resetCapabilities());

  it('production baseline denies every mutating capability', () => {
    resetCapabilities();
    expect(getCapabilitiesSource()).toBe('production');
    const caps = getCapabilities();
    for (const key of MUTATING_KEYS) {
      expect(caps[key]).toBe(false);
    }
  });

  it('every PRODUCTION_CAPABILITIES flag is false (fail-closed by construction)', () => {
    for (const key of Object.keys(PRODUCTION_CAPABILITIES) as (keyof Capabilities)[]) {
      expect(PRODUCTION_CAPABILITIES[key]).toBe(false);
    }
  });

  it('demo baseline unlocks the prototype writes', () => {
    setCapabilities({}, 'demo');
    expect(getCapabilitiesSource()).toBe('demo');
    const caps = getCapabilities();
    for (const key of MUTATING_KEYS) {
      expect(caps[key]).toBe(DEMO_CAPABILITIES[key]);
    }
    expect(caps.messagingReply).toBe(true);
    expect(caps.attendanceReporting).toBe(true);
    expect(caps.forms).toBe(true);
  });

  it('a server declaration merges over the fail-closed baseline, never the demo one', () => {
    setCapabilities({ messagingReply: true }, 'production');
    const caps = getCapabilities();
    expect(caps.messagingReply).toBe(true);
    // Everything the server did not declare stays denied.
    expect(caps.attendanceReporting).toBe(false);
    expect(caps.teacherAttendanceWrite).toBe(false);
    expect(caps.forms).toBe(false);
  });

  it('partial server declaration cannot accidentally inherit demo writes', () => {
    setCapabilities({}, 'demo');
    setCapabilities({ messagingReply: true }, 'production');
    expect(getCapabilities().attendanceReporting).toBe(false);
    expect(getCapabilities().messagingCompose).toBe(false);
  });

  it('resetCapabilities returns to the fail-closed production set', () => {
    setCapabilities({}, 'demo');
    resetCapabilities();
    expect(getCapabilitiesSource()).toBe('production');
    expect(getCapabilities().messagingReply).toBe(false);
    expect(getCapabilities().attendanceReporting).toBe(false);
  });
});

describe('features derive from capabilities (audit P1: one source of truth)', () => {
  afterEach(() => resetCapabilities());

  it('messagingReply reflects the capability system, not a static flag', () => {
    resetCapabilities();
    expect(features.messagingReply).toBe(false);
    setCapabilities({ messagingReply: true }, 'production');
    expect(features.messagingReply).toBe(true);
  });

  it('formsSigning follows the forms capability', () => {
    resetCapabilities();
    expect(features.formsSigning).toBe(false);
    setCapabilities({ forms: true }, 'production');
    expect(features.formsSigning).toBe(true);
  });

  it('demo mode lights up the demo-gated features', () => {
    setCapabilities({}, 'demo');
    expect(features.messagingReply).toBe(true);
    expect(features.formsSigning).toBe(true);
    expect(features.eventReminders).toBe(true);
  });
});
