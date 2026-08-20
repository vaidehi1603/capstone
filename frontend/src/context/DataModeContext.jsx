import React, { createContext, useContext, useState, useEffect } from 'react';

const DataModeContext = createContext();

export const DATA_MODES = {
  VESIT_ACTUAL: 'VESIT_ACTUAL',
  TEST_DEMO: 'TEST_DEMO',
};

export const DataModeProvider = ({ children }) => {
  const [dataMode, setDataModeState] = useState(() => {
    return localStorage.getItem('vesit_carbon_data_mode') || DATA_MODES.VESIT_ACTUAL;
  });

  const setDataMode = (mode) => {
    localStorage.setItem('vesit_carbon_data_mode', mode);
    setDataModeState(mode);
  };

  const isVesit = dataMode === DATA_MODES.VESIT_ACTUAL;

  return (
    <DataModeContext.Provider value={{ dataMode, setDataMode, isVesit }}>
      {children}
    </DataModeContext.Provider>
  );
};

export const useDataMode = () => {
  const context = useContext(DataModeContext);
  if (!context) {
    throw new Error('useDataMode must be used within a DataModeProvider');
  }
  return context;
};
