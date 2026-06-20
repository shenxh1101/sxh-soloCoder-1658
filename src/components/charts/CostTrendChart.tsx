import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CostTrendChartProps {
  data: Array<{ month: string; fuel: number; maintenance: number; total: number }>;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[180px]">
        <p className="text-xs text-deep-400 mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-deep-500">{entry.name}</span>
            </div>
            <span className="text-xs font-mono font-semibold text-deep-700 tabular-nums">
              ¥{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) => {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-5 pt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-deep-500">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CostTrendChart({ data }: CostTrendChartProps) {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF7"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: '#A3B9DD', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#E8EEF7' }}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#A3B9DD', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
          <Legend content={<CustomLegend />} />
          <Bar
            dataKey="fuel"
            name="油耗费用"
            stackId="cost"
            fill="#2ECC71"
            radius={[0, 0, 0, 0]}
            barSize={28}
          />
          <Bar
            dataKey="maintenance"
            name="维修费用"
            stackId="cost"
            fill="#9B59B6"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="总成本"
            stroke="#FF6B35"
            strokeWidth={2.5}
            dot={{ fill: '#FFFFFF', stroke: '#FF6B35', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#FFFFFF' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
