export default function MiniChart({ type, color, stateIndex = 0, algoId }) {
  const s = stateIndex % 5;
  let content = null;

  if (algoId === 0) {
    const lrStates = [
      { d: "M14 62 L88 38", dots: ['18,65', '30,58', '42,60', '56,42', '68,44', '80,30'] },
      { d: "M14 68 L88 20", dots: ['16,65', '26,55', '38,50', '50,35', '65,30', '80,25'] },
      { d: "M14 74 L88 10", dots: ['15,72', '28,58', '42,46', '55,34', '68,26', '80,12'] },
      { d: "M14 18 L88 66", dots: ['18,22', '32,30', '44,28', '58,48', '70,54', '80,60'] },
      { d: "M14 45 L88 45", dots: ['18,48', '30,42', '44,46', '56,44', '68,48', '80,42'] }
    ];
    const state = lrStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <path className="line" d={state.d} />
        {state.dots.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
      </>
    );
  } else if (algoId === 1) {
    const lgStates = [
      { d: "M14 60 C35 60 45 20 88 20", blues: ['15,58', '25,60', '35,56'], warms: ['55,24', '68,20', '80,22'] },
      { d: "M14 62 C42 62 48 18 88 18", blues: ['15,62', '28,60', '38,62'], warms: ['52,18', '70,20', '82,18'] },
      { d: "M14 65 C48 65 52 15 88 15", blues: ['16,65', '30,65', '44,65'], warms: ['56,15', '70,15', '80,15'] },
      { d: "M14 62 C50 62 62 18 88 18", blues: ['18,62', '32,62', '46,62'], warms: ['72,18', '82,18'] },
      { d: "M14 62 C26 62 38 18 88 18", blues: ['15,62'], warms: ['28,18', '40,18', '54,18', '68,18', '80,18'] }
    ];
    const state = lgStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <path className="line" d={state.d} />
        {state.blues.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
        {state.warms.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" className="warm" />;
        })}
      </>
    );
  } else if (algoId === 2) {
    const treeStates = [
      { paths: ["M50 12 L28 34 L18 58 M28 34 L40 58 M50 12 L72 34 L62 58 M72 34 L84 58"], nodes: [
        { cx: 50, cy: 12, opacity: 1, type: 'rect' },
        { cx: 28, cy: 34, opacity: 1, type: 'rect' }, { cx: 72, cy: 34, opacity: 1, type: 'rect' },
        { cx: 18, cy: 58, opacity: 1, type: 'circle' }, { cx: 40, cy: 58, opacity: 1, type: 'circle' },
        { cx: 62, cy: 58, opacity: 1, type: 'circle' }, { cx: 84, cy: 58, opacity: 1, type: 'circle' }
      ] },
      { paths: ["M50 12 L28 34 L18 58 M28 34 L40 58"], nodes: [
        { cx: 50, cy: 12, opacity: 1, type: 'rect' },
        { cx: 28, cy: 34, opacity: 1, type: 'rect' }, { cx: 72, cy: 34, opacity: 0.25, type: 'rect' },
        { cx: 18, cy: 58, opacity: 1, type: 'circle' }, { cx: 40, cy: 58, opacity: 1, type: 'circle' },
        { cx: 62, cy: 58, opacity: 0.25, type: 'circle' }, { cx: 84, cy: 58, opacity: 0.25, type: 'circle' }
      ] },
      { paths: ["M50 12 L72 34 L62 58 M72 34 L84 58"], nodes: [
        { cx: 50, cy: 12, opacity: 1, type: 'rect' },
        { cx: 28, cy: 34, opacity: 0.25, type: 'rect' }, { cx: 72, cy: 34, opacity: 1, type: 'rect' },
        { cx: 18, cy: 58, opacity: 0.25, type: 'circle' }, { cx: 40, cy: 58, opacity: 0.25, type: 'circle' },
        { cx: 62, cy: 58, opacity: 1, type: 'circle' }, { cx: 84, cy: 58, opacity: 1, type: 'circle' }
      ] },
      { paths: ["M50 12 L28 34 M50 12 L72 34"], nodes: [
        { cx: 50, cy: 12, opacity: 1, type: 'rect' },
        { cx: 28, cy: 34, opacity: 1, type: 'rect' }, { cx: 72, cy: 34, opacity: 1, type: 'rect' }
      ] },
      { paths: ["M50 12 L28 34 L40 58 M50 12 L72 34 L62 58"], nodes: [
        { cx: 50, cy: 12, opacity: 1, type: 'rect' },
        { cx: 28, cy: 34, opacity: 1, type: 'rect' }, { cx: 72, cy: 34, opacity: 1, type: 'rect' },
        { cx: 40, cy: 58, opacity: 1, type: 'circle' }, { cx: 62, cy: 58, opacity: 1, type: 'circle' }
      ] }
    ];
    const state = treeStates[s];
    content = (
      <>
        {state.paths.map((p, i) => <path key={i} d={p} />)}
        {state.nodes.map((node, i) => {
          if (node.type === 'rect') return <rect key={i} x={node.cx - 4} y={node.cy - 4} width="8" height="8" rx="1.5" ry="1.5" style={{ opacity: node.opacity }} />;
          return <circle key={i} cx={node.cx} cy={node.cy} r="4" style={{ opacity: node.opacity }} />;
        })}
      </>
    );
  } else if (algoId === 3) {
    const rfStates = [
      { paths: ["M50 12 L30 36 L18 60 M30 36 L42 60 M50 12 L70 36"], nodes: [
        { cx: 50, cy: 12, type: 'rect', opacity: 1 }, { cx: 30, cy: 36, type: 'rect', opacity: 1 }, { cx: 70, cy: 36, type: 'rect', opacity: 0.3 },
        { cx: 18, cy: 60, type: 'circle', opacity: 1 }, { cx: 42, cy: 60, type: 'circle', opacity: 1 }
      ] },
      { paths: ["M50 12 L30 36 M50 12 L70 36 L58 60 M70 36 L82 60"], nodes: [
        { cx: 50, cy: 12, type: 'rect', opacity: 1 }, { cx: 30, cy: 36, type: 'rect', opacity: 0.3 }, { cx: 70, cy: 36, type: 'rect', opacity: 1 },
        { cx: 58, cy: 60, type: 'circle', opacity: 1 }, { cx: 82, cy: 60, type: 'circle', opacity: 1 }
      ] },
      { paths: ["M50 12 L30 36 L42 60 M50 12 L70 36 L58 60"], nodes: [
        { cx: 50, cy: 12, type: 'rect', opacity: 1 }, { cx: 30, cy: 36, type: 'rect', opacity: 1 }, { cx: 70, cy: 36, type: 'rect', opacity: 1 },
        { cx: 42, cy: 60, type: 'circle', opacity: 1 }, { cx: 58, cy: 60, type: 'circle', opacity: 1 }
      ] },
      { paths: ["M50 12 L30 36 L18 60 M50 12 L70 36 L82 60"], nodes: [
        { cx: 50, cy: 12, type: 'rect', opacity: 1 }, { cx: 30, cy: 36, type: 'rect', opacity: 1 }, { cx: 70, cy: 36, type: 'rect', opacity: 1 },
        { cx: 18, cy: 60, type: 'circle', opacity: 1 }, { cx: 82, cy: 60, type: 'circle', opacity: 1 }
      ] },
      { paths: ["M50 12 L30 36 L18 60 M30 36 L42 60 M50 12 L70 36 L58 60 M70 36 L82 60"], nodes: [
        { cx: 50, cy: 12, type: 'rect', opacity: 1 }, { cx: 30, cy: 36, type: 'rect', opacity: 1 }, { cx: 70, cy: 36, type: 'rect', opacity: 1 },
        { cx: 18, cy: 60, type: 'circle', opacity: 1 }, { cx: 42, cy: 60, type: 'circle', opacity: 1 },
        { cx: 58, cy: 60, type: 'circle', opacity: 1 }, { cx: 82, cy: 60, type: 'circle', opacity: 1 }
      ] }
    ];
    const state = rfStates[s];
    content = (
      <>
        {state.paths.map((p, i) => <path key={i} d={p} />)}
        {state.nodes.map((node, i) => {
          if (node.type === 'rect') return <rect key={i} x={node.cx - 4} y={node.cy - 4} width="8" height="8" rx="1.5" ry="1.5" style={{ opacity: node.opacity }} />;
          return <circle key={i} cx={node.cx} cy={node.cy} r="4" style={{ opacity: node.opacity }} />;
        })}
      </>
    );
  } else if (algoId === 4) {
    const svmStates = [
      { d: "M14 60 L88 20", d1: "M14 48 L88 8", d2: "M14 72 L88 32", blues: ['18,74', '28,68', '35,76'], warms: ['65,15', '75,22', '82,12'] },
      { d: "M14 55 L88 25", d1: "M14 45 L88 15", d2: "M14 65 L88 35", blues: ['18,72', '26,62', '34,70'], warms: ['68,18', '76,23', '84,14'] },
      { d: "M14 50 L88 30", d1: "M14 36 L88 16", d2: "M14 64 L88 44", blues: ['16,74', '26,68', '35,76'], warms: ['65,12', '74,22', '82,10'] },
      { d: "M14 64 L88 16", d1: "M14 54 L88 6", d2: "M14 74 L88 26", blues: ['18,76', '26,72', '35,76'], warms: ['68,14', '76,20', '84,10'] },
      { d: "M 20 40 A 28 28 0 1 1 76 40 A 28 28 0 1 1 20 40", d1: "M 25 40 A 23 23 0 1 1 71 40 A 23 23 0 1 1 25 40", d2: "M 15 40 A 33 33 0 1 1 81 40 A 33 33 0 1 1 15 40", blues: ['42,38', '50,44', '48,32'], warms: ['12,20', '85,25', '80,62'] }
    ];
    const state = svmStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <path d={state.d1} style={{ strokeDasharray: '2,2', strokeWidth: 1.2, opacity: 0.7 }} />
        <path d={state.d2} style={{ strokeDasharray: '2,2', strokeWidth: 1.2, opacity: 0.7 }} />
        <path className="line" d={state.d} />
        {state.blues.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
        {state.warms.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" className="warm" />;
        })}
      </>
    );
  } else if (algoId === 5) {
    const knnStates = [
      { target: [48, 44], kRadius: 10, blues: ['45,40', '32,54', '60,32'], warms: ['56,48', '35,32', '62,56'] },
      { target: [48, 44], kRadius: 18, blues: ['45,40', '32,54', '60,32'], warms: ['56,48', '35,32', '62,56'] },
      { target: [48, 44], kRadius: 26, blues: ['45,40', '32,54', '60,32'], warms: ['56,48', '35,32', '62,56'] },
      { target: [38, 38], kRadius: 16, blues: ['32,36', '42,42', '24,46'], warms: ['56,48', '50,30', '26,24'] },
      { target: [58, 48], kRadius: 16, blues: ['52,44', '64,52', '62,38'], warms: ['70,54', '48,56', '54,62'] }
    ];
    const state = knnStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <circle cx={state.target[0]} cy={state.target[1]} r={state.kRadius} style={{ fill: 'none', stroke: '#94a3b8', strokeDasharray: '3,3', strokeWidth: 1.5 }} />
        <circle cx={state.target[0]} cy={state.target[1]} r="5" style={{ fill: '#a855f7', stroke: '#7e22ce', strokeWidth: 1.5 }} />
        <circle cx={state.target[0]} cy={state.target[1]} r="1.8" style={{ fill: '#fff' }} />
        {state.blues.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
        {state.warms.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" className="warm" />;
        })}
      </>
    );
  } else if (algoId === 6) {
    const nbStates = [
      { d1: "M12 68 C25 68 35 15 50 68", d2: "M50 68 C65 15 75 68 88 68", split: 50 },
      { d1: "M12 68 C22 68 30 25 45 68", d2: "M45 68 C60 10 70 68 88 68", split: 45 },
      { d1: "M12 68 C26 68 38 10 55 68", d2: "M55 68 C70 25 78 68 88 68", split: 55 },
      { d1: "M12 68 C25 68 35 32 50 68", d2: "M50 68 C62 8 72 68 88 68", split: 48 },
      { d1: "M12 68 C20 68 32 8 48 68", d2: "M48 68 C62 36 72 68 88 68", split: 52 }
    ];
    const state = nbStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <path d={state.d1} style={{ fill: 'none', stroke: '#3b82f6', strokeWidth: 2.5 }} />
        <path d={state.d2} style={{ fill: 'none', stroke: '#fb923c', strokeWidth: 2.5 }} />
        <line x1={state.split} y1="12" x2={state.split} y2="68" style={{ stroke: '#94a3b8', strokeDasharray: '3,3', strokeWidth: 1.5 }} />
      </>
    );
  } else if (algoId === 7) {
    const clusterStates = [
      {
        blues: [{ cx: 16, cy: 28 }, { cx: 25, cy: 37 }, { cx: 32, cy: 46 }, { cx: 66, cy: 24 }, { cx: 75, cy: 36 }, { cx: 82, cy: 48 }],
        warms: [{ cx: 42, cy: 56 }, { cx: 50, cy: 58 }, { cx: 57, cy: 60 }]
      },
      {
        blues: [{ cx: 18, cy: 26 }, { cx: 22, cy: 34 }, { cx: 28, cy: 38 }, { cx: 70, cy: 24 }, { cx: 74, cy: 32 }, { cx: 80, cy: 28 }],
        warms: [{ cx: 44, cy: 52 }, { cx: 48, cy: 55 }, { cx: 52, cy: 58 }]
      },
      {
        blues: [{ cx: 20, cy: 25 }, { cx: 22, cy: 29 }, { cx: 25, cy: 31 }, { cx: 72, cy: 22 }, { cx: 75, cy: 26 }, { cx: 78, cy: 24 }],
        warms: [{ cx: 46, cy: 48 }, { cx: 48, cy: 51 }, { cx: 50, cy: 53 }]
      },
      {
        blues: [{ cx: 21, cy: 24 }, { cx: 22, cy: 26 }, { cx: 23, cy: 25 }, { cx: 74, cy: 23 }, { cx: 75, cy: 25 }, { cx: 76, cy: 24 }],
        warms: [{ cx: 47, cy: 49 }, { cx: 48, cy: 50 }, { cx: 49, cy: 49 }]
      },
      {
        blues: [{ cx: 25, cy: 45 }, { cx: 28, cy: 48 }, { cx: 31, cy: 46 }, { cx: 65, cy: 45 }, { cx: 68, cy: 49 }, { cx: 71, cy: 47 }],
        warms: [{ cx: 48, cy: 25 }, { cx: 50, cy: 27 }, { cx: 52, cy: 26 }]
      }
    ];
    const state = clusterStates[s];
    content = (
      <>
        {state.blues.map((dot, index) => (
          <circle key={`blue-${index}`} cx={dot.cx} cy={dot.cy} r="4.5" />
        ))}
        {state.warms.map((dot, index) => (
          <circle key={`warm-${index}`} cx={dot.cx} cy={dot.cy} r="4.5" className="warm" />
        ))}
      </>
    );
  } else if (algoId === 8) {
    const pcaStates = [
      { pc1: "M48 48 L76 26", pc2: "M48 48 L34 30", dots: ['32,58', '40,46', '46,54', '56,36', '68,34', '74,22'], proj: [] },
      { pc1: "M20 70 L80 10", pc2: "", dots: ['30,50', '42,32', '52,48', '60,20', '72,35', '80,12'], proj: [
        { x1: 30, y1: 50, x2: 44, y2: 46 }, { x1: 42, y1: 32, x2: 50, y2: 40 }, { x1: 52, y1: 48, x2: 59, y2: 31 }, { x1: 60, y1: 20, x2: 62, y2: 28 }, { x1: 72, y1: 35, x2: 74, y2: 16 }
      ] },
      { pc1: "M12 40 H88", pc2: "", dots: ['24,40', '36,40', '48,40', '60,40', '72,40', '82,40'], proj: [] },
      { pc1: "M50 48 L80 40", pc2: "M50 48 L44 20", dots: ['42,46', '52,50', '64,36', '70,44', '80,30'], proj: [] },
      { pc1: "", pc2: "", dots: [], bars: [45, 18, 5], proj: [] }
    ];
    const state = pcaStates[s];
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        {state.proj.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} style={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '2,2' }} />
        ))}
        {state.pc1 && <path d={state.pc1} style={{ stroke: '#fb923c', strokeWidth: 2.5 }} />}
        {state.pc2 && <path d={state.pc2} style={{ stroke: '#94a3b8', strokeWidth: 1.8 }} />}
        {state.dots.map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
        {state.bars && state.bars.map((h, i) => (
          <rect key={i} x={25 + i * 20} y={68 - h} width="12" height={h} rx="2" ry="2" />
        ))}
      </>
    );
  } else if (algoId === 9) {
    const networkStates = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0.2, 0.8, 0.2, 1, 0.2, 0.8, 0.1],
      [0.2, 1, 0.2, 0.8, 0.2, 1, 0.1, 0.9],
      [0.9, 0.9, 0.1, 0.1, 0.9, 0.1, 0.9, 0.1],
      [1, 0.1, 0.1, 0.9, 1, 0.1, 0.1, 0.9]
    ];
    const currentNetworkOpacities = networkStates[s];
    const networkConnections = [
      "M18 18 L50 30", "M50 30 L82 18", "M18 40 L50 30", "M50 30 L82 40",
      "M18 62 L50 52", "M50 52 L82 62", "M50 30 L82 62", "M50 52 L82 18"
    ];
    content = (
      <>
        {networkConnections.map((d, i) => (
          <path
            key={i}
            d={d}
            style={{ opacity: currentNetworkOpacities[i], strokeWidth: currentNetworkOpacities[i] > 0.5 ? 2.5 : 1.2 }}
          />
        ))}
        {[18, 18, 18, 50, 50, 82, 82, 82].map((x, index) => (
          <circle key={index} cx={x} cy={[18, 40, 62, 30, 52, 18, 40, 62][index]} r="4.5" />
        ))}
      </>
    );
  } else {
    content = (
      <>
        <path className="axis" d="M12 68 H88 M12 68 V10" />
        <path className="line" d="M14 64 C32 54 42 46 55 36 S78 23 88 12" />
        {['12,74', '24,62', '36,58', '48,43', '62,38', '76,24'].map((dot) => {
          const [cx, cy] = dot.split(',');
          return <circle key={dot} cx={cx} cy={cy} r="4" />;
        })}
      </>
    );
  }

  return (
    <svg className="miniChart" viewBox="0 0 100 80" aria-hidden="true">
      {content}
      <style jsx>{`
        .miniChart {
          width: 100%;
          height: 82px;
        }
        .miniChart :global(path) {
          fill: none;
          stroke: ${color};
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .miniChart :global(.axis) {
          stroke: var(--chart-axis);
          stroke-width: 2;
        }
        .miniChart :global(.line) {
          stroke: ${color};
        }
        .miniChart :global(circle),
        .miniChart :global(rect) {
          fill: ${color};
          stroke: ${color};
          stroke-width: 0.5;
          opacity: 0.9;
        }
        .miniChart :global(.warm) {
          fill: #fb923c;
          stroke: #ea580c;
        }
      `}</style>
    </svg>
  );
}
