import { z } from 'zod';
import axios from 'axios';

export const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export function getApiError(error: unknown, fallback = 'Алдаа гарлаа. Дахин оролдоно уу.') {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (error.code === 'ECONNABORTED') return 'Серверийн хариу удаж байна. Дахин оролдоно уу.';
    if (!error.response) return 'Backend-тэй холбогдож чадсангүй.';
  }
  return fallback;
}
