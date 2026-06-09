export type CustomerStage = 'lead' | 'consulting' | 'audition' | 'quotation' | 'closed' | 'lost';

export type CustomerSource = 'online' | 'offline' | 'referral' | 'sem' | 'social' | 'other';

export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type CommunicationType = 'phone' | 'wechat' | 'meeting' | 'other';

export type TaskType = 'phone_followup' | 'audition_confirm' | 'quotation_followup' | 'contract_payment' | 'general';

export type TaskSource = 'manual' | 'auto_audition' | 'auto_contract' | 'auto_followup';

export type AuditionStatus = 'scheduled' | 'completed' | 'cancelled';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type ContractStatus = 'draft' | 'signed' | 'completed' | 'cancelled';

export type UserRole = 'admin' | 'consultant' | 'manager';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  source: CustomerSource;
  intendedCourse: string;
  stage: CustomerStage;
  consultantId: string;
  tags: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  isDuplicate: boolean;
  duplicateWith?: string;
}

export interface Communication {
  id: string;
  customerId: string;
  type: CommunicationType;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  consultantId?: string;
  remindAt: string;
  content: string;
  completed: boolean;
  priority: Priority;
}

export interface Audition {
  id: string;
  customerId: string;
  consultantId?: string;
  course: string;
  auditionAt: string;
  teacher: string;
  feedback: string;
  status: AuditionStatus;
  location?: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  course: string;
  amount: number;
  discount: string;
  createdAt: string;
  status: QuotationStatus;
}

export interface Contract {
  id: string;
  customerId: string;
  contractNo: string;
  course: string;
  totalAmount: number;
  receivedAmount: number;
  signDate: string;
  status: ContractStatus;
}

export interface Task {
  id: string;
  customerId: string;
  consultantId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  type: TaskType;
  source: TaskSource;
  relatedId?: string;
}

export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  conversionRate: number;
}

export interface CustomerFilters {
  search: string;
  source: CustomerSource | '';
  intendedCourse: string;
  stage: CustomerStage | '';
  consultantId: string;
  startDate: string;
  endDate: string;
}

export interface StageColumn {
  id: CustomerStage;
  title: string;
  color: string;
  bgColor: string;
}

export const STAGE_COLUMNS: StageColumn[] = [
  { id: 'lead', title: '线索', color: '#6B7280', bgColor: '#F3F4F6' },
  { id: 'consulting', title: '咨询中', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'audition', title: '已试听', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'quotation', title: '已报价', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'closed', title: '已成交', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'lost', title: '已流失', color: '#EF4444', bgColor: '#FEE2E2' },
];

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string; color: string; icon: string }[] = [
  { value: 'phone_followup', label: '电话跟进', color: '#3B82F6', icon: '📞' },
  { value: 'audition_confirm', label: '试听确认', color: '#8B5CF6', icon: '🎯' },
  { value: 'quotation_followup', label: '报价跟进', color: '#F59E0B', icon: '📋' },
  { value: 'contract_payment', label: '合同回款', color: '#10B981', icon: '💰' },
  { value: 'general', label: '其他任务', color: '#6B7280', icon: '📌' },
];

export const TASK_SOURCE_LABELS: Record<TaskSource, string> = {
  manual: '手动添加',
  auto_audition: '试听安排',
  auto_contract: '合同回款',
  auto_followup: '跟进提醒',
};

export const SOURCE_OPTIONS: { value: CustomerSource; label: string }[] = [
  { value: 'online', label: '线上推广' },
  { value: 'offline', label: '线下活动' },
  { value: 'referral', label: '老学员推荐' },
  { value: 'sem', label: '搜索引擎' },
  { value: 'social', label: '社交媒体' },
  { value: 'other', label: '其他渠道' },
];

export const COURSE_OPTIONS = [
  '少儿编程启蒙班',
  'Python进阶班',
  'Web前端开发班',
  'UI/UX设计班',
  '机器人编程班',
  '人工智能基础班',
  '信息学奥赛班',
  '创意美术班',
  '英语口语班',
  '数学思维班',
];

export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '高优先级', color: '#EF4444' },
  { value: 'medium', label: '中优先级', color: '#F59E0B' },
  { value: 'low', label: '低优先级', color: '#10B981' },
];

export const COMMUNICATION_TYPE_OPTIONS: { value: CommunicationType; label: string; icon: string }[] = [
  { value: 'phone', label: '电话', icon: 'phone' },
  { value: 'wechat', label: '微信', icon: 'message-circle' },
  { value: 'meeting', label: '面谈', icon: 'users' },
  { value: 'other', label: '其他', icon: 'more-horizontal' },
];
