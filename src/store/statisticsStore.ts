import { create } from 'zustand';
import type { Customer, Contract, Consultant, CustomerSource, CustomerStage } from '../types';
import { SOURCE_OPTIONS, COURSE_OPTIONS, STAGE_COLUMNS } from '../types';
import { useCustomerStore } from './customerStore';
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export interface ConversionRateData {
  consultantId: string;
  consultantName: string;
  totalLeads: number;
  closedDeals: number;
  conversionRate: number;
  rank: number;
}

export interface SourceAnalysisData {
  source: CustomerSource;
  sourceName: string;
  count: number;
  closedCount: number;
  conversionRate: number;
  percentage: number;
}

export interface CourseStatsData {
  course: string;
  intendedCount: number;
  closedCount: number;
  conversionRate: number;
  totalRevenue: number;
}

export interface PerformanceData {
  month: string;
  contractAmount: number;
  receivedAmount: number;
  contractCount: number;
  newCustomers: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  conversionRate: number;
  color: string;
}

export interface ConsultantTaskStats {
  consultantId: string;
  consultantName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface StatisticsState {
  loading: boolean;
  error: string | null;
  dateRange: { start: string; end: string };
  setDateRange: (start: string, end: string) => void;
  loadStatisticsData: () => void;
  getSourceData: () => {
    customers: Customer[];
    contracts: Contract[];
    consultants: Consultant[];
  };
  getConversionRates: () => ConversionRateData[];
  getSourceAnalysis: () => SourceAnalysisData[];
  getCourseStats: () => CourseStatsData[];
  getPerformanceData: (months?: number) => PerformanceData[];
  getOverallStats: () => {
    totalCustomers: number;
    totalRevenue: number;
    totalReceived: number;
    overallConversionRate: number;
    avgContractAmount: number;
    pendingAmount: number;
  };
  getStageDistribution: () => Record<CustomerStage, { count: number; percentage: number }>;
  getFunnelData: () => FunnelData[];
  getConsultantTaskStats: () => ConsultantTaskStats[];
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  loading: false,
  error: null,
  dateRange: {
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  },

  setDateRange: (start, end) => {
    set({ dateRange: { start, end } });
  },

  getSourceData: () => {
    const customerState = useCustomerStore.getState();
    return {
      customers: customerState.customers,
      contracts: customerState.contracts,
      consultants: customerState.consultants,
    };
  },

  loadStatisticsData: () => {
    set({ loading: true });
    try {
      useCustomerStore.getState().loadData();
      set({ loading: false });
    } catch (error) {
      set({ error: '统计数据加载失败', loading: false });
    }
  },

  getConversionRates: () => {
    const { customers, consultants } = get().getSourceData();
    
    const conversionRates = consultants
      .filter((c) => c.role !== 'admin')
      .map((consultant) => {
        const consultantCustomers = customers.filter(
          (c) => c.consultantId === consultant.id
        );
        const totalLeads = consultantCustomers.length;
        const closedDeals = consultantCustomers.filter(
          (c) => c.stage === 'closed'
        ).length;
        const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;

        return {
          consultantId: consultant.id,
          consultantName: consultant.name,
          totalLeads,
          closedDeals,
          conversionRate: Math.round(conversionRate * 100) / 100,
          rank: 0,
        };
      })
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return conversionRates;
  },

  getSourceAnalysis: () => {
    const { customers } = get().getSourceData();
    const totalCustomers = customers.length;

    return SOURCE_OPTIONS.map((sourceOption) => {
      const sourceCustomers = customers.filter(
        (c) => c.source === sourceOption.value
      );
      const count = sourceCustomers.length;
      const closedCount = sourceCustomers.filter(
        (c) => c.stage === 'closed'
      ).length;
      const conversionRate = count > 0 ? (closedCount / count) * 100 : 0;
      const percentage = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;

      return {
        source: sourceOption.value,
        sourceName: sourceOption.label,
        count,
        closedCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
      };
    });
  },

  getCourseStats: () => {
    const { customers, contracts } = get().getSourceData();

    return COURSE_OPTIONS.map((course) => {
      const intendedCustomers = customers.filter(
        (c) => c.intendedCourse === course
      );
      const intendedCount = intendedCustomers.length;
      const closedCount = intendedCustomers.filter(
        (c) => c.stage === 'closed'
      ).length;
      const conversionRate = intendedCount > 0 ? (closedCount / intendedCount) * 100 : 0;

      const courseContracts = contracts.filter((c) => c.course === course);
      const totalRevenue = courseContracts.reduce(
        (sum, c) => sum + c.totalAmount,
        0
      );

      return {
        course,
        intendedCount,
        closedCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue,
      };
    }).sort((a, b) => b.intendedCount - a.intendedCount);
  },

  getPerformanceData: (months = 6) => {
    const { contracts, customers } = get().getSourceData();
    const performance: PerformanceData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');

      const monthContracts = contracts.filter((c) => {
        const signDate = new Date(c.signDate);
        return signDate >= monthStart && signDate <= monthEnd;
      });

      const monthNewCustomers = customers.filter((c) => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });

      performance.push({
        month: monthKey,
        contractAmount: monthContracts.reduce((sum, c) => sum + c.totalAmount, 0),
        receivedAmount: monthContracts.reduce((sum, c) => sum + c.receivedAmount, 0),
        contractCount: monthContracts.length,
        newCustomers: monthNewCustomers.length,
      });
    }

