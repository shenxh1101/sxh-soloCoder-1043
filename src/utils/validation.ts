export const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 20;
};

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateDate = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

export const getPhoneError = (phone: string): string => {
  if (!phone) return '请输入手机号';
  if (!validatePhone(phone)) return '请输入正确的手机号格式';
  return '';
};

export const getNameError = (name: string): string => {
  if (!name) return '请输入姓名';
  if (!validateName(name)) return '姓名长度应在2-20个字符之间';
  return '';
};

export const getAmountError = (amount: string): string => {
  if (!amount) return '请输入金额';
  if (!validateAmount(amount)) return '请输入正确的金额';
  return '';
};

export const checkDuplicatePhones = (
  newPhones: string[],
  existingPhones: string[]
): { phone: string; count: number }[] => {
  const duplicates: { phone: string; count: number }[] = [];
  const newPhoneMap = new Map<string, number>();

  newPhones.forEach((phone) => {
    newPhoneMap.set(phone, (newPhoneMap.get(phone) || 0) + 1);
  });

  newPhoneMap.forEach((count, phone) => {
    if (count > 1 || existingPhones.includes(phone)) {
      duplicates.push({ phone, count: existingPhones.includes(phone) ? count + 1 : count });
    }
  });

  return duplicates;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');
};
