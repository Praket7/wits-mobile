# Accessibility Checklist

Every new screen and PR touching UI must satisfy all of these (plan §12,
item 165). Static CI checks cannot replace device testing — do a VoiceOver and
TalkBack spot check before merging anything user-facing.

- [ ] Every interactive target is ≥ 44×44 pt (use `Pressable`, never `Text onPress`)
- [ ] Icon-only controls have explicit `accessibilityLabel`s
- [ ] Controls have `accessibilityRole` ("button", "checkbox", "link"…)
- [ ] Toggle/selection state uses `accessibilityState` (`selected`, `checked`)
- [ ] Status is never communicated by color alone (pills carry text)
- [ ] Reading/focus order matches visual order
- [ ] System font scaling on; test at 200% Dynamic Type — no clipping, cards grow vertically
- [ ] No fixed-height text containers
- [ ] Text contrast meets WCAG AA (gold is decorative; no small gold-on-white text — item 37)
- [ ] Touch feedback via `pressed` styles, not animation
- [ ] Reduce Motion respected (no essential animation)
- [ ] Empty, loading, and error states are announced and reachable
