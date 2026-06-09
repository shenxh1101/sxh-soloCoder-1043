import type {
  Customer,
  Communication,
  FollowUp,
  Audition,
  Quotation,
  Contract,
  Task,
  Consultant,
  CustomerStage,
  CustomerSource,
} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const formatDate = (date: Date) => date.toISOString();

const randomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return formatDate(date);
};

const futureDate = (daysAhead: number) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return formatDate(date);
};

export const mockConsultants: Consultant[] = [
  {
    id: 'c1',
    name: '张老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    role: 'manager',
    conversionRate: 42,
  },
  {
    id: 'c2',
    name: '李老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    role: 'consultant',
    conversionRate: 38,
  },
  {
    id: 'c3',
    name: '王老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    role: 'consultant',
    conversionRate: 45,
  },
  {
    id: 'c4',
    name: '赵老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    role: 'consultant',
    conversionRate: 35,
  },
  {
    id: 'c5',
    name: '刘老师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
    role: 'admin',
    conversionRate: 0,
  },
];

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '华', '平'];
const courses = ['少儿编程启蒙班', 'Python进阶班', 'Web前端开发班', 'UI/UX设计班', '机器人编程班', '人工智能基础班', '信息学奥赛班', '创意美术班', '英语口语班', '数学思维班'];
const sources: CustomerSource[] = ['online', 'offline', 'referral', 'sem', 'social', 'other'];
const stages: CustomerStage[] = ['lead', 'consulting', 'audition', 'quotation', 'closed', 'lost'];
const tagOptions = ['家长有意向', '价格敏感', '时间紧张', '需要试听', '对比中', '关注师资', '关注环境', '老学员介绍', '暑假班', '寒假班'];
const communicationTypes = ['phone', 'wechat', 'meeting', 'other'] as const;

const generatePhone = () => {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '182', '183', '184', '187', '188', '135', '136', '137', '156', '157'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
};

const generateName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return firstName + lastName;
};