    return performance;
  },

  getOverallStats: () => {
    const { customers, contracts } = get().getSourceData();
    const { dateRange } = get();
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const filteredCustomers = customers.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const filteredContracts = contracts.filter((c) => {
      const signDate = new Date(c.signDate);
      return signDate >= startDate && signDate <= endDate;
    });

    const totalCustomers = filteredCustomers.length;
    const closedCustomers = filteredCustomers.filter(
      (c) => c.stage === 'closed'
    ).length;
    const totalRevenue = filteredContracts.reduce(
      (sum, c) => sum + c.totalAmount,
      0
    );
    const totalReceived = filteredContracts.reduce(
      (sum, c) => sum + c.receivedAmount,
      0
    );
    const overallConversionRate =
      totalCustomers > 0 ? (closedCustomers / totalCustomers) * 100 : 0;
    const avgContractAmount =
      filteredContracts.length > 0
        ? totalRevenue / filteredContracts.length
        : 0;

    return {
      totalCustomers,
      totalRevenue,
      totalReceived,
      overallConversionRate:
        Math.round(overallConversionRate * 100) / 100,
      avgContractAmount: Math.round(avgContractAmount * 100) / 100,
      pendingAmount: totalRevenue - totalReceived,
    };
  },

  getStageDistribution: () => {
    const { customers } = get().getSourceData();
    const { dateRange } = get();
    const stages: CustomerStage[] = [
      'lead',
      'consulting',
      'audition',
      'quotation',
      'closed',
      'lost',
    ];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const filteredCustomers = customers.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const total = filteredCustomers.length;

    const distribution = {} as Record<
      CustomerStage,
      { count: number; percentage: number }
    >;

    stages.forEach((stage) => {
      const count = filteredCustomers.filter(
        (c) => c.stage === stage
      ).length;
      distribution[stage] = {
        count,
        percentage:
          total > 0 ? Math.round((count / total) * 100) / 100 : 0,
      };
    });

    return distribution;
  },

  getFunnelData: () => {
    const { customers } = get().getSourceData();
    const { dateRange } = get();
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    const filteredCustomers = customers.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const total = filteredCustomers.length;
    const funnelStages = ['lead', 'consulting', 'audition', 'quotation', 'closed'];

    let prevCount = total;
    const funnelData = funnelStages.map((stage, index) => {
      const stageInfo = STAGE_COLUMNS.find((s) => s.id === stage)!;
      const count = filteredCustomers.filter((c) => {
        const stageOrder = funnelStages.indexOf(c.stage);
        return stageOrder >= index;
      }).length;
      const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
      prevCount = count;
      return {
        stage: stageInfo.title,
        count,
        conversionRate: Math.round(conversionRate * 100) / 100,
        color: stageInfo.color,
      };
    });

    return funnelData;
  },

  getConsultantTaskStats: () => {
    const customerState = useCustomerStore.getState();
    const { consultants } = get().getSourceData();
    const { tasks, followUps } = customerState;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const allScheduleItems = [
      ...tasks.map((t) => ({
        id: t.id,
        consultantId: t.consultantId,
        dueDate: t.dueDate,
        status: t.status,
      })),
      ...followUps.filter((f) => !f.completed).map((f) => ({
        id: f.id,
        consultantId: f.consultantId,
        dueDate: f.remindAt,
        status: 'pending' as const,
      })),
    ];

    const stats = consultants
      .filter((c) => c.role !== 'admin')
      .map((consultant) => {
        const consultantItems = allScheduleItems.filter(
          (item) => item.consultantId === consultant.id
        );

        const weekItems = consultantItems.filter((item) => {
          const dueDate = new Date(item.dueDate);
          return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
        });

        const totalTasks = weekItems.length;
        const completedTasks = weekItems.filter((item) => item.status === 'completed').length;
        const pendingTasks = totalTasks - completedTasks;
        const now = new Date();
        const overdueTasks = weekItems.filter(
          (item) => item.status !== 'completed' && new Date(item.dueDate) < now
        ).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          consultantId: consultant.id,
          consultantName: consultant.name,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate: Math.round(completionRate * 100) / 100,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);

    return stats;
  },
}));
