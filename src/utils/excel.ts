import * as XLSX from 'xlsx';
import type { Customer, CustomerSource, CustomerStage } from '../types';
import { SOURCE_OPTIONS, STAGE_COLUMNS, COURSE_OPTIONS } from '../types';

interface ImportResult {
  success: Customer[];
  duplicates: { row: number; phone: string; existingName: string }[];
  errors: { row: number; message: string }[];
}

export const importCustomersFromExcel = (
  file: File,
  existingPhones: Set<string>
): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        const success: Customer[] = [];
        const duplicates: { row: number; phone: string; existingName: string }[] = [];
        const errors: { row: number; message: string }[] = [];

        const headers = jsonData[0]?.map((h: string) => h.trim().toLowerCase()) || [];
        const nameIndex = headers.indexOf('姓名') || headers.indexOf('name') || 0;
        const phoneIndex = headers.indexOf('手机号') || headers.indexOf('phone') || 1;
        const sourceIndex = headers.indexOf('来源') || headers.indexOf('source') || 2;
        const courseIndex = headers.indexOf('意向课程') || headers.indexOf('course') || 3;

        const newPhones = new Set<string>();

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const name = row[nameIndex]?.toString().trim();
          const phone = row[phoneIndex]?.toString().trim();
          const source = row[sourceIndex]?.toString().trim() || 'other';
          const course = row[courseIndex]?.toString().trim() || COURSE_OPTIONS[0];

          if (!name) {
            errors.push({ row: i + 1, message: '姓名不能为空' });
            continue;
          }

          if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            errors.push({ row: i + 1, message: '手机号格式不正确' });
            continue;
          }

          if (existingPhones.has(phone)) {
            duplicates.push({ row: i + 1, phone, existingName: '已有记录' });
            continue;
          }

          if (newPhones.has(phone)) {
            duplicates.push({ row: i + 1, phone, existingName: '导入文件内重复' });
            continue;
          }

          newPhones.add(phone);

          const sourceValue = SOURCE_OPTIONS.find(
            (opt) => opt.label === source || opt.value === source
          )?.value as CustomerSource || 'other';

          const customer: Customer = {
            id: `import-${Date.now()}-${i}`,
            name,
            phone,
            source: sourceValue,
            intendedCourse: COURSE_OPTIONS.find((c) => c === course) || course,
            stage: 'lead' as CustomerStage,
            consultantId: '',
            tags: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDuplicate: false,
          };

          success.push(customer);
        }

        resolve({ success, duplicates, errors });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
};

export const exportCustomersToExcel = (
  customers: Customer[],
  consultants: { id: string; name: string }[]
) => {
  const exportData = customers.map((customer) => {
    const consultant = consultants.find((c) => c.id === customer.consultantId);
    const sourceLabel = SOURCE_OPTIONS.find((s) => s.value === customer.source)?.label || customer.source;
    const stageLabel = STAGE_COLUMNS.find((s) => s.id === customer.stage)?.title || customer.stage;

    return {
      '姓名': customer.name,
      '手机号': customer.phone,
      '来源': sourceLabel,
      '意向课程': customer.intendedCourse,
      '当前阶段': stageLabel,
      '负责顾问': consultant?.name || '未分配',
      '标签': customer.tags.join(', '),
      '创建时间': new Date(customer.createdAt).toLocaleString('zh-CN'),
      '最后跟进': new Date(customer.updatedAt).toLocaleString('zh-CN'),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '客户清单');
  
  const fileName = `客户清单_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const downloadTemplate = () => {
  const templateData = [
    {
      '姓名': '张三',
      '手机号': '13812345678',
      '来源': '线上推广',
      '意向课程': '少儿编程启蒙班',
    },
    {
      '姓名': '李四',
      '手机号': '13987654321',
      '来源': '老学员推荐',
      '意向课程': 'Python进阶班',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');
  XLSX.writeFile(workbook, '客户导入模板.xlsx');
};
