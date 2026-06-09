import { create } from 'zustand';
import type {
  Customer,
  Communication,
  FollowUp,
  Audition,
  Quotation,
  Contract,
  Task,
  Consultant,
  CustomerFilters,
  CustomerStage,
} from '../types';
import { getData, setData } from '../data/mockData';

interface CustomerState {
  customers: Customer[];
  communications: Communication[];
  followUps: FollowUp[];
  auditions: Audition[];
  quotations: Quotation[];
  contracts: Contract[];
  tasks: Task[];
  consultants: Consultant[];
  filters: CustomerFilters;
  loading: boolean;
  error: string | null;
  loadData: () => void;
  setFilters: (filters: Partial<CustomerFilters>) => void;
  resetFilters: () => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  updateCustomerStage: (id: string, stage: CustomerStage) => void;
  bulkAddCustomers: (customers: Customer[]) => void;
  addCommunication: (communication: Communication) => void;
  addFollowUp: (followUp: FollowUp) => void;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => void;
  addAudition: (audition: Audition) => void;
  updateAudition: (id: string, updates: Partial<Audition>) => void;
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  hasRelatedTask: (relatedId: string, source: string) => boolean;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerCommunications: (customerId: string) => Communication[];
  getCustomerFollowUps: (customerId: string) => FollowUp[];
  getCustomerAuditions: (customerId: string) => Audition[];
  getCustomerQuotations: (customerId: string) => Quotation[];
  getCustomerContracts: (customerId: string) => Contract[];
  getFilteredCustomers: () => Customer[];
  getExistingPhones: () => Set<string>;
  detectDuplicates: () => void;
}

