'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { SIMULATED_METRICS } from '@/lib/data';
import StatusBadge from './StatusBadge';

export default function MetricsPanel() {
  const methods = [
    { name: 'Bicubic', key: 'bicubic' as const, color: '#5C5A56' },
    { name: 'SISR', key: 'sisr' as const, color: '#8C8A85' },
    { name: 'Unranked MISR', key: 'unranked_misr' as const, color: '#E8A33D' },
    { name: 'Top-K MISR', key: 'topk_misr' as const, color: '#7A9B6E' },
  ];

  const psnrData = methods.map(m => ({
    name: m.name,
    value: SIMULATED_METRICS[m.key].psnr,
    color: m.color,
  }));

  const ssimData = methods.map(m => ({
    name: m.name,
    value: SIMULATED_METRICS[m.key].ssim,
    color: m.color,
  }));

  const samData = methods.map(m => ({
    name: m.name,
    value: SIMULATED_METRICS[m.key].sam,
    color: m.color,
  }));

  return (
    <div id="metrics" className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-label">EVALUATION METRICS</div>
        <StatusBadge type="simulated" label="DEMO / SIMULATED" />
      </div>

      <div className="text-[10px] text-text-dim mono mb-4">
        These metrics are simulated targets representing expected performance. No model has been trained or evaluated yet.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricChart title="PSNR (dB) ↑" data={psnrData} />
        <MetricChart title="SSIM ↑" data={ssimData} />
        <MetricChart title="SAM (°) ↓" data={samData} />
      </div>

      {/* Metric table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[10px] mono">
          <thead>
            <tr className="border-b border-grid text-text-dim text-left">
              <th className="pb-1.5 pr-4 font-medium">METHOD</th>
              <th className="pb-1.5 pr-4 font-medium text-right">PSNR ↑</th>
              <th className="pb-1.5 pr-4 font-medium text-right">SSIM ↑</th>
              <th className="pb-1.5 font-medium text-right">SAM ↓</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.key} className="border-b border-grid/50">
                <td className="py-1.5 pr-4 text-text-primary">{m.name}</td>
                <td className="py-1.5 pr-4 text-right" style={{ color: m.color }}>
                  {SIMULATED_METRICS[m.key].psnr.toFixed(1)}
                </td>
                <td className="py-1.5 pr-4 text-right" style={{ color: m.color }}>
                  {SIMULATED_METRICS[m.key].ssim.toFixed(3)}
                </td>
                <td className="py-1.5 text-right" style={{ color: m.color }}>
                  {SIMULATED_METRICS[m.key].sam.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricChart({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  return (
    <div>
      <div className="mono text-[9px] text-text-dim uppercase tracking-wider mb-2">{title}</div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232529" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#5C5A56', fontSize: 8, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
              interval={0}
              angle={-20}
              textAnchor="end"
              height={35}
            />
            <YAxis
              tick={{ fill: '#8C8A85', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              stroke="#232529"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                return (
                  <div className="panel p-2 shadow-lg mono text-[10px]">
                    <span className="text-text-primary">{payload[0].payload.name}: </span>
                    <span className="text-accent">{Number(payload[0].value).toFixed(3)}</span>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
