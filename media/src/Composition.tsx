import { AbsoluteFill, Composition, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const fps = 30;
const scenes = [
  { from: 0, duration: 135, role: 'Student view', image: 'screens/student-today.png', line: 'See what is next today.' },
  { from: 135, duration: 135, role: 'Parent view', image: 'screens/parent-today.png', line: 'Keep up with each child.' },
  { from: 270, duration: 135, role: 'Teacher view', image: 'screens/teacher-today.png', line: 'See the day across your classes.' },
];

export const MyComposition = () => (
  <Composition id="WitsMobileTour" component={Tour} durationInFrames={570} fps={fps} width={1920} height={1080} />
);

function Tour() {
  const frame = useCurrentFrame();
  const activeScene = scenes.find((scene) => frame >= scene.from && frame < scene.from + scene.duration);
  const isStats = frame >= 405;
  const sceneFrame = activeScene ? frame - activeScene.from : frame - 405;
  const displayScene = activeScene ?? scenes[2];
  const enter = interpolate(sceneFrame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(155deg, #fbf8f5 0%, #f3ece8 100%)', color: '#20242a', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ position: 'absolute', top: 42, left: 90, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: '#c8102e', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 28 }}>W</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 0.2 }}>WITS Mobile</div>
      </div>
      <div style={{ position: 'absolute', top: 218, left: 785, right: 95, textAlign: 'left', fontSize: isStats ? 60 : 58, lineHeight: 1.08, fontWeight: 750, opacity: enter }}>
        {isStats ? 'Prototype check results' : displayScene.line}
      </div>
      <div style={{ position: 'absolute', top: 106, left: 110, width: 565, height: 910, borderRadius: 64, background: '#17191d', padding: 24, boxShadow: '0 28px 76px rgba(35,25,20,.2)', opacity: enter, scale: interpolate(sceneFrame, [0, 22], [0.96, 1], { extrapolateRight: 'clamp' }) }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden', background: '#fff' }}>
          <Img src={staticFile(displayScene.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
      </div>
      {isStats ? <Stats opacity={enter} /> : null}
      <div style={{ position: 'absolute', top: 330, left: 790, right: 90, color: '#7b6664', fontSize: 34, fontWeight: 650, opacity: enter }}>
        {activeScene?.role ?? 'Development checks, not school usage'}
      </div>
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', color: '#806f70', fontSize: 18, letterSpacing: 0.4 }}>
        Synthetic sample data only  ·  Not connected to WCSD systems
      </div>
    </AbsoluteFill>
  );
}

function Stats({ opacity }: { opacity: number }) {
  const stats = [
    ['166', 'automated tests passed'],
    ['36', 'API paths in the draft contract'],
    ['31', 'data shapes checked against the app'],
    ['21 of 21', 'Expo project checks passed'],
  ];
  return (
    <div style={{ position: 'absolute', top: 425, left: 790, right: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, opacity }}>
      {stats.map(([value, label]) => (
        <div key={label} style={{ minHeight: 200, borderRadius: 26, padding: 24, background: 'rgba(255,255,255,.88)', border: '1px solid rgba(200,16,46,.12)', boxShadow: '0 16px 42px rgba(60,40,38,.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#c8102e', fontSize: 62, lineHeight: 1, fontWeight: 800 }}>{value}</div>
          <div style={{ marginTop: 18, fontSize: 23, lineHeight: 1.22, color: '#47474c' }}>{label}</div>
        </div>
      ))}
      <div style={{ gridColumn: 'span 2', marginTop: 8, textAlign: 'left', color: '#5f5557', fontSize: 20, lineHeight: 1.28 }}>
        These checks cover the prototype. They do not measure student use or certify a WCSD service.
      </div>
    </div>
  );
}
