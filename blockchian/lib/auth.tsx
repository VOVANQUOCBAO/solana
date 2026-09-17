"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

/* ── Types ─────────────────────────────────────────────────── */
export type UserRole = "student" | "employer" | "mentor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  password?: string;
  ocid?: string;          // Open Campus ID
  walletAddress?: string; // Solana wallet (Privy embedded)
  creditScore: number;    // 0–1000 Work Credit
  usdc: number;           // USDC balance
  sbtCount: number;       // Number of SBT credentials
  joinedAt: string;
  university?: string;
  major?: string;
  companyName?: string;
  industry?: string;
  title?: string;
  expertise?: string;
}

export interface RegisterData {
  role: UserRole;
  name: string;
  email: string;
  password?: string;
  university?: string;
  major?: string;
  companyName?: string;
  industry?: string;
  title?: string;
  expertise?: string;
  adminCode?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (roleOrEmail: UserRole | string, passwordOrEmail?: string) => Promise<User>;
  loginWithCredentials: (email: string, password?: string, role?: UserRole) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  getAccountByEmail: (email: string) => User | undefined;
}

/* ── Initial Mock Users / Accounts ─────────────────────────── */
export const DEFAULT_ACCOUNTS: Record<UserRole, User> = {
  student: {
    id: "stu-001",
    name: "Nguyễn Minh Vỹ",
    email: "vy.nguyen@student.hcmus.edu.vn",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vy&backgroundColor=b6e3f4",
    role: "student",
    ocid: "OCID-VY-HCMUS",
    walletAddress: "7xKp...3mNq",
    creditScore: 782,
    usdc: 245.5,
    sbtCount: 4,
    joinedAt: new Date(Date.now() - 120 * 86400000).toISOString().split("T")[0],
    university: "ĐH Khoa học Tự nhiên - ĐHQG TP.HCM",
    major: "Kỹ thuật phần mềm / Web3",
  },
  employer: {
    id: "emp-001",
    name: "TechViet Solutions",
    email: "hr@techviet.com",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=techviet&backgroundColor=ffd5dc",
    role: "employer",
    creditScore: 920,
    usdc: 5000,
    sbtCount: 0,
    joinedAt: new Date(Date.now() - 180 * 86400000).toISOString().split("T")[0],
    companyName: "TechViet Solutions Co., Ltd",
    industry: "Công nghệ thông tin / Web3",
  },
  mentor: {
    id: "men-001",
    name: "TS. Trần Quốc Bảo",
    email: "bao.tran@mentor.edulink.io",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bao&backgroundColor=ffd5dc",
    role: "mentor",
    creditScore: 980,
    usdc: 890,
    sbtCount: 12,
    joinedAt: new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0],
    title: "Tiến sĩ / Chuyên gia Trưởng",
    expertise: "Blockchain & Smart Contract Audit",
  },
  admin: {
    id: "adm-001",
    name: "EduLink Admin",
    email: "admin@edulink.io",
    password: "password123",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=admin&backgroundColor=c0aede",
    role: "admin",
    creditScore: 1000,
    usdc: 0,
    sbtCount: 0,
    joinedAt: new Date(Date.now() - 400 * 86400000).toISOString().split("T")[0],
  },
};