const generateTags = () => {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...tagOptions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const duplicatePhones = [
  '13812345678',
  '13987654321',
];

export const mockCustomers: Customer[] = Array.from({ length: 55 }, (_, i) => {
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const phone = i < 2 ? duplicatePhones[i] : generatePhone();
  const isDuplicate = i < 2;
  
  return {
    id: `customer-${i + 1}`,
    name: generateName(),
    phone,
    source: sources[Math.floor(Math.random() * sources.length)],
    intendedCourse: courses[Math.floor(Math.random() * courses.length)],
    stage,
    consultantId: `c${Math.floor(Math.random() * 4) + 1}`,
    tags: generateTags(),
    status: 'active',
    createdAt: randomDate(90),
    updatedAt: randomDate(30),
    isDuplicate,
    duplicateWith: isDuplicate ? `customer-${(i % 2) + 1}` : undefined,
  };
});

export const mockCommunications: Communication[] = Array.from({ length: 200 }, (_, i) => ({
  id: `comm-${i + 1}`,
  customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
  type: communicationTypes[Math.floor(Math.random() * communicationTypes.length)],
  content: [
    '家长对课程内容很感兴趣，询问了师资情况和上课时间。',
    '已发送课程介绍资料，家长表示会考虑。',
    '家长担心孩子太小跟不上，已解释课程体系是循序渐进的。',
    '已预约下周试听，家长确认时间可以。',
    '家长询问了价格优惠，已说明老带新活动。',
    '电话沟通后，家长表示需要和孩子商量再决定。',
    '已添加微信，发送了学员作品展示。',
    '面谈很顺利，家长对教学环境很满意。',
    '家长反映距离有点远，已告知有班车服务。',
    '跟进中，家长说等孩子考完试再安排试听。',
  ][Math.floor(Math.random() * 10)],
  createdAt: randomDate(60),
  createdBy: `c${Math.floor(Math.random() * 4) + 1}`,
}));

export const mockFollowUps: FollowUp[] = Array.from({ length: 50 }, (_, i) => ({
  id: `followup-${i + 1}`,
  customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
  remindAt: futureDate(14),
  content: [
    '跟进试听反馈',
    '确认报名意向',
    '发送优惠活动通知',
    '提醒开学时间',
    '回访课程体验',
    '沟通续费事宜',
    '邀请参加公开课',
    '解答家长疑问',
  ][Math.floor(Math.random() * 8)],
  completed: Math.random() > 0.6,
  priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
}));

export const mockAuditions: Audition[] = Array.from({ length: 30 }, (_, i) => ({
  id: `audition-${i + 1}`,
  customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
  course: courses[Math.floor(Math.random() * courses.length)],
  auditionAt: futureDate(21),
  teacher: ['张老师', '李老师', '王老师', '陈老师', '刘老师'][Math.floor(Math.random() * 5)],
  feedback: i < 20 ? [
    '孩子表现很好，课堂参与度高。',
    '基础薄弱，需要加强练习。',
    '接受能力强，可以上进阶班。',
    '注意力不够集中，需要小班教学。',
    '对课程内容很感兴趣，家长也满意。',
  ][Math.floor(Math.random() * 5)] : '',
  status: ['scheduled', 'completed', 'cancelled'][Math.floor(Math.random() * 3)] as 'scheduled' | 'completed' | 'cancelled',
}));

export const mockQuotations: Quotation[] = Array.from({ length: 20 }, (_, i) => ({
  id: `quote-${i + 1}`,
  customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
  course: courses[Math.floor(Math.random() * courses.length)],
  amount: [2980, 3980, 4980, 5980, 7980, 9980, 12800, 15800][Math.floor(Math.random() * 8)],
  discount: Math.random() > 0.5 ? ['9折', '85折', '立减500', '送课时'][Math.floor(Math.random() * 4)] : '',
  createdAt: randomDate(45),
  status: ['draft', 'sent', 'accepted', 'rejected'][Math.floor(Math.random() * 4)] as 'draft' | 'sent' | 'accepted' | 'rejected',
}));

export const mockContracts: Contract[] = Array.from({ length: 15 }, (_, i) => {
  const totalAmount = [4980, 5980, 7980, 9980, 12800, 15800, 19800, 25800][Math.floor(Math.random() * 8)];
  const receivedAmount = Math.floor(totalAmount * (0.5 + Math.random() * 0.5));
  return {
    id: `contract-${i + 1}`,
    customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
    contractNo: `HT${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`,
    course: courses[Math.floor(Math.random() * courses.length)],
    totalAmount,
    receivedAmount,
    signDate: randomDate(60),
    status: receivedAmount >= totalAmount ? 'completed' : ['draft', 'signed', 'completed'][Math.floor(Math.random() * 3)] as 'draft' | 'signed' | 'completed' | 'cancelled',
  };
});

export const mockTasks: Task[] = Array.from({ length: 35 }, (_, i) => ({
  id: `task-${i + 1}`,
  customerId: `customer-${Math.floor(Math.random() * 55) + 1}`,
  consultantId: `c${Math.floor(Math.random() * 4) + 1}`,
  title: [
    '电话回访客户',
    '安排试听课程',
    '发送课程资料',
    '跟进报名意向',
    '沟通课程安排',
    '确认上课时间',
    '发送报价单',
    '跟进合同签署',
    '提醒续费',
    '邀请参加活动',
  ][Math.floor(Math.random() * 10)],
  description: '请及时跟进客户，了解最新意向并做好记录。',
  dueDate: futureDate(7),
  priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
  status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as 'pending' | 'in_progress' | 'completed',
}));

export const initializeMockData = () => {
  if (!localStorage.getItem('crm_initialized')) {
    localStorage.setItem('crm_customers', JSON.stringify(mockCustomers));
    localStorage.setItem('crm_communications', JSON.stringify(mockCommunications));
    localStorage.setItem('crm_followups', JSON.stringify(mockFollowUps));
    localStorage.setItem('crm_auditions', JSON.stringify(mockAuditions));
    localStorage.setItem('crm_quotations', JSON.stringify(mockQuotations));
    localStorage.setItem('crm_contracts', JSON.stringify(mockContracts));
    localStorage.setItem('crm_tasks', JSON.stringify(mockTasks));
    localStorage.setItem('crm_consultants', JSON.stringify(mockConsultants));
    localStorage.setItem('crm_initialized', 'true');
  }
};

export const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};
