import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { Toaster } from "./components/ui/sonner";
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // MetaMask 에러 무시 (암호화폐 지갑 사용 안 함)
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || '';
      if (
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')
      ) {
        return; // MetaMask 관련 에러는 무시
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}