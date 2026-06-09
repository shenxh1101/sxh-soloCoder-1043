import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  RefreshCw,
  LayoutGrid,
  List,
  User,
  BookOpen,
  Tag,
  Clock,
  UserRound,
} from 'lucide-react';
import { useCustomerStore } from '../../store/customerStore';
import type { Customer, CustomerStage, Consultant } from '../../types';
import {
  STAGE_COLUMNS,
  SOURCE_OPTIONS,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { formatDate, isOverdue, getDateLabel } from '../../utils/date';

interface SortableCardProps {
  customer: Customer;
  consultantName: string;
  nextFollowUp: string | null;
  onClick: () => void;
}

function SortableCustomerCard({ customer, consultantName, nextFollowUp, onClick }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const source = SOURCE_OPTIONS.find((s) => s.value === customer.source);
  const isFollowUpOverdue = nextFollowUp ? isOverdue(nextFollowUp) : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all',
        isDragging && 'opacity-50 shadow-lg',
        customer.isDuplicate && 'ring-1 ring-amber-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-xs">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{customer.name}</h4>
            {customer.isDuplicate && (
              <Badge variant="warning" size="sm" dot>
                重复
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-600">
          <BookOpen className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{customer.intendedCourse}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Tag className="w-3.5 h-3.5 text-gray-400" />
          <span>{source?.label || customer.source}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <UserRound className="w-3.5 h-3.5 text-gray-400" />
          <span>{consultantName || '未分配'}</span>
        </div>
        {nextFollowUp && (
          <div className={cn(
            'flex items-center gap-2',
            isFollowUpOverdue ? 'text-red-600' : 'text-gray-600'
          )}>
            <Clock className={cn('w-3.5 h-3.5', isFollowUpOverdue ? 'text-red-400' : 'text-gray-400')} />
            <span>
              {getDateLabel(nextFollowUp)} · {formatDate(nextFollowUp)}
            </span>
          </div>
        )}
        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {customer.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
            {customer.tags.length > 2 && (
              <Badge variant="default" size="sm">
                +{customer.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ColumnProps {
  column: typeof STAGE_COLUMNS[number];
  customers: Customer[];
  consultants: Consultant[];
  getCustomerNextFollowUp: (customerId: string) => string | null;
  onCustomerClick: (customerId: string) => void;
}

function KanbanColumn({ column, customers, consultants, getCustomerNextFollowUp, onCustomerClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const customerIds = customers.map((c) => c.id);

  return (
    <div className="flex-shrink-0 w-72">
      <div
        className="rounded-t-lg px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: column.bgColor }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-medium text-gray-900">{column.title}</h3>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'white', color: column.color }}
        >
          {customers.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-gray-50 rounded-b-lg p-3 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto transition-colors',
          isOver && 'bg-blue-50'
        )}
        data-column-id={column.id}
      >
        <SortableContext items={customerIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {customers.map((customer) => {
              const consultant = consultants.find((c) => c.id === customer.consultantId);
              const nextFollowUp = getCustomerNextFollowUp(customer.id);
              return (
                <SortableCustomerCard
                  key={customer.id}
                  customer={customer}
                  consultantName={consultant?.name || ''}
                  nextFollowUp={nextFollowUp}
                  onClick={() => onCustomerClick(customer.id)}
                />
              );
            })}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function Kanban() {
  const navigate = useNavigate();
  const {
    customers,
    consultants,
    filters,
    setFilters,
    loadData,
    updateCustomerStage,
    getFilteredCustomers,
    getCustomerFollowUps,
  } = useCustomerStore();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredCustomers = useMemo(() => {
    const filtered = getFilteredCustomers();
    if (filters.consultantId) {
      return filtered.filter((c) => c.consultantId === filters.consultantId);
    }
    return filtered;
  }, [customers, filters, getFilteredCustomers, refreshKey]);

  const getCustomerNextFollowUp = (customerId: string): string | null => {
    const followUps = getCustomerFollowUps(customerId);
    const pending = followUps.filter((f) => !f.completed);
    if (pending.length === 0) return null;
    return pending[0].remindAt;
  };

  const customersByStage = useMemo(() => {
    const grouped: Record<CustomerStage, Customer[]> = {
      lead: [],
      consulting: [],
      audition: [],
      quotation: [],
      closed: [],
      lost: [],
    };
    filteredCustomers.forEach((customer) => {
      grouped[customer.stage].push(customer);
    });
    return grouped;
  }, [filteredCustomers]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCustomer = customers.find((c) => c.id === activeId);
    if (!activeCustomer) return;

    let newStage: CustomerStage | null = null;

    const overColumn = STAGE_COLUMNS.find((col) => col.id === overId);
    if (overColumn) {
      newStage = overColumn.id;
    } else {
      const overCustomer = customers.find((c) => c.id === overId);
      if (overCustomer) {
        newStage = overCustomer.stage;
      }
    }

    if (newStage && activeCustomer.stage !== newStage) {
      updateCustomerStage(activeId, newStage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const consultantOptions = [
    { value: '', label: '全部顾问' },
    ...consultants.map((c) => ({ value: c.id, label: c.name })),
  ];

  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1800px] mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">跟进看板</h1>
            <p className="text-gray-500 mt-1">共 {filteredCustomers.length} 条客户记录</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-center py-12 text-gray-500">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>列表视图请前往客户列表页面查看</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => navigate('/customers')}
              >
                前往客户列表
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">跟进看板</h1>
              <p className="text-gray-500 mt-1">共 {filteredCustomers.length} 条客户记录</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 w-64">
              <User className="w-4 h-4 text-gray-400" />
              <Select
                placeholder="选择顾问"
                value={filters.consultantId}
                options={consultantOptions}
                onChange={(value) => setFilters({ consultantId: value })}
                className="flex-1"
              />
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    (viewMode as 'kanban' | 'list') === 'kanban'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                  看板
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    (viewMode as 'kanban' | 'list') === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <List className="w-4 h-4" />
                  列表
                </button>
              </div>

              <Button
                variant="secondary"
                size="md"
                leftIcon={<RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />}
                onClick={handleRefresh}
              >
                刷新
              </Button>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                customers={customersByStage[column.id]}
                consultants={consultants}
                getCustomerNextFollowUp={getCustomerNextFollowUp}
                onCustomerClick={handleCustomerClick}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