/* ── Context ────────────────────────────────────────────────── */
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { throw new Error("not initialized"); },
  loginWithCredentials: async () => { throw new Error("not initialized"); },
  register: async () => { throw new Error("not initialized"); },
  logout: () => {},
  getAccountByEmail: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load all accounts
  const getAllAccounts = (): User[] => {
    try {
      const saved = localStorage.getItem("edulink_registered_accounts");
      const customAccounts: User[] = saved ? JSON.parse(saved) : [];
      const defaultList = Object.values(DEFAULT_ACCOUNTS);
      // Combine custom with defaults (custom overrides by email)
      const emailMap = new Map<string, User>();
      defaultList.forEach((acc) => emailMap.set(acc.email.toLowerCase(), acc));
      customAccounts.forEach((acc) => emailMap.set(acc.email.toLowerCase(), acc));
      return Array.from(emailMap.values());
    } catch {
      return Object.values(DEFAULT_ACCOUNTS);
    }
  };

  const getAccountByEmail = (email: string): User | undefined => {
    const accounts = getAllAccounts();
    return accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  };

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem("edulink_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("edulink_user");
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithCredentials = async (email: string, password?: string, fallbackRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const cleanEmail = email.trim().toLowerCase();
    const existing = getAccountByEmail(cleanEmail);

    if (existing) {
      // If password provided and account has password, check match (allow password123 as demo)
      if (password && existing.password && password !== existing.password && password !== "password123" && password !== "123456") {
        setIsLoading(false);
        throw new Error("Mật khẩu không chính xác. Vui lòng thử lại hoặc dùng mật khẩu mẫu: password123");
      }
      setUser(existing);
      localStorage.setItem("edulink_user", JSON.stringify(existing));
      setIsLoading(false);
      return existing;
    }

    // If not found by email but fallbackRole is given
    if (fallbackRole && DEFAULT_ACCOUNTS[fallbackRole]) {
      const base = DEFAULT_ACCOUNTS[fallbackRole];
      const customUser: User = {
        ...base,
        email: cleanEmail || base.email,
      };
      setUser(customUser);
      localStorage.setItem("edulink_user", JSON.stringify(customUser));
      setIsLoading(false);
      return customUser;
    }

    setIsLoading(false);
    throw new Error(`Không tìm thấy tài khoản với email "${email}". Vui lòng đăng ký tài khoản mới.`);
  };

  const login = async (roleOrEmail: UserRole | string, passwordOrEmail?: string): Promise<User> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    // Check if first arg is a known role
    const isRole = ["student", "employer", "mentor", "admin"].includes(roleOrEmail);
    if (isRole) {
      const role = roleOrEmail as UserRole;
      const base = DEFAULT_ACCOUNTS[role];
      const email = passwordOrEmail && passwordOrEmail.includes("@") ? passwordOrEmail.trim() : base.email;
      const loggedUser = { ...base, email };
      setUser(loggedUser);
      localStorage.setItem("edulink_user", JSON.stringify(loggedUser));
      setIsLoading(false);
      return loggedUser;
    } else {
      // It is an email
      return loginWithCredentials(roleOrEmail, passwordOrEmail);
    }
  };

  const register = async (data: RegisterData): Promise<User> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomEnd = Math.random().toString(36).substring(2, 6);
    const cleanName = data.name.trim() || (data.role === "employer" ? data.companyName || "Doanh nghiệp mới" : "Người dùng mới");
    const avatarSeed = encodeURIComponent(cleanName.toLowerCase());

    const newUser: User = {
      id: `${data.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      email: data.email.trim(),
      password: data.password || "password123",
      avatar: data.role === "employer"
        ? `https://api.dicebear.com/7.x/shapes/svg?seed=${avatarSeed}&backgroundColor=ffd5dc`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`,
      role: data.role,
      ocid: data.role === "student" ? `OCID-${randomChars}-2025` : undefined,
      walletAddress: `${randomChars}...${randomEnd}`,
      creditScore: data.role === "student" ? 750 : data.role === "employer" ? 850 : data.role === "mentor" ? 950 : 1000,
      usdc: data.role === "employer" ? 2500 : data.role === "student" ? 50 : 200,
      sbtCount: data.role === "student" ? 1 : 0,
      joinedAt: new Date().toISOString().split("T")[0],
      university: data.university,
      major: data.major,
      companyName: data.companyName,
      industry: data.industry,
      title: data.title,
      expertise: data.expertise,
    };

    // Save to persistent accounts list
    try {
      const saved = localStorage.getItem("edulink_registered_accounts");
      const currentList: User[] = saved ? JSON.parse(saved) : [];
      const updatedList = [newUser, ...currentList.filter((a) => a.email.toLowerCase() !== newUser.email.toLowerCase())];
      localStorage.setItem("edulink_registered_accounts", JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    setUser(newUser);
    localStorage.setItem("edulink_user", JSON.stringify(newUser));
    setIsLoading(false);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("edulink_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithCredentials,
        register,
        logout,
        getAccountByEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/* ── Role-based redirect helper ────────────────────────────── */
export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    student: "/dashboard/student",
    employer: "/dashboard/employer",
    mentor: "/dashboard/mentor",
    admin: "/dashboard/admin",
  };
  return paths[role];
}
