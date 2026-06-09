import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Download,
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Phone,
  User,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react';
import { useCustomerStore } from '../../store/customerStore';
import type { Customer } from '../../types';
import {
  STAGE_COLUMNS,
  SOURCE_OPTIONS,
  COURSE_OPTIONS,
} from '../../types';
import {
  importCustomersFromExcel,
  exportCustomersToExcel,
  downloadTemplate,
} from '../../utils/excel';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ImportResult {
  success: Customer[];
  duplicates: { row: number; phone: string; existingName: string }[];
  errors: { row: number; message: string }[];
}

const columnHelper = createColumnHelper<Customer>();

export default function CustomerList() {
  const navigate = useNavigate();
  const {
    customers,
    consultants,
    filters,
    setFilters,
    resetFilters,
    getFilteredCustomers,
    getExistingPhones,
    bulkAddCustomers,
    loadData,
  } = useCustomerStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCustomers = useMemo(() => getFilteredCustomers(), [customers, filters, getFilteredCustomers]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'avatar',
        header: '',
        cell: ({ row }) => (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {row.original.name.charAt(0)}
          </div>
        ),
        size: 56,
      }),
      columnHelper.accessor('name', {
        header: '客户姓名',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{row.original.name}</span>
            {row.original.isDuplicate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                <AlertTriangle className="w-3 h-3" />
                重复
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('phone', {
        header: '手机号',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4" />
            {row.original.phone}
          </div>
        ),
      }),
      columnHelper.accessor('source', {
        header: '来源',
        cell: ({ row }) => {
          const source = SOURCE_OPTIONS.find((s) => s.value === row.original.source);
          return <span className="text-gray-600">{source?.label || row.original.source}</span>;
        },
      }),
      columnHelper.accessor('intendedCourse', {
        header: '意向课程',
        cell: ({ row }) => (
          <span className="text-gray-600 truncate max-w-[160px] block">{row.original.intendedCourse}</span>
        ),
      }),
      columnHelper.accessor('stage', {
        header: '阶段',
        cell: ({ row }) => {
          const stage = STAGE_COLUMNS.find((s) => s.id === row.original.stage);
          return stage ? (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: stage.bgColor, color: stage.color }}
            >
              {stage.title}
            </span>
          ) : null;
        },
      }),
      columnHelper.accessor('consultantId', {
        header: '负责顾问',
        cell: ({ row }) => {
          const consultant = consultants.find((c) => c.id === row.original.consultantId);
          return <span className="text-gray-600">{consultant?.name || '未分配'}</span>;
        },
      }),
      columnHelper.accessor('status', {
        header: '状态',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              row.original.status === 'active'
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-100 text-gray-500'
            )}
          >
            {row.original.status === 'active' ? '活跃' : '已流失'}
          </span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: '创建时间',
        cell: ({ row }) => (
          <span className="text-gray-500 text-sm">
            {format(new Date(row.original.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/customers/${row.original.id}`)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
        size: 56,
      }),
    ],
    [consultants, navigate]
  );

  const table = useReactTable({
    data: filteredCustomers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImporting(true);
    setImportResult(null);

    try {
      const existingPhones = getExistingPhones();
      const result = await importCustomersFromExcel(file, existingPhones);
      setImportResult(result);
    } catch (error) {
      console.error('导入失败:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.success.length) {
      bulkAddCustomers(importResult.success);
    }
    setShowImportModal(false);
    setImportResult(null);
    setSelectedFile(null);
  };

  const handleExport = () => {
    exportCustomersToExcel(filteredCustomers, consultants);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">客户列表</h1>
          <p className="text-gray-500 mt-1">共 {filteredCustomers.length} 条客户记录</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  导入客户
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              </div>

              <div className="flex-1 min-w-[300px] max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索客户姓名、手机号..."
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
                  showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4" />
                筛选
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
                  <select
                    value={filters.source}
                    onChange={(e) => setFilters({ source: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部来源</option>
                    {SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">意向课程</label>
                  <select
                    value={filters.intendedCourse}
                    onChange={(e) => setFilters({ intendedCourse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部课程</option>
                    {COURSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户阶段</label>
                  <select
                    value={filters.stage}
                    onChange={(e) => setFilters({ stage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部阶段</option>
                    {STAGE_COLUMNS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">负责顾问</label>
                  <select
                    value={filters.consultantId}
                    onChange={(e) => setFilters({ consultantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部顾问</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    重置筛选
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              显示 {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredCustomers.length
              )}{' '}
              条，共 {filteredCustomers.length} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showImportModal} onClose={() => setShowImportModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <DialogTitle className="text-lg font-semibold text-gray-900">导入客户</DialogTitle>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  下载导入模板
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={importing}
                />
                <label
                  htmlFor="file-upload"
                  className={cn(
                    'cursor-pointer inline-flex flex-col items-center',
                    importing && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">
                    {selectedFile ? selectedFile.name : '点击选择文件或拖拽到此处'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">支持 .xlsx, .xls, .csv 格式</p>
                </label>
              </div>

              {importing && (
                <div className="mt-4 text-center text-gray-600">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                  正在处理文件...
                </div>
              )}

              {importResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">成功: {importResult.success.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-amber-700">重复: {importResult.duplicates.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">错误: {importResult.errors.length}</span>
                    </div>
                  </div>

                  {importResult.duplicates.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">重复记录</p>
                      <ul className="text-sm text-amber-700 space-y-1 max-h-24 overflow-y-auto">
                        {importResult.duplicates.map((d, i) => (
                          <li key={i}>
                            第 {d.row} 行: {d.phone} ({d.existingName})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-2">错误记录</p>
                      <ul className="text-sm text-red-700 space-y-1 max-h-24 overflow-y-auto">
                        {importResult.errors.map((e, i) => (
                          <li key={i}>
                            第 {e.row} 行: {e.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importResult?.success.length}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认导入 {importResult?.success.length ? `(${importResult.success.length}条)` : ''}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
