import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useCustomerStore } from '@/store/customerStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useStatisticsStore } from '@/store/statisticsStore';
import { initializeMockData } from '@/data/mockData';

export default function AppLayout() {
  const loadCustomerData = useCustomerStore((state) => state.loadData);
  const loadScheduleData = useScheduleStore((state) => state.loadScheduleData);
  const loadStatisticsData = useStatisticsStore((state) => state.loadStatisticsData);

  useEffect(() => {
    initializeMockData();
    loadCustomerData();
    loadScheduleData();
    loadStatisticsData();
  }, [loadCustomerData, loadScheduleData, loadStatisticsData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
