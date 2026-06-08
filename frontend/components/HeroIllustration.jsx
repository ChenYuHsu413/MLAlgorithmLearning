export default function HeroIllustration() {
  const points = [
    ['b', 78, 72], ['b', 78, 102], ['b', 78, 132],
    ['b', 106, 75], ['b', 106, 99], ['b', 103, 120],
    ['b', 132, 70], ['b', 127, 95], ['b', 154, 65],
    ['r', 198, 70], ['r', 176, 90], ['r', 155, 110],
    ['r', 230, 92], ['r', 210, 103], ['r', 185, 125], ['r', 236, 122],
    ['ro', 206, 125],
    ['r', 218, 140], ['r', 172, 143], ['r', 145, 140]
  ];

  const treeNodes = [
    [50, 18], [30, 40], [70, 40], [18, 62], [42, 62], [58, 62], [82, 62],
  ];

  return (
    <div className="heroArt" aria-hidden="true">
      <div className="laptopScene">
        <svg viewBox="0 0 330 230">
          <ellipse className="deskShadow" cx="150" cy="210" rx="150" ry="13" />
          <rect className="screenFrame" x="34" y="26" width="224" height="142" rx="9" />
          <rect className="screen" x="46" y="38" width="200" height="116" rx="2" />
          <circle className="camera" cx="146" cy="32" r="2" />
          <path className="axis" d="M58 142 H234 M58 142 V50" />
          <path className="axisTip" d="M234 142 L229 139 M234 142 L229 145 M58 50 L55 55 M58 50 L61 55" />
          <path className="learningCurve" d="M104 142 C108 106 128 102 142 82 C154 64 154 46 170 42" />
          {points.map(([kind, cx, cy]) => (
            <circle key={`${kind}-${cx}-${cy}`} className={kind} cx={cx} cy={cy} r="4.8" />
          ))}
          <path className="keyboardBase" d="M12 172 H284 L266 194 H28 Z" />
          <path className="trackpad" d="M118 174 H178 C176 181 171 184 164 184 H132 C125 184 120 181 118 174 Z" />
        </svg>
      </div>
      <div className="heroMiniCard treeCard">
        <svg viewBox="0 0 100 78">
          <path d="M50 18 L30 40 L18 62 M30 40 L42 62 M50 18 L70 40 L58 62 M70 40 L82 62" />
          {treeNodes.map(([cx, cy], index) => {
            if (index < 3) {
              return <rect key={`${cx}-${cy}`} x={cx - 5} y={cy - 5} width="10" height="10" rx="2" ry="2" />;
            }
            return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />;
          })}
        </svg>
      </div>
      <div className="heroMiniCard formulaCard">
        <span>∑</span>
        <b>x<sub>i</sub><sup>2</sup></b>
      </div>
      <div className="heroMiniCard chartCard">
        <div className="barContainer">
          <span className="bar blue" />
          <span className="bar orange" />
          <span className="bar red" />
        </div>
        <div className="baseline" />
      </div>
      <style jsx>{`
        .heroArt {
          min-height: 250px;
          position: relative;
        }
        .laptopScene {
          position: absolute;
          left: 4px;
          bottom: 0;
          width: 330px;
        }
        .laptopScene svg {
          display: block;
          width: 100%;
        }
        .deskShadow {
          fill: rgba(79, 70, 229, 0.14);
        }
        .screenFrame {
          fill: #1f2937;
        }
        .screen {
          fill: #0f172a;
        }
        .camera {
          fill: #374151;
        }
        .axis,
        .axisTip {
          fill: none;
          stroke: #8b9bb6;
          stroke-width: 1.6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .learningCurve {
          fill: none;
          stroke: #315bdc;
          stroke-width: 3;
          stroke-linecap: round;
        }
        .keyboardBase {
          fill: #1f2937;
        }
        .laptopScene svg circle.b {
          fill: #3b82f6;
          stroke: #1d4ed8;
          stroke-width: 0.7;
        }
        .laptopScene svg circle.r {
          fill: #ef4444;
          stroke: #dc2626;
          stroke-width: 0.7;
        }
        .laptopScene svg circle.ro {
          fill: #fb923c;
          stroke: #ea580c;
          stroke-width: 0.7;
          opacity: 0.95;
        }
        .heroMiniCard {
          position: absolute;
          display: grid;
          place-items: center;
          width: 100px;
          height: 78px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 36px rgba(79, 70, 229, 0.14);
          backdrop-filter: blur(8px);
        }
        .treeCard {
          right: 0;
          top: 0;
        }
        .treeCard svg {
          width: 78px;
          height: 58px;
        }
        .treeCard path {
          fill: none;
          stroke: #94a3b8;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .treeCard circle,
        .treeCard rect {
          fill: #f59e0b;
          stroke: #ea580c;
          stroke-width: 0.8;
        }
        .formulaCard {
          right: 34px;
          top: 92px;
          width: 84px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
          font-family: Georgia, 'Times New Roman', serif;
        }
        .formulaCard span {
          font-size: 2rem;
          line-height: 1;
        }
        .formulaCard b {
          font-size: 1.25rem;
          line-height: 1;
        }
        .formulaCard sup {
          font-size: 0.68rem;
        }
        .formulaCard sub {
          font-size: 0.62rem;
          vertical-align: sub;
          margin-left: 1px;
          margin-right: 1px;
        }
        .chartCard {
          right: 32px;
          bottom: 12px;
          width: 84px;
          height: 56px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        .barContainer {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 32px;
        }
        .bar {
          width: 8px;
          border-radius: 2px 2px 0 0;
        }
        .bar.blue {
          height: 14px;
          background: #6366f1;
        }
        .bar.orange {
          height: 24px;
          background: #fb923c;
        }
        .bar.red {
          height: 32px;
          background: #f87171;
        }
        .baseline {
          width: 44px;
          height: 2px;
          background: #94a3b8;
          margin-top: 2px;
          border-radius: 1px;
        }
        .trackpad {
          fill: #334155;
        }
      `}</style>
    </div>
  );
}
