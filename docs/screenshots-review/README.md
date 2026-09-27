# Browser review screenshots

Captured September 23, 2026 from the exported Expo web build at 390×844 CSS pixels with device scale factor 2. All records shown are synthetic fixtures. Each `fp-` image is a full-page capture of one route.

Start with [student Today](fp-02-today.png), [Academics](fp-03-academics.png), [Calendar](fp-04-calendar.png), [Attendance](fp-10-attendance.png), [Parent Today](fp-17-parent-today.png), and [Teacher Today](fp-20-teacher-today.png). The remaining images cover login, student detail screens, parent routes, teacher routes, and compose flows.

Visual review found the responsive desktop login was previously too wide; it is now centered and capped at 480 px. The main app content is capped at 760 px on wide screens. Resource tiles use a stable two-column grid on narrow screens; the student attendance summary separates the attendance rate from its three metrics; course segmented tabs use a compact label; and the Today schedule reserves less width for time labels so course names remain clear. Student Today remains a scrollable page because it includes several role-relevant sections; its schedule is limited to a three-item glance plus a full-calendar link.

The tab bars use Expo's native `expo-blur` surface on iOS and Android; Android SDK 31+ uses the native blur implementation, with a translucent fallback on older versions. The browser captures verify the web fallback only. They do not verify native iOS/Android rendering, screen readers, safe-area behavior, or physical-device interaction. See [Expo BlurView documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/) for platform behavior.
