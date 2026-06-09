import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  CreditCard,
  Clock,
  Calendar,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  UserCheck,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { ColumnDef } from '@tanstack/react-table';
import { useStatisticsStore } from '@/store/statisticsStore';
import type { ConversionRateData, SourceAnalysisData, CourseStatsData, PerformanceData, FunnelData, ConsultantTaskStats } from '@/store/statisticsStore';
import { STAGE_COLUMNS } from '@/types';
import type { CustomerStage } from '@/types';
import { cn } from '@/lib/utils';

type TimeRangeType = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';

const TIME_RANGE_OPTIONS: SelectOption<TimeRangeType>[] = [
  { value: 'thisMonth', label: '本月' },
  { value: 'lastMonth', label: '上月' },
  { value: 'thisQuarter', label: '本季度' },
  { value: 'thisYear', label: '本年度' },
  { value: 'custom', label: '自定义' },
];

const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
];

const formatCurrency = (value: number): string => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(2)}万`;
  }
  return `¥${value.toLocaleString()}`;
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: string;
}

function StatCard({ title, value, icon, trend, trendLabel, color }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp
                  className={cn(
                    'h-4 w-4',
                    trend >= 0 ? 'text-green-500' : 'text-red-500 rotate-180'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(trend)}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-gray-500">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              color
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionChart({ data }: { data: ConversionRateData[] }) {
  const chartData = data.map((item) => ({
    name: item.consultantName,
    转化率: item.conversionRate,
    rank: item.rank,
  }));

  const getRankBadge = (rank: number) => {
    const colors: Record<number, string> = {
      1: 'bg-yellow-400 text-yellow-900',
      2: 'bg-gray-300 text-gray-700',
      3: 'bg-amber-600 text-amber-50',
    };
    return colors[rank] || 'bg-gray-100 text-gray-600';
  };

  const CustomBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    const rank = payload?.rank || 0;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#3B82F6"
          rx={4}
          className="hover:opacity-80 transition-opacity"
        />
        {rank <= 3 && (
          <foreignObject x={x + width / 2 - 12} y={y - 24} width={24} height={24}>
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                getRankBadge(rank)
              )}
            >
              {rank}
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${value}%`}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}%`, '转化率']}
        />
        <Bar dataKey="转化率" shape={CustomBar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FunnelChart({ data }: { data: FunnelData[] }) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      <div className="w-full lg:w-1/2 space-y-4">
        {data.map((item, index) => {
          const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={item.stage} className="relative">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-20 text-sm font-medium text-gray-700">{item.stage}</div>
                <div className="flex-1 h-12 rounded-lg overflow-hidden" style={{ backgroundColor: `${item.color}15` }}>
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-between px-4"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: item.color,
                      minWidth: '80px',
                    }}
                  >
                    <span className="text-white font-semibold">{item.count} 人</span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  {index > 0 && (
                    <Badge variant="secondary" size="sm">
                      转化 {item.conversionRate}%
                    </Badge>
                  )}
                </div>
              </div>
              {index < data.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-gray-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="w-full lg:w-1/2">
        <div className="grid grid-cols-2 gap-4">
          {data.map((item, index) => (
            <Card key={item.stage} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm text-gray-500">{item.stage}</p>
                    <p className="text-xl font-bold text-gray-900">{item.count}</p>
                    {index > 0 && (
                      <p className="text-xs text-gray-400">转化 {item.conversionRate}%</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceAnalysisChart({ data }: { data: SourceAnalysisData[] }) {
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      name: item.sourceName,
      value: item.count,
      percentage: item.percentage,
      conversionRate: item.conversionRate,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-1/2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, _name: string, props: { payload: { name: string; percentage: number; conversionRate: number } }) => {
                const item = props.payload;
                return [
                  `${value}人 (${item.percentage}%)`,
                  `${item.name} · 转化率 ${item.conversionRate}%`,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full lg:w-1/2">
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{item.value}人</span>
                <Badge variant="primary" size="sm">
                  转化 {item.conversionRate}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceChart({ data }: { data: PerformanceData[] }) {
  const chartData = data.map((item) => ({
    month: item.month.replace(/^\d{4}-/, ''),
    合同金额: item.contractAmount / 10000,
    回款金额: item.receivedAmount / 10000,
    新增客户: item.newCustomers,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${value}万`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number, name: string) => {
            if (name === '新增客户') return [`${value}人`, name];
            return [`${value.toFixed(2)}万`, name];
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="合同金额"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3B82F6' }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="回款金额"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ r: 4, fill: '#10B981' }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="新增客户"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ r: 4, fill: '#F59E0B' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StageDistributionChart({
  data,
}: {
  data: Record<CustomerStage, { count: number; percentage: number }>;
}) {
  const chartData = STAGE_COLUMNS.map((stage) => ({
    stage: stage.title,
    value: data[stage.id].count,
    percentage: data[stage.id].percentage,
    fullMark: 100,
  })).filter((item) => item.value > 0);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-1/2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="stage"
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Radar
              name="占比"
              dataKey="percentage"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, _name: string, props: { payload: { stage: string; value: number; percentage: number } }) => {
                const item = props.payload;
                return [`${item.value}人 (${value}%)`, '占比'];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full lg:w-1/2">
        <div className="space-y-3">
          {STAGE_COLUMNS.filter((stage) => data[stage.id].count > 0).map(
            (stage) => (
              <div key={stage.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm text-gray-700">{stage.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${data[stage.id].percentage}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {data[stage.id].percentage}%
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const {
    loadStatisticsData,
    loading,
    getOverallStats,
    getConversionRates,
    getSourceAnalysis,
    getCourseStats,
    getPerformanceData,
    getStageDistribution,
    getFunnelData,
    getConsultantTaskStats,
    setDateRange,
    dateRange,
  } = useStatisticsStore();

  const [timeRange, setTimeRange] = useState<TimeRangeType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStatisticsData();
  }, [loadStatisticsData, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    let start: string, end: string;

    switch (timeRange) {
      case 'thisMonth':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'lastMonth':
        start = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
        end = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
        break;
      case 'thisQuarter':
        start = format(startOfQuarter(now), 'yyyy-MM-dd');
        end = format(endOfQuarter(now), 'yyyy-MM-dd');
        break;
      case 'thisYear':
        start = format(startOfYear(now), 'yyyy-MM-dd');
        end = format(endOfYear(now), 'yyyy-MM-dd');
        break;
      case 'custom':
        start = customStartDate || format(startOfMonth(now), 'yyyy-MM-dd');
        end = customEndDate || format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      default:
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
    }

    setDateRange(start, end);
  }, [timeRange, customStartDate, customEndDate, setDateRange]);

  const overallStats = useMemo(() => getOverallStats(), [getOverallStats, refreshKey]);
  const conversionRates = useMemo(() => getConversionRates(), [getConversionRates, refreshKey]);
  const sourceAnalysis = useMemo(() => getSourceAnalysis(), [getSourceAnalysis, refreshKey]);
  const courseStats = useMemo(() => getCourseStats(), [getCourseStats, refreshKey]);
  const performanceData = useMemo(() => getPerformanceData(6), [getPerformanceData, refreshKey]);
  const stageDistribution = useMemo(() => getStageDistribution(), [getStageDistribution, refreshKey]);
  const funnelData = useMemo(() => getFunnelData(), [getFunnelData, refreshKey]);
  const consultantTaskStats = useMemo(() => getConsultantTaskStats(), [getConsultantTaskStats, refreshKey]);

  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);

  const consultantTaskColumns: ColumnDef<ConsultantTaskStats, unknown>[] = [
    {
      accessorKey: 'consultantName',
      header: '顾问',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{row.original.consultantName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalTasks',
      header: '本周任务',
      cell: ({ row }) => (
        <Badge variant="primary" size="sm">
          {row.original.totalTasks} 项
        </Badge>
      ),
    },
    {
      accessorKey: 'completedTasks',
      header: '已完成',
      cell: ({ row }) => (
        <Badge variant="success" size="sm">
          {row.original.completedTasks} 项
        </Badge>
      ),
    },
    {
      accessorKey: 'overdueTasks',
      header: '逾期',
      cell: ({ row }) => (
        <Badge variant={row.original.overdueTasks > 0 ? 'danger' : 'secondary'} size="sm">
          {row.original.overdueTasks} 项
        </Badge>
      ),
    },
    {
      accessorKey: 'completionRate',
      header: '完成率',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                row.original.completionRate >= 80
                  ? 'bg-green-500'
                  : row.original.completionRate >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${Math.min(row.original.completionRate, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatPercent(row.original.completionRate)}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (selectedConsultant === row.original.consultantId) {
              setSelectedConsultant(null);
            } else {
              setSelectedConsultant(row.original.consultantId);
            }
          }}
          className={cn(
            'h-7 px-2 text-xs',
            selectedConsultant === row.original.consultantId
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          )}
        >
          {selectedConsultant === row.original.consultantId ? '取消筛选' : '筛选查看'}
        </Button>
      ),
    },
  ];

  const courseColumns: ColumnDef<CourseStatsData, unknown>[] = [
    {
      accessorKey: 'course',
      header: '课程名称',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.course}</div>
      ),
    },
    {
      accessorKey: 'intendedCount',
      header: '意向人数',
      cell: ({ row }) => (
        <Badge variant="primary" size="sm">
          {row.original.intendedCount}人
        </Badge>
      ),
    },
    {
      accessorKey: 'closedCount',
      header: '成交人数',
      cell: ({ row }) => (
        <Badge variant="success" size="sm">
          {row.original.closedCount}人
        </Badge>
      ),
    },
    {
      accessorKey: 'conversionRate',
      header: '转化率',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(row.original.conversionRate, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {formatPercent(row.original.conversionRate)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'totalRevenue',
      header: '总营收',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(row.original.totalRevenue)}
        </span>
      ),
    },
  ];

  const statCards = [
    {
      title: '总客户数',
      value: overallStats.totalCustomers,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: 'bg-blue-50',
    },
    {
      title: '总合同金额',
      value: formatCurrency(overallStats.totalRevenue),
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      color: 'bg-green-50',
    },
    {
      title: '已回款金额',
      value: formatCurrency(overallStats.totalReceived),
      icon: <CreditCard className="h-6 w-6 text-emerald-600" />,
      color: 'bg-emerald-50',
    },
    {
      title: '整体转化率',
      value: formatPercent(overallStats.overallConversionRate),
      icon: <Target className="h-6 w-6 text-purple-600" />,
      color: 'bg-purple-50',
    },
    {
      title: '平均客单价',
      value: formatCurrency(overallStats.avgContractAmount),
      icon: <TrendingUp className="h-6 w-6 text-orange-600" />,
      color: 'bg-orange-50',
    },
    {
      title: '待回款金额',
      value: formatCurrency(overallStats.pendingAmount),
      icon: <Clock className="h-6 w-6 text-red-600" />,
      color: 'bg-red-50',
    },
  ];

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setDateRange(customStartDate, customEndDate);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">经营统计</h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(dateRange.start), 'yyyy年MM月dd日', {
              locale: zhCN,
            })}{' '}
            -{' '}
            {format(new Date(dateRange.end), 'yyyy年MM月dd日', {
              locale: zhCN,
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRangeType)}
            options={TIME_RANGE_OPTIONS}
            wrapperClassName="w-full sm:w-40"
          />
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">至</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button size="sm" onClick={handleCustomDateApply}>
                <Calendar className="h-4 w-4" />
                应用
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>顾问转化率排名</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                加载中...
              </div>
            ) : (
              <ConversionChart data={conversionRates} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              <CardTitle>客户来源分析</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center text-gray-500">
                加载中...
              </div>
            ) : (
              <SourceAnalysisChart data={sourceAnalysis} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <CardTitle>意向课程统计</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={courseStats.filter((c) => c.intendedCount > 0)}
            columns={courseColumns}
            pageSize={5}
            loading={loading}
            emptyMessage="暂无课程数据"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-indigo-500" />
            <CardTitle>业绩趋势图</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              加载中...
            </div>
          ) : (
            <PerformanceChart data={performanceData} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-500" />
            <CardTitle>客户阶段分布</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              加载中...
            </div>
          ) : (
            <StageDistributionChart data={stageDistribution} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle>转化漏斗</CardTitle>
            </div>
            {selectedConsultant && (
              <Badge variant="primary">
                已筛选顾问
                <button
                  onClick={() => setSelectedConsultant(null)}
                  className="ml-2 hover:text-white/80"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              加载中...
            </div>
          ) : (
            <FunnelChart data={funnelData} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-500" />
            <CardTitle>顾问任务完成情况（本周）</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={consultantTaskStats}
            columns={consultantTaskColumns}
            pageSize={5}
            loading={loading}
            emptyMessage="暂无顾问数据"
          />
        </CardContent>
      </Card>
    </div>
  );
}
