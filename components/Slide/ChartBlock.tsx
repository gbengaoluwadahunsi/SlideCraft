import React from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface ChartBlockProps {
    chartType?: 'bar' | 'line' | 'pie';
    chartData?: Array<{ name: string; value: number; }>;
    activeAccentColor: string;
    activeTextColor: string;
    isDownloading: boolean;
}

export const ChartBlock: React.FC<ChartBlockProps> = ({
    chartType,
    chartData,
    activeAccentColor,
    activeTextColor,
    isDownloading,
}) => {
    if (!chartType || !chartData || chartData.length === 0) return null;

    const COLORS = ['var(--slide-accent)', '#ff9f40', '#ff6384', '#4bc0c0', '#9966ff'];

    // Static HTML/CSS chart rendering for download mode (html-to-image has issues with Recharts SVG)
    const renderStaticChart = () => {
        if (chartType === 'pie') {
            const total = chartData.reduce((sum, item) => sum + item.value, 0);
            let cumulativePercent = 0;

            const slices = chartData.map((item, i) => {
                const percent = (item.value / total) * 100;
                const start = cumulativePercent;
                cumulativePercent += percent;
                return `${COLORS[i % COLORS.length]} ${start}% ${cumulativePercent}%`;
            });

            return (
                <div className="flex flex-col items-center justify-center p-8 w-full h-full">
                    <div
                        className="w-80 h-80 rounded-full shadow-2xl relative"
                        style={{
                            background: `conic-gradient(${slices.join(', ')})`,
                            transform: 'rotate(-90deg)'
                        }}
                    />
                    <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-4">
                        {chartData.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-xl font-medium" style={{ color: 'var(--slide-text)' }}>{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const maxValue = Math.max(...chartData.map(d => d.value));

        return (
            <div className="flex flex-col w-full h-full p-8">
                <div className="flex-1 flex items-end gap-6 border-l-2 border-b-2" style={{ borderColor: 'var(--slide-text-45)' }}>
                    {chartData.map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4">
                            <div
                                className="w-full rounded-t-xl transition-all shadow-lg"
                                style={{
                                    height: `${(item.value / maxValue) * 90}%`,
                                    backgroundColor: chartType === 'bar' ? COLORS[i % COLORS.length] : 'transparent',
                                    border: chartType === 'line' ? `4px solid ${activeAccentColor}` : 'none',
                                    position: 'relative'
                                }}
                            >
                                {chartType === 'line' && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white shadow-xl" style={{ backgroundColor: 'var(--slide-accent)' }} />
                                )}
                            </div>
                            <span className="text-lg font-bold truncate max-w-full" style={{ color: 'var(--slide-text)' }}>{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (isDownloading) return renderStaticChart();

    let chartContent;
    if (chartType === 'bar') {
        chartContent = (
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slide-text-45)" />
                <XAxis dataKey="name" stroke="var(--slide-text)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--slide-text)" fontSize={14} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: 'var(--slide-accent)' }}
                />
                <Bar dataKey="value" fill="var(--slide-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
        );
    } else if (chartType === 'line') {
        chartContent = (
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slide-text-45)" />
                <XAxis dataKey="name" stroke="var(--slide-text)" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--slide-text)" fontSize={14} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: 'var(--slide-accent)' }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--slide-accent)" strokeWidth={4} dot={{ r: 6, fill: 'var(--slide-accent)', strokeWidth: 2, stroke: '#fff' }} />
            </LineChart>
        );
    } else if (chartType === 'pie') {
        chartContent = (
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={160}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
            </PieChart>
        );
    }

    return (
        <div className="flex-1 w-full bg-black/20 rounded-3xl p-8 my-6 border border-white/5" style={{ minHeight: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
                {chartContent as React.ReactElement}
            </ResponsiveContainer>
        </div>
    );
};
