import React, { createContext, useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import NetWorkAlert from "../components/modals/NetWorkAlert";

const NetworkContext = createContext<{
  isConnected: boolean;
  checkConnection: () => void;
}>({
  isConnected: true,
  checkConnection: () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected!);
  }, []);

  useEffect(() => {
    checkConnection();
    const unsubscribe = NetInfo.addEventListener(state => {

      setIsConnected(state.isConnected!);
    });

    return () => unsubscribe();
  }, [checkConnection]);

  return (
    <NetworkContext.Provider value={{ isConnected, checkConnection }}>
      {children}
      <NetWorkAlert visible={isConnected} onClose={() => setIsConnected(true)} />
    </NetworkContext.Provider>
  );
};

export default NetworkContext;
