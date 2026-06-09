import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Calendar,
  FileText,
  Clock,
  DollarSign,
  Tag,
  Plus,
  X,
  ArrowLeft,
  User,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Check,
  ChevronDown,
  MoreHorizontal,
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
import { useForm } from 'react-hook-form';
import { useCustomerStore } from '../../store/customerStore';
import {
  STAGE_COLUMNS,
  SOURCE_OPTIONS,
  COURSE_OPTIONS,
  PRIORITY_OPTIONS,
  COMMUNICATION_TYPE_OPTIONS,
} from '../../types';
import type {
  Communication,
  FollowUp,
  Audition,
  Quotation,
  Contract,
  CommunicationType,
  Priority,
  AuditionStatus,
  QuotationStatus,
  ContractStatus,
} from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type TabType = 'communications' | 'followups' | 'auditions' | 'quotations' | 'contracts';

type ModalType = 'communication' | 'followup' | 'audition' | 'quotation' | 'contract' | null;

interface CommunicationFormData {
  type: CommunicationType;
  content: string;
}

interface FollowUpFormData {
  remindAt: string;
  content: string;
  priority: Priority;
}

interface AuditionFormData {
  course: string;
  auditionAt: string;
  teacher: string;
}

interface QuotationFormData {
  course: string;
  amount: number;
  discount: string;
  status: QuotationStatus;
}

interface ContractFormData {
  contractNo: string;
  course: string;
  totalAmount: number;
  receivedAmount: number;
  signDate: string;
  status: ContractStatus;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const getCommunicationIcon = (type: CommunicationType) => {
  const option = COMMUNICATION_TYPE_OPTIONS.find((opt) => opt.value === type);
  switch (option?.icon) {
    case 'phone':
      return <Phone className="w-4 h-4" />;
    case 'message-circle':
      return <MessageCircle className="w-4 h-4" />;
    case 'users':
      return <User className="w-4 h-4" />;
    default:
      return <MoreHorizontal className="w-4 h-4" />;
  }
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getCustomerById,
    getCustomerCommunications,
    getCustomerFollowUps,
    getCustomerAuditions,
    getCustomerQuotations,
    getCustomerContracts,
    consultants,
    addCommunication,
    addFollowUp,
    addAudition,
    addQuotation,
    addContract,
    updateFollowUp,
    updateAudition,
    updateQuotation,
    updateContract,
    loadData,
  } = useCustomerStore();

  const [activeTab, setActiveTab] = useState<TabType>('communications');
  const [showModal, setShowModal] = useState<ModalType>(null);

  const customer = id ? getCustomerById(id) : undefined;
  const communications = id ? getCustomerCommunications(id) : [];
  const followUps = id ? getCustomerFollowUps(id) : [];
  const auditions = id ? getCustomerAuditions(id) : [];
  const quotations = id ? getCustomerQuotations(id) : [];
  const contracts = id ? getCustomerContracts(id) : [];
  const consultant = consultants.find((c) => c.id === customer?.consultantId);

  const communicationForm = useForm<CommunicationFormData>({
    defaultValues: { type: 'phone', content: '' },
  });

  const followUpForm = useForm<FollowUpFormData>({
    defaultValues: { remindAt: '', content: '', priority: 'medium' },
  });

  const auditionForm = useForm<AuditionFormData>({
    defaultValues: { course: '', auditionAt: '', teacher: '' },
  });

  const quotationForm = useForm<QuotationFormData>({
    defaultValues: { course: '', amount: 0, discount: '', status: 'draft' },
    mode: 'onChange',
  });

  const contractForm = useForm<ContractFormData>({
    defaultValues: {
      contractNo: '',
      course: '',
      totalAmount: 0,
      receivedAmount: 0,
      signDate: '',
      status: 'draft',
    },
    mode: 'onChange',
  });

  const [quotationErrors, setQuotationErrors] = useState<{ amount?: string }>({});
  const [contractErrors, setContractErrors] = useState<{
    totalAmount?: string;
    receivedAmount?: string;
  }>({});

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey, id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCommunication = (data: CommunicationFormData) => {
    if (!id) return;
    const newCommunication: Communication = {
      id: generateId(),
      customerId: id,
      type: data.type,
      content: data.content,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    };
    addCommunication(newCommunication);
    setShowModal(null);
    communicationForm.reset();
  };

