import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BAND_STYLE } from '../../lib/format.js';
import { bandTicks } from '../../lib/scoring/bands.js';

/**
 * Side-by-side comparison of the three results.
 *
 * The three instruments have different cut-points, so a shared y-axis with a
 * shared gridline would be a lie — 55 is Moderate for one condition and High for
 * another. Instead each column carries its OWN Low/Moderate/High zones painted
 * behind its bars, exactly the boundaries `ScoreTrack` draws on the cards. That
 * makes the axis redundant, so it is gone: a judge reads "which band" off the
 * background and "how far" off the label on the bar.
 */
function BandZones({ x, width, y, height, payload }) {
  if (!payload) return null;

  const ticks = bandTicks(payload.thresholds, payload.max);
  const bottom = y + height;
  const at = (v) => bottom - (Math.min(100, Math.max(0, v)) / 100) * height;

  const zones = [
    { key: 'low', from: 0, to: ticks.moderate },
    { key: 'moderate', from: ticks.moderate, to: ticks.high },
    { key: 'high', from: ticks.high, to: 100 },
  ];

  return (
    <g aria-hidden="true">
      {zones.map((z) => (
        <rect
          key={z.key}
          x={x}
          width={width}
          y={at(z.to)}
          height={Math.max(0, at(z.from) - at(z.to))}
          fill={BAND_STYLE[z.key].hex}
          fillOpacity={0.07}
        />
      ))}
      {[ticks.moderate, ticks.high].map((t) => (
        <line
          key={t}
          x1={x}
          x2={x + width}
          y1={at(t)}
          y2={at(t)}
          stroke="#CBD2DB"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ))}
    </g>
  );
}

export function ComparisonChart({ summary, isSimulating }) {
  const data = summary.list.map((d) => ({
    name: d.short,
    current: d.current.index,
    simulated: d.simulated.index,
    currentBand: d.current.band,
    simulatedBand: d.simulated.band,
    thresholds: d.current.thresholds,
    max: d.current.max,
  }));

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="h-card">Risk comparison</h3>
        <p className="text-meta text-slate-500">
          {isSimulating ? 'Your data vs. simulated' : 'Screening index, 0–100'}
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, bottom: 4, left: 8 }} barGap={6}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#5A6675' }}
              axisLine={{ stroke: '#E3E7EC' }}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E3E7EC',
                fontSize: 12,
                boxShadow: '0 4px 16px rgb(22 32 43 / 0.08)',
              }}
              formatter={(value, key) => [value, key === 'current' ? 'Your data' : 'Simulated']}
            />

            <Bar
              dataKey="current"
              name="Your data"
              radius={[6, 6, 0, 0]}
              maxBarSize={54}
              background={<BandZones />}
            >
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={BAND_STYLE[d.currentBand].hex}
                  fillOpacity={isSimulating ? 0.28 : 1}
                />
              ))}
              <LabelList
                dataKey="current"
                position="top"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fill: isSimulating ? '#5A6675' : '#333E4B',
                }}
              />
            </Bar>

            {isSimulating && (
              <Bar dataKey="simulated" name="Simulated" radius={[6, 6, 0, 0]} maxBarSize={54}>
                {data.map((d) => (
                  <Cell key={d.name} fill={BAND_STYLE[d.simulatedBand].hex} />
                ))}
                <LabelList
                  dataKey="simulated"
                  position="top"
                  style={{ fontSize: 13, fontWeight: 700, fill: '#16202B' }}
                />
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-slate-500">
        {Object.entries(BAND_STYLE).map(([band, s]) => (
          <span key={band} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.dot}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-slate-500">
          {isSimulating
            ? 'Faded bars are your unchanged data'
            : 'Each column shows its own band boundaries'}
        </span>
      </div>
    </div>
  );
}
