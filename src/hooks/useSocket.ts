import { useEffect } from 'react';
import { initSocket } from '../socket';

export function useSocket() {
  useEffect(() => {
    const socket = initSocket();
    return () => {
      // Don't disconnect on unmount in dev (StrictMode double-mount)
    };
  }, []);
}
