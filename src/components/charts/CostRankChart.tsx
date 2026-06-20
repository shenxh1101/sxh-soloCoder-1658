import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostRankChartProps {
  data: Array<{ plate: string; cost: number; rank: number }>;
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
      <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[160px]">
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
              ¥{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface RankLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: string;
  index?: number;
  data?: CostRankChartProps['data'];
}

const RankLabel = ({ x = 0, y = 0, height = 0, value, index = 0, data }: RankLabelProps) => {
  const item = data?.[index];
  const rank = item?.rank ?? index + 1;
  const isFirst = rank === 1;

  return (
    <g transform={`translate(${x - 56}, ${y + height / 2})`}>
      {isFirst && (
        <foreignObject x={-32} y={-10} width={24} height={24}>
          <Trophy
            className={cn('w-5 h-5')}
            style={{ color: '#9B59B6', fill: 'rgba(155, 89, 182, 0.2)' }}
          />
        </foreignObject>
      )}
      <text
        x={isFirst ? -4 : -4}
        y={4}
        textAnchor="end"
        className={cn(
          'font-mono font-semibold text-xs',
          isFirst ? 'fill-repair-500' : 'fill-deep-400'
        )}
        fontSize={12}
      >
        #{rank}
      </text>
      <text
        x={56}
        y={4}
        textAnchor="end"
        className="fill-deep-600 font-medium"
        fontSize={12}
      >
        {value}
      </text>
    </g>
  );
};

export default function CostRankChart({ data }: CostRankChartProps) {
  const sortedData = [...data].sort((a, b) => b.cost - a.cost);

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 88, bottom: 0 }}
        >
          <defs>
            <linearGradient id="repairGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D3B3EB" />
              <stop offset="100%" stopColor="#9B59B6" />
            </linearGradient>
            <linearGradient id="repairGradient2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E9D9F5" />
              <stop offset="100%" stopColor="#BD8DE1" />
            </linearGradient>
            <linearGradient id="repairGradient3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F4ECFA" />
              <stop offset="100%" stopColor="#A767D7" />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8EEF7"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: '#A3B9DD', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#E8EEF7' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            dataKey="plate"
            type="category"
            tickLine={false}
            axisLine={false}
            width={96}
            tick={(props) => {
              const { x, y, payload, index } = props;
              return (
                <RankLabel
                  x={x}
                  y={y}
                  height={32}
                  value={payload.value}
                  index={index}
                  data={sortedData}
                />
              );
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
          <Bar
            dataKey="cost"
            name="维修费用"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {sortedData.map((entry, index) => {
              const rank = entry.rank;
              const fill =
                rank === 1
                  ? 'url(#repairGradient)'
                  : rank === 2
                  ? 'url(#repairGradient2)'
                  : rank === 3
                  ? 'url(#repairGradient3)'
                  : '#E9D9F5';
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
