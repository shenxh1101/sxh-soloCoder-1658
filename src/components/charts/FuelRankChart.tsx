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

interface FuelRankChartProps {
  data: Array<{ plate: string; avgConsumption: number; rank: number }>;
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
              {entry.value.toFixed(2)} L/100km
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
  data?: FuelRankChartProps['data'];
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
            style={{ color: '#F1C40F', fill: 'rgba(241, 196, 15, 0.2)' }}
          />
        </foreignObject>
      )}
      <text
        x={isFirst ? -4 : -4}
        y={4}
        textAnchor="end"
        className={cn(
          'font-mono font-semibold text-xs',
          isFirst ? 'fill-alert-yellow' : 'fill-deep-400'
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

export default function FuelRankChart({ data }: FuelRankChartProps) {
  const sortedData = [...data].sort((a, b) => a.avgConsumption - b.avgConsumption);

  const getBarColor = (rank: number) => {
    if (rank === 1) return '#2ECC71';
    if (rank === 2) return '#4FDF8B';
    if (rank === 3) return '#7BE7A8';
    return '#A7EFC5';
  };

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 88, bottom: 0 }}
        >
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
            tickFormatter={(value) => `${value.toFixed(1)}`}
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
            dataKey="avgConsumption"
            name="平均油耗"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rank)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
