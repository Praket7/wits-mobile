// Per-entity query hooks (plan §8). Canonical implementations live in useWits.ts;
// these files re-export them so screens can import from a single-purpose module.
export {
  useToday,
  keys as queryKeys,
} from './useWits';
