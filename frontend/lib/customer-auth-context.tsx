'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { setCustomerSession, getCustomerToken, getCustomer, removeCustomerSession } from './customer-auth';

type Ctx = {
  customer: any;
  isLoggedIn: boolean;
  loaded: boolean; // ← AJOUT : true quand le localStorage a été lu
  login: (token: string, customer: any) => void;
  logout: () => void;
  updateCustomer: (customer: any) => void;
};

const CustomerAuthContext = createContext<Ctx | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<any>(null);
  const [loaded, setLoaded] = useState(false); // ← AJOUT

  useEffect(() => {
    try {
      const token = getCustomerToken();
      if (token) {
        const cust = getCustomer();
        if (cust) setCustomer(cust);
        else removeCustomerSession(); // token présent mais client absent → on nettoie
      }
    } catch {
      // localStorage bloqué / corrompu → on considère non connecté
      removeCustomerSession();
    } finally {
      setLoaded(true); // ← dans tous les cas, on a fini de lire
    }
  }, []);

  const login = (token: string, cust: any) => {
    setCustomerSession(token, cust);
    setCustomer(cust);
  };

  const logout = () => {
    removeCustomerSession();
    setCustomer(null);
  };

  const updateCustomer = (cust: any) => {
    const token = getCustomerToken();
    if (token) setCustomerSession(token, cust);
    setCustomer(cust);
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer,
      isLoggedIn: !!customer,
      loaded,
      login,
      logout,
      updateCustomer,
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