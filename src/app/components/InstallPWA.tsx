import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Smartphone, X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // PWA 메타 태그 추가
    const addMetaTags = () => {
      // manifest
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      // theme-color
      if (!document.querySelector('meta[name="theme-color"]')) {
        const themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        themeColor.content = '#3b82f6';
        document.head.appendChild(themeColor);
      }

      // apple-mobile-web-app-capable
      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const appleCapable = document.createElement('meta');
        appleCapable.name = 'apple-mobile-web-app-capable';
        appleCapable.content = 'yes';
        document.head.appendChild(appleCapable);
      }

      // apple-mobile-web-app-status-bar-style
      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const appleStatusBar = document.createElement('meta');
        appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
        appleStatusBar.content = 'black-translucent';
        document.head.appendChild(appleStatusBar);
      }

      // apple-mobile-web-app-title
      if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
        const appleTitle = document.createElement('meta');
        appleTitle.name = 'apple-mobile-web-app-title';
        appleTitle.content = '운송관리';
        document.head.appendChild(appleTitle);
      }
    };

    addMetaTags();

    // iOS 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 이미 standalone 모드인지 확인
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // beforeinstallprompt 이벤트 리스너 (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      
      // 배너는 처음 한 번만 자동으로 표시 (localStorage 확인)
      const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!bannerDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS의 경우 처음 방문 시 배너 표시
    if (ios && !standalone) {
      const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!bannerDismissed) {
        setShowBanner(true);
        setShowInstallButton(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    // Android/Desktop: 설치 프롬프트 표시
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA 설치 수락됨');
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowInstallButton(false);
    }
    
    // iOS: 안내 표시 (자동 설치 불가)
    if (isIOS) {
      setShowBanner(true);
    }
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // 이미 standalone 모드면 아무것도 표시하지 않음
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* 플로팅 설치 버튼 - 모바일만 */}
      {showInstallButton && (
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <Button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/50 rounded-full w-14 h-14 p-0 flex items-center justify-center"
          >
            <Download className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* 설치 안내 배너 */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 shadow-2xl border-t-2 border-blue-400">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-white">
                <h3 className="font-bold text-base mb-1">앱으로 설치하기</h3>
                {isIOS ? (
                  <div className="text-sm text-blue-50 space-y-1">
                    <p>1. 하단 공유 버튼 <span className="inline-block px-1.5 py-0.5 bg-white/30 rounded text-xs mx-1">⎙</span> 탭</p>
                    <p>2. "홈 화면에 추가" 선택</p>
                  </div>
                ) : (
                  <p className="text-sm text-blue-50">
                    홈 화면에 추가하여 앱처럼 사용하세요
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {!isIOS && deferredPrompt && (
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="bg-white text-blue-600 hover:bg-blue-50 rounded-none font-semibold"
                  >
                    설치
                  </Button>
                )}
                <Button
                  onClick={handleCloseBanner}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 p-1 h-auto rounded-none"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}