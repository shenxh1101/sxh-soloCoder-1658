import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface FuelTrendChartProps {
  data: Array<{ date: string; consumption: number | null }>;
  avgLine?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[140px]">
        <p className="text-xs text-deep-400 mb-1.5 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-deep-500">{entry.name}</span>
            </div>
            <span className="text-xs font-mono font-semibold text-deep-700 tabular-nums">
              {entry.value.toFixed(1)} L
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FuelTrendChart({ data, avgLine }: FuelTrendChartProps) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ECC71" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2ECC71" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF7"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#A3B9DD', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#E8EEF7' }}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#A3B9DD', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E8EEF7', strokeDasharray: '3 3' }} />
          {avgLine !== undefined && (
            <ReferenceLine
              y={avgLine}
              stroke="#FF6B35"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `均值 ${avgLine.toFixed(1)}`,
                position: 'right',
                fill: '#FF6B35',
                fontSize: 11,
                fontWeight: 500,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="consumption"
            name="油耗"
            stroke="#2ECC71"
            strokeWidth={2.5}
            dot={{ fill: '#FFFFFF', stroke: '#2ECC71', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2ECC71', strokeWidth: 2, fill: '#FFFFFF' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