const defaultFilters: CustomerFilters = {
  search: '',
  source: '',
  intendedCourse: '',
  stage: '',
  consultantId: '',
  startDate: '',
  endDate: '',
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  communications: [],
  followUps: [],
  auditions: [],
  quotations: [],
  contracts: [],
  tasks: [],
  consultants: [],
  filters: defaultFilters,
  loading: false,
  error: null,

  loadData: () => {
    set({ loading: true });
    try {
      const customers = getData<Customer>('crm_customers');
      const communications = getData<Communication>('crm_communications');
      const followUps = getData<FollowUp>('crm_followups');
      const auditions = getData<Audition>('crm_auditions');
      const quotations = getData<Quotation>('crm_quotations');
      const contracts = getData<Contract>('crm_contracts');
      const tasks = getData<Task>('crm_tasks');
      const consultants = getData<Consultant>('crm_consultants');

      set({
        customers,
        communications,
        followUps,
        auditions,
        quotations,
        contracts,
        tasks,
        consultants,
        loading: false,
      });

      get().detectDuplicates();
    } catch (error) {
      set({ error: '数据加载失败', loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  addCustomer: (customer) => {
    set((state) => {
      const customers = [...state.customers, customer];
      setData('crm_customers', customers);
      return { customers };
    });
    get().detectDuplicates();
  },

  updateCustomer: (id, updates) => {
    set((state) => {
      const customers = state.customers.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      setData('crm_customers', customers);
      return { customers };
    });
  },

  updateCustomerStage: (id, stage) => {
    set((state) => {
      const customer = state.customers.find((c) => c.id === id);
      if (!customer || customer.stage === stage) {
        return state;
      }
      const customers = state.customers.map((c) =>
        c.id === id ? { ...c, stage, updatedAt: new Date().toISOString() } : c
      );
      setData('crm_customers', customers);
      return { customers };
    });
  },

  bulkAddCustomers: (newCustomers) => {
    set((state) => {
      const customers = [...state.customers, ...newCustomers];
      setData('crm_customers', customers);
      return { customers };
    });
    get().detectDuplicates();
  },

  addCommunication: (communication) => {
    set((state) => {
      const communications = [...state.communications, communication];
      setData('crm_communications', communications);
      return { communications };
    });
  },

  addFollowUp: (followUp) => {
    set((state) => {
      const followUps = [...state.followUps, followUp];
      setData('crm_followups', followUps);

      if (!state.hasRelatedTask(followUp.id, 'auto_followup')) {
        const customer = state.customers.find((c) => c.id === followUp.customerId);
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          customerId: followUp.customerId,
          consultantId: followUp.consultantId || customer?.consultantId || '',
          title: `跟进提醒：${customer?.name || '客户'}`,
          description: followUp.content,
          dueDate: followUp.remindAt,
          priority: followUp.priority,
          status: 'pending',
          type: 'phone_followup',
          source: 'auto_followup',
          relatedId: followUp.id,
        };
        const tasks = [...state.tasks, newTask];
        setData('crm_tasks', tasks);
        return { followUps, tasks };
      }

      return { followUps };
    });
  },

  updateFollowUp: (id, updates) => {
    set((state) => {
      const followUps = state.followUps.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      );
      setData('crm_followups', followUps);
      return { followUps };
    });
  },

  addAudition: (audition) => {
    set((state) => {
      const auditions = [...state.auditions, audition];
      setData('crm_auditions', auditions);

      if (!state.hasRelatedTask(audition.id, 'auto_audition')) {
        const customer = state.customers.find((c) => c.id === audition.customerId);
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          customerId: audition.customerId,
          consultantId: audition.consultantId || customer?.consultantId || '',
          title: `试听确认：${customer?.name || '客户'}`,
          description: `课程：${audition.course}\n时间：${new Date(audition.auditionAt).toLocaleString()}\n讲师：${audition.teacher}`,
          dueDate: audition.auditionAt,
          priority: 'high',
          status: 'pending',
          type: 'audition_confirm',
          source: 'auto_audition',
          relatedId: audition.id,
        };
        const tasks = [...state.tasks, newTask];
        setData('crm_tasks', tasks);
        return { auditions, tasks };
      }

      return { auditions };
    });
  },

  updateAudition: (id, updates) => {
    set((state) => {
      const auditions = state.auditions.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      setData('crm_auditions', auditions);
      return { auditions };
    });
  },

  addQuotation: (quotation) => {
    set((state) => {
      const quotations = [...state.quotations, quotation];
      setData('crm_quotations', quotations);
      return { quotations };
    });
  },

  updateQuotation: (id, updates) => {
    set((state) => {
      const quotations = state.quotations.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      );
      setData('crm_quotations', quotations);
      return { quotations };
    });
  },

  addContract: (contract) => {
    set((state) => {
      const contracts = [...state.contracts, contract];
      setData('crm_contracts', contracts);

      const remainingAmount = contract.totalAmount - contract.receivedAmount;
      if (remainingAmount > 0 && !state.hasRelatedTask(contract.id, 'auto_contract')) {
        const customer = state.customers.find((c) => c.id === contract.customerId);
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          customerId: contract.customerId,
          consultantId: customer?.consultantId || '',
          title: `合同回款：${customer?.name || '客户'}`,
          description: `合同金额：¥${contract.totalAmount.toLocaleString()}\n已收：¥${contract.receivedAmount.toLocaleString()}\n待回款：¥${remainingAmount.toLocaleString()}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'pending',
          type: 'contract_payment',
          source: 'auto_contract',
          relatedId: contract.id,
        };
        const tasks = [...state.tasks, newTask];
        setData('crm_tasks', tasks);
        return { contracts, tasks };
      }

      return { contracts };
    });
  },

  updateContract: (id, updates) => {
    set((state) => {
      const contracts = state.contracts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      setData('crm_contracts', contracts);
      return { contracts };
    });
  },

  addTask: (task) => {
    set((state) => {
      const tasks = [...state.tasks, task];
      setData('crm_tasks', tasks);
      return { tasks };
    });
  },

  hasRelatedTask: (relatedId, source) => {
    const state = get();
    return state.tasks.some((t) => t.relatedId === relatedId && t.source === source);
  },

  updateTask: (id, updates) => {
    set((state) => {
      const tasks = state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      setData('crm_tasks', tasks);
      return { tasks };
    });
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },

  getCustomerCommunications: (customerId) => {
    return get()
      .communications.filter((c) => c.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCustomerFollowUps: (customerId) => {
    return get()
      .followUps.filter((f) => f.customerId === customerId)
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  },

  getCustomerAuditions: (customerId) => {
    return get()
      .auditions.filter((a) => a.customerId === customerId)
      .sort((a, b) => new Date(b.auditionAt).getTime() - new Date(a.auditionAt).getTime());
  },

  getCustomerQuotations: (customerId) => {
    return get()
      .quotations.filter((q) => q.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCustomerContracts: (customerId) => {
    return get()
      .contracts.filter((c) => c.customerId === customerId)
      .sort((a, b) => new Date(b.signDate).getTime() - new Date(a.signDate).getTime());
  },

  getFilteredCustomers: () => {
    const { customers, filters } = get();
    return customers.filter((customer) => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (
          !customer.name.toLowerCase().includes(search) &&
          !customer.phone.includes(search)
        ) {
          return false;
        }
      }
      if (filters.source && customer.source !== filters.source) return false;
      if (filters.intendedCourse && customer.intendedCourse !== filters.intendedCourse) return false;
      if (filters.stage && customer.stage !== filters.stage) return false;
      if (filters.consultantId && customer.consultantId !== filters.consultantId) return false;
      if (filters.startDate && new Date(customer.createdAt) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(customer.createdAt) > new Date(filters.endDate)) return false;
      return true;
    });
  },

  getExistingPhones: () => {
    return new Set(get().customers.map((c) => c.phone));
  },

  detectDuplicates: () => {
    const { customers } = get();
    const phoneMap = new Map<string, string[]>();
    
    customers.forEach((c) => {
      const existing = phoneMap.get(c.phone) || [];
      phoneMap.set(c.phone, [...existing, c.id]);
    });

    const updatedCustomers = customers.map((c) => {
      const ids = phoneMap.get(c.phone) || [];
      const isDuplicate = ids.length > 1;
      const duplicateWith = ids.filter((id) => id !== c.id)[0];
      return {
        ...c,
        isDuplicate,
        duplicateWith: isDuplicate ? duplicateWith : undefined,
      };
    });

    setData('crm_customers', updatedCustomers);
    set({ customers: updatedCustomers });
  },
}));
