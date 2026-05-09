import { useState } from 'react';

type StorageData<T> = [T, (value: T) => void, () => void];

const getInitialValue = <T>(keyName: string, defaultValue?: T): T | undefined => {
  try {
    const value = localStorage.getItem(keyName);

    if (value) {
      return JSON.parse(value);
    } else {
      localStorage.setItem(keyName, JSON.stringify(defaultValue));
      return defaultValue;
    }
  } catch {
    return defaultValue;
  }
};

export const useLocalStorage = <T>(
  keyName: string,
  defaultValue?: T
): StorageData<T> => {
  const [storedValue, setStoredValue] = useState(getInitialValue(keyName, defaultValue));

  const setValue = (newValue: T) => {
    setStoredValue(newValue);
    try {
      localStorage.setItem(keyName, JSON.stringify(newValue));
    } catch {
      /* swallow — quota exceeded or storage disabled */
    }
  };

  const clearValue = () => {
    setStoredValue(undefined);
    localStorage.removeItem(keyName);
  };

  return [storedValue as T, setValue, clearValue];
};
