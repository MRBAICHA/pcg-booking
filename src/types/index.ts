export interface User {
  id: string;
  employeeId: string;
  name: string;
  nameEn?: string | null;
  email?: string | null;
  department?: string | null;
  position?: string | null;
  role: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  description?: string | null;
  capacity: number;
  isActive: boolean;
}

export interface Schedule {
  id: string;
  routeId: string;
  route: Route;
  date: string;
  departAt: string;
  capacity: number;
  isActive: boolean;
  bookingCount?: number;
  isBooked?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  user?: User;
  scheduleId: string;
  schedule?: Schedule;
  status: string;
  note?: string | null;
  createdAt: string;
  checkIn?: CheckIn | null;
}

export interface CheckIn {
  id: string;
  bookingId: string;
  userId: string;
  user?: User;
  checkedAt: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  note?: string | null;
  booking?: Booking;
}

export interface AdminStats {
  totalBookingsToday: number;
  checkedInToday: number;
  pendingCheckin: number;
  activeRoutes: number;
  recentBookings: Booking[];
  recentCheckIns: CheckIn[];
}
