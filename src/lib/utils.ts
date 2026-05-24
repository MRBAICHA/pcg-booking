import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

export function formatDateThai(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMMM yyyy', { locale: th });
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy');
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isAdmin(role: string): boolean {
  return role === 'ADMIN' || role === 'GA_ADMIN';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    EMPLOYEE: 'พนักงาน',
    ADMIN: 'ผู้ดูแลระบบ',
    GA_ADMIN: 'GA Admin',
  };
  return labels[role] || role;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONFIRMED: 'ยืนยันแล้ว',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    CONFIRMED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
