export type UserRole = 'superadmin' | 'admin' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export type DoctorStatus = 'present' | 'absent' | 'leave';

export interface PatientEntry {
  id: string;
  doctor_id: string;
  department_id: string;
  entry_date: string;
  male_count: number;
  female_count: number;
  pediatric_count: number;
  status: DoctorStatus;
  remarks?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joined fields
  doctor?: User;
  department?: Department;
}

export interface ReportData {
  date: string;
  male: number;
  female: number;
  pediatric: number;
  total: number;
  doctor?: string;
  department?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
