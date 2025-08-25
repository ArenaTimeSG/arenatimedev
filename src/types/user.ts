// Types for User Profile functionality

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfile {
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserProfile {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'user';
  is_active?: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignUpValidation {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  phone?: string;
  general?: string;
}

// Validation functions
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email é obrigatório';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Senha é obrigatória';
  }
  
  if (password.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres';
  }
  
  if (password.length > 50) {
    return 'Senha deve ter no máximo 50 caracteres';
  }
  
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Confirmação de senha é obrigatória';
  }
  
  if (password !== confirmPassword) {
    return 'Senhas não coincidem';
  }
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) {
    return 'Nome é obrigatório';
  }
  
  if (name.length < 2) {
    return 'Nome deve ter pelo menos 2 caracteres';
  }
  
  if (name.length > 100) {
    return 'Nome deve ter no máximo 100 caracteres';
  }
  
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) {
    return null; // Telefone é opcional
  }
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return 'Telefone deve ter pelo menos 10 dígitos';
  }
  
  if (cleanPhone.length > 11) {
    return 'Telefone deve ter no máximo 11 dígitos';
  }
  
  return null;
};

export const validateSignUpData = (data: SignUpValidation): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Validar email
  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }
  
  // Validar senha
  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  // Validar confirmação de senha
  const confirmPasswordError = validateConfirmPassword(data.password, data.confirmPassword);
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  }
  
  // Validar nome
  const nameError = validateName(data.name);
  if (nameError) {
    errors.name = nameError;
  }
  
  // Validar telefone
  const phoneError = validatePhone(data.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }
  
  return errors;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Formata o telefone
  if (cleanPhone.length === 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  } else if (cleanPhone.length === 10) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }
  
  return phone;
};

// Clean phone number (remove formatting)
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

