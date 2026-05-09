import { useState } from 'react';

// `any` is required to forward arbitrary callable signatures generically.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Callback = (...args: any[]) => void | Promise<any>;

export const useLoading = <T extends Callback>(callback: T): [T, boolean] => {
  const [isLoading, setLoading] = useState(false);

  const handleCallback = async (...args: any[]) => {
    setLoading(true);

    try {
      return await callback(...args);
    } finally {
      setLoading(false);
    }
  };

  return [handleCallback as T, isLoading];
};
/* eslint-enable @typescript-eslint/no-explicit-any */
