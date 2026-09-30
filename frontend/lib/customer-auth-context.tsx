'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { setCustomerSession, getCustomerToken, getCustomer, removeCustomerSession } from './customer-auth';

type Ctx = {
  customer: any;
  isLoggedIn: boolean;
  login: (token: string, customer: any) => void;
  logout: () => void;
};

const CustomerAuthContext = createContext<Ctx | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (getCustomerToken()) setCustomer(getCustomer());
  }, []);

  const login = (token: string, cust: any) => {
    setCustomerSession(token, cust);
    setCustomer(cust);
  };

  const logout = () => {
    removeCustomerSession();
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer,
      isLoggedIn: !!customer,
      login,
      logout,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  return ctx;
}