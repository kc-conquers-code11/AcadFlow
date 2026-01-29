import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const DEMO_USERS: Record<UserRole, User> = {
  student: {
    id: 'student-1',
    email: 'student@college.edu',
    name: 'John Smith',
    role: 'student',
    department: 'Computer Engineering',
    year: 3,
    enrollmentNumber: 'CE2022001',
    createdAt: new Date().toISOString(),
  },
  teacher: {
    id: 'teacher-1',
    email: 'teacher@college.edu',
    name: 'Dr. Sarah Johnson',
    role: 'teacher',
    department: 'Computer Engineering',
    createdAt: new Date().toISOString(),
  },
  hod: {
    id: 'hod-1',
    email: 'hod@college.edu',
    name: 'Prof. Michael Chen',
    role: 'hod',
    department: 'Computer Engineering',
    createdAt: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('academic_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Demo login logic - check email domain for role
    let role: UserRole = 'student';
    if (email.includes('teacher') || email.includes('faculty')) {
      role = 'teacher';
    } else if (email.includes('hod') || email.includes('admin')) {
      role = 'hod';
    }
    
    const loggedInUser = { ...DEMO_USERS[role], email };
    setUser(loggedInUser);
    localStorage.setItem('academic_user', JSON.stringify(loggedInUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('academic_user');
  };

  // For demo: switch between roles without re-login
  const switchRole = (role: UserRole) => {
    const newUser = DEMO_USERS[role];
    setUser(newUser);
    localStorage.setItem('academic_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
