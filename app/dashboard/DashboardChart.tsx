'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ChartDataPoint {
  idx: number
  result: string
  date: string
}

interface DashboardChartProps {
  data: ChartDataPoint[]
}

// Gráfico de barras com resultados das últimas apostas
export function DashboardChart({ data }: DashboardChartProps) {
  const chartData = data.map(d => ({
    ...d,
    valor: d.result === 'win' ? 1 : d.result === 'loss' ? -1 : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <XAxis
          dataKey="idx"
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[-1, 1]}
          ticks={[-1, 0, 1]}
          tickFormatter={v => v === 1 ? 'Win' : v === -1 ? 'Loss' : ''}
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload as ChartDataPoint
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs">
                  <p className="text-zinc-400">{d.date}</p>
                  <p className={d.result === 'win' ? 'text-green-400' : d.result === 'loss' ? 'text-red-400' : 'text-zinc-400'}>
                    {d.result === 'win' ? '✅ Win' : d.result === 'loss' ? '❌ Loss' : '⚪ Void'}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.result === 'win' ? '#22c55e' : entry.result === 'loss' ? '#ef4444' : '#52525b'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