  const handleAddFollowUp = (data: FollowUpFormData) => {
    if (!id) return;
    const newFollowUp: FollowUp = {
      id: generateId(),
      customerId: id,
      remindAt: new Date(data.remindAt).toISOString(),
      content: data.content,
      completed: false,
      priority: data.priority,
    };
    addFollowUp(newFollowUp);
    setShowModal(null);
    followUpForm.reset();
  };

  const handleAddAudition = (data: AuditionFormData) => {
    if (!id) return;
    const newAudition: Audition = {
      id: generateId(),
      customerId: id,
      course: data.course,
      auditionAt: new Date(data.auditionAt).toISOString(),
      teacher: data.teacher,
      feedback: '',
      status: 'scheduled',
    };
    addAudition(newAudition);
    setShowModal(null);
    auditionForm.reset();
  };

  const validateQuotation = (data: QuotationFormData): boolean => {
    const errors: { amount?: string } = {};
    
    if (!data.amount || data.amount <= 0) {
      errors.amount = '报价金额必须大于0';
    } else if (isNaN(data.amount)) {
      errors.amount = '请输入有效的金额';
    }
    
    setQuotationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContract = (data: ContractFormData): boolean => {
    const errors: { totalAmount?: string; receivedAmount?: string } = {};
    
    if (!data.totalAmount || data.totalAmount <= 0) {
      errors.totalAmount = '合同金额必须大于0';
    } else if (isNaN(data.totalAmount)) {
      errors.totalAmount = '请输入有效的金额';
    }
    
    if (data.receivedAmount === undefined || data.receivedAmount < 0) {
      errors.receivedAmount = '已收金额不能为负数';
    } else if (isNaN(data.receivedAmount)) {
      errors.receivedAmount = '请输入有效的金额';
    } else if (data.receivedAmount > data.totalAmount) {
      errors.receivedAmount = '已收金额不能大于合同金额';
    }
    
    setContractErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddQuotation = (data: QuotationFormData) => {
    if (!id) return;
    if (!validateQuotation(data)) return;
    
    const newQuotation: Quotation = {
      id: generateId(),
      customerId: id,
      course: data.course,
      amount: data.amount,
      discount: data.discount,
      status: data.status,
      createdAt: new Date().toISOString(),
    };
    addQuotation(newQuotation);
    setShowModal(null);
    quotationForm.reset();
    setQuotationErrors({});
  };

  const handleAddContract = (data: ContractFormData) => {
    if (!id) return;
    if (!validateContract(data)) return;
    
    const clampedReceived = Math.max(0, Math.min(data.receivedAmount, data.totalAmount));
    
    const newContract: Contract = {
      id: generateId(),
      customerId: id,
      contractNo: data.contractNo,
      course: data.course,
      totalAmount: data.totalAmount,
      receivedAmount: clampedReceived,
      signDate: new Date(data.signDate).toISOString(),
      status: data.status,
    };
    addContract(newContract);
    setShowModal(null);
    contractForm.reset();
    setContractErrors({});
  };

  const getAuditionStatusLabel = (status: AuditionStatus) => {
    const statusMap = {
      scheduled: { label: '已安排', className: 'bg-blue-50 text-blue-700' },
      completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
    };
    return statusMap[status];
  };

  const getQuotationStatusLabel = (status: QuotationStatus) => {
    const statusMap = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      sent: { label: '已发送', className: 'bg-blue-50 text-blue-700' },
      accepted: { label: '已接受', className: 'bg-green-50 text-green-700' },
      rejected: { label: '已拒绝', className: 'bg-red-50 text-red-700' },
    };
    return statusMap[status];
  };

  const getContractStatusLabel = (status: ContractStatus) => {
    const statusMap = {
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-600' },
      signed: { label: '已签署', className: 'bg-blue-50 text-blue-700' },
      completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
      cancelled: { label: '已取消', className: 'bg-red-50 text-red-700' },
    };
    return statusMap[status];
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">客户不存在</p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const sourceLabel = SOURCE_OPTIONS.find((s) => s.value === customer.source);
  const stageInfo = STAGE_COLUMNS.find((s) => s.id === customer.stage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                  {customer.isDuplicate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                      <AlertTriangle className="w-3 h-3" />
                      重复手机号
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{sourceLabel?.label || customer.source}</span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {stageInfo && (
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: stageInfo.bgColor, color: stageInfo.color }}
                  >
                    {stageInfo.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  {customer.intendedCourse}
                </span>
                {consultant && (
                  <span className="inline-flex items-center gap-1 text-gray-600 text-sm">
                    <User className="w-4 h-4" />
                    {consultant.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {customer.tags.map((tag) => (
                  <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowModal('communication')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                添加沟通
              </button>
              <button
                onClick={() => setShowModal('followup')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
                设置提醒
              </button>
              <button
                onClick={() => setShowModal('audition')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                安排试听
              </button>
              <button
                onClick={() => setShowModal('quotation')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                生成报价
              </button>
              <button
                onClick={() => setShowModal('contract')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                登记合同
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <TabGroup
            selectedIndex={['communications', 'followups', 'auditions', 'quotations', 'contracts'].indexOf(activeTab)}
            onChange={(index) => {
              const tabs: TabType[] = ['communications', 'followups', 'auditions', 'quotations', 'contracts'];
              setActiveTab(tabs[index]);
            }}
          >
            <TabList className="flex border-b border-gray-100 px-4">
              <Tab className="px-4 py-3 text-sm font-medium text-gray-500 data-[selected]:text-blue-600 data-[selected]:border-b-2 data-[selected]:border-blue-600 data-[selected]:font-semibold transition-colors">
                沟通记录 ({communications.length})
              </Tab>
              <Tab className="px-4 py-3 text-sm font-medium text-gray-500 data-[selected]:text-blue-600 data-[selected]:border-b-2 data-[selected]:border-blue-600 data-[selected]:font-semibold transition-colors">
                跟进提醒 ({followUps.length})
              </Tab>
              <Tab className="px-4 py-3 text-sm font-medium text-gray-500 data-[selected]:text-blue-600 data-[selected]:border-b-2 data-[selected]:border-blue-600 data-[selected]:font-semibold transition-colors">
                试听安排 ({auditions.length})
              </Tab>
              <Tab className="px-4 py-3 text-sm font-medium text-gray-500 data-[selected]:text-blue-600 data-[selected]:border-b-2 data-[selected]:border-blue-600 data-[selected]:font-semibold transition-colors">
                报价单 ({quotations.length})
              </Tab>
              <Tab className="px-4 py-3 text-sm font-medium text-gray-500 data-[selected]:text-blue-600 data-[selected]:border-b-2 data-[selected]:border-blue-600 data-[selected]:font-semibold transition-colors">
                合同回款 ({contracts.length})
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel className="p-6">
                {communications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无沟通记录</p>
                    <button
                      onClick={() => setShowModal('communication')}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      添加第一条沟通记录
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-6">
                      {communications.map((comm) => {
                        const typeOption = COMMUNICATION_TYPE_OPTIONS.find((opt) => opt.value === comm.type);
                        return (
                          <div key={comm.id} className="relative pl-10">
                            <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500">
                              {getCommunicationIcon(comm.type)}
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {typeOption?.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {format(
                                      new Date(comm.createdAt),
                                      'yyyy-MM-dd HH:mm',
                                      { locale: zhCN }
                                    )}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-700">{comm.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabPanel>

              <TabPanel className="p-6">
                {followUps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无跟进提醒</p>
                    <button
                      onClick={() => setShowModal('followup')}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      设置第一条提醒
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followUps.map((fu) => {
                      const priority = PRIORITY_OPTIONS.find((p) => p.value === fu.priority);
                      const isOverdue = new Date(fu.remindAt) < new Date() && !fu.completed;
                      return (
                        <div
                          key={fu.id}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-lg border',
                            fu.completed
                              ? 'bg-gray-50 border-gray-200'
                              : isOverdue
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-gray-200'
                          )}
                        >
                          <button
                            onClick={() =>
                              updateFollowUp(fu.id, { completed: !fu.completed })
                            }
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                              fu.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-blue-500'
                            )}
                          >
                            {fu.completed && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  fu.completed ? 'text-gray-500 line-through'
                                    : 'text-gray-900'
                                )}
                              >
                                {fu.content}
                              </span>
                              {priority && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${priority.color}15`,
                                    color: priority.color,
                                  }}
                                >
                                  {priority.label}
                                </span>
                              )}
                              {isOverdue && (
                                <span className="text-xs text-red-600 font-medium">已逾期</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <CalendarIcon className="w-3 h-3" />
                              {format(
                                new Date(fu.remindAt),
                                'yyyy-MM-dd HH:mm',
                                { locale: zhCN }
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabPanel>

              <TabPanel className="p-6">
                {auditions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无试听安排</p>
                    <button
                      onClick={() => setShowModal('audition')}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      安排第一次试听
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {auditions.map((audition) => {
                  const status = getAuditionStatusLabel(audition.status);
                  return (
                    <div
                      key={audition.id}
                      className="p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{audition.course}</h4>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {format(
                                new Date(audition.auditionAt),
                                'yyyy-MM-dd HH:mm',
                                { locale: zhCN }
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {audition.teacher}
                            </span>
                          </div>
                          {audition.feedback && (
                            <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                              {audition.feedback}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      {audition.status === 'scheduled' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() =>
                              updateAudition(audition.id, { status: 'completed' })
                            }
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            标记完成
                          </button>
                          <button
                            onClick={() =>
                              updateAudition(audition.id, { status: 'cancelled' })
                            }
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                          >
                            取消
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabPanel>

          <TabPanel className="p-6">
            {quotations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无报价单</p>
                <button
                  onClick={() => setShowModal('quotation')}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  生成第一份报价
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotations.map((quote) => {
                  const status = getQuotationStatusLabel(quote.status);
                  return (
                    <div
                      key={quote.id}
                      className="p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{quote.course}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="text-lg font-bold text-emerald-600">
                              ¥{quote.amount.toLocaleString()}
                            </span>
                            {quote.discount && (
                              <span className="text-amber-600">{quote.discount}</span>
                            )}
                            <span>
                              {format(
                                new Date(quote.createdAt),
                                'yyyy-MM-dd',
                                { locale: zhCN }
                              )}
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      {quote.status === 'draft' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() =>
                              updateQuotation(quote.id, { status: 'sent' })
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            标记已发送
                          </button>
                        </div>
                      )}
                      {quote.status === 'sent' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() =>
                              updateQuotation(quote.id, { status: 'accepted' })
                            }
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            标记已接受
                          </button>
                          <button
                            onClick={() =>
                              updateQuotation(quote.id, { status: 'rejected' })
                            }
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            标记已拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabPanel>

          <TabPanel className="p-6">
            {contracts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无合同</p>
                <button
                  onClick={() => setShowModal('contract')}
                  className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  登记第一份合同
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => {
                  const status = getContractStatusLabel(contract.status);
                  const progress = contract.totalAmount > 0 
                    ? Math.max(0, Math.min(100, (contract.receivedAmount / contract.totalAmount) * 100)) 
                    : 0;
                  return (
                    <div
                      key={contract.id}
                      className="p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {contract.contractNo}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {contract.course}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              合同金额:
                              <span className="font-bold text-emerald-600">
                                ¥{contract.totalAmount.toLocaleString()}
                              </span>
                            </span>
                            <span>
                              已回款:
                              <span className="font-bold text-blue-600">
                                ¥{contract.receivedAmount.toLocaleString()}
                              </span>
                            </span>
                            <span>
                              签约日期:
                              {format(
                                new Date(contract.signDate),
                                'yyyy-MM-dd',
                                { locale: zhCN }
                              )}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>回款进度</span>
                              <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      {contract.status === 'signed' && progress < 100 && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() =>
                              updateContract(contract.id, { status: 'completed' })
                            }
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            标记已完成
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
    </div>

      <Dialog
        open={showModal !== null}
        onClose={() => setShowModal(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {showModal === 'communication' && '添加沟通记录'}
                {showModal === 'followup' && '设置跟进提醒'}
                {showModal === 'audition' && '安排试听'}
                {showModal === 'quotation' && '生成报价单'}
                {showModal === 'contract' && '登记合同'}
              </DialogTitle>
              <button
                onClick={() => setShowModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {showModal === 'communication' && (
                <form
                  onSubmit={communicationForm.handleSubmit(handleAddCommunication)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      沟通方式
                    </label>
                    <select
                      {...communicationForm.register('type')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COMMUNICATION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      沟通内容
                    </label>
                    <textarea
                      {...communicationForm.register('content', {
                        required: true,
                      })}
                      rows={4}
                      placeholder="请输入沟通内容..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}

              {showModal === 'followup' && (
                <form
                  onSubmit={followUpForm.handleSubmit(handleAddFollowUp)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      提醒时间
                    </label>
                    <input
                      type="datetime-local"
                      {...followUpForm.register('remindAt', {
                        required: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      提醒内容
                    </label>
                    <input
                      type="text"
                      {...followUpForm.register('content', {
                        required: true,
                      })}
                      placeholder="请输入提醒内容..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      优先级
                    </label>
                    <select
                      {...followUpForm.register('priority')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}

              {showModal === 'audition' && (
                <form
                  onSubmit={auditionForm.handleSubmit(handleAddAudition)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      试听课程
                    </label>
                    <select
                      {...auditionForm.register('course', { required: true })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择课程</option>
                      {COURSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      试听时间
                    </label>
                    <input
                      type="datetime-local"
                      {...auditionForm.register('auditionAt', {
                        required: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      授课老师
                    </label>
                    <input
                      type="text"
                      {...auditionForm.register('teacher', {
                        required: true,
                      })}
                      placeholder="请输入老师姓名..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}

              {showModal === 'quotation' && (
                <form
                  onSubmit={quotationForm.handleSubmit(handleAddQuotation)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      课程名称
                    </label>
                    <select
                      {...quotationForm.register('course', { required: true })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择课程</option>
                      {COURSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      报价金额
                    </label>
                    <input
                      type="number"
                      {...quotationForm.register('amount', {
                        required: true,
                        valueAsNumber: true,
                        min: 0.01,
                      })}
                      placeholder="请输入金额..."
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                        quotationErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      )}
                    />
                    {quotationErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">{quotationErrors.amount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      优惠折扣
                    </label>
                    <input
                      type="text"
                      {...quotationForm.register('discount')}
                      placeholder="如：9折、立减500..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      状态
                    </label>
                    <select
                      {...quotationForm.register('status')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">草稿</option>
                      <option value="sent">已发送</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}

              {showModal === 'contract' && (
                <form
                  onSubmit={contractForm.handleSubmit(handleAddContract)}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      合同编号
                    </label>
                    <input
                      type="text"
                      {...contractForm.register('contractNo', {
                      required: true,
                    })}
                      placeholder="如：HT20240001"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      课程名称
                    </label>
                    <select
                      {...contractForm.register('course', { required: true })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择课程</option>
                      {COURSE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        合同金额
                      </label>
                      <input
                        type="number"
                        {...contractForm.register('totalAmount', {
                          required: true,
                          valueAsNumber: true,
                          min: 0.01,
                        })}
                        placeholder="总金额"
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                          contractErrors.totalAmount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        )}
                      />
                      {contractErrors.totalAmount && (
                        <p className="mt-1 text-sm text-red-600">{contractErrors.totalAmount}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        已收金额
                      </label>
                      <input
                        type="number"
                        {...contractForm.register('receivedAmount', {
                          required: true,
                          valueAsNumber: true,
                          min: 0,
                        })}
                        placeholder="已回款"
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                          contractErrors.receivedAmount ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        )}
                      />
                      {contractErrors.receivedAmount && (
                        <p className="mt-1 text-sm text-red-600">{contractErrors.receivedAmount}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        签约日期
                      </label>
                      <input
                        type="date"
                        {...contractForm.register('signDate', {
                          required: true,
                        })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        状态
                      </label>
                      <select
                        {...contractForm.register('status')}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">草稿</option>
                        <option value="signed">已签署</option>
                        <option value="completed">已完成</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </form>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
