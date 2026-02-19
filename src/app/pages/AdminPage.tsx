import { useState, useEffect } from "react";
import { RecordTable } from "../components/RecordTable";
import { SettlementView } from "../components/SettlementView";
import { FileImport } from "../components/FileImport";
import { ExportButton } from "../components/ExportButton";
import { RecordSearch, SearchFilters } from "../components/RecordSearch";
import { InstallPWA } from "../components/InstallPWA";
import { Button } from "../components/ui/button";
import { Truck, FileText, BarChart3, Upload, Search, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Record } from "../types";
import { Link } from "react-router";
import { supabase } from "/utils/supabase/client";

export function AdminPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [showSearch, setShowSearch] = useState(false);

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/server`;
  const authToken = publicAnonKey;

  // 기록 조회
  const fetchRecords = async () => {
    setLoading(true);
    try {
      console.log(`[fetchRecords] API URL: ${apiUrl}/records`);
      console.log(`[fetchRecords] Auth Token: ${authToken ? 'Present' : 'Missing'}`);
      
      const response = await fetch(`${apiUrl}/records`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      console.log(`[fetchRecords] Response status: ${response.status}`);
      console.log(`[fetchRecords] Response ok: ${response.ok}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[fetchRecords] HTTP error: ${response.status} - ${errorText}`);
        toast.error(`서버 오류: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      console.log(`[fetchRecords] Response data:`, data);
      
      if (data.success) {
        setRecords(data.records);
        setFilteredRecords(data.records);
        console.log(`[fetchRecords] Successfully loaded ${data.records.length} records`);
        
        // 새로운 데이터 개수 확인
        const newCount = data.records.filter((r: Record) => r.isNew).length;
        if (newCount > 0) {
          toast.info(`새로운 기록 ${newCount}건이 있습니다.`);
        }
        
        // 데이터가 없으면 알림
        if (data.records.length === 0) {
          toast.info("등록된 운송 기록이 없습니다. 새 기록을 추가해주세요.");
        }
      } else {
        console.error("[fetchRecords] 기록 조회 실패:", data.error);
        toast.error(`기록을 불러오는데 실패했습니다: ${data.error}`);
      }
    } catch (error) {
      console.error("[fetchRecords] 기록 조회 중 오류:", error);
      console.error("[fetchRecords] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error(`서버와 연결할 수 없습니다. 콘솔을 확인하세요.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // PWA standalone 모드에서 설치된 페이지 확인
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      const installedPage = localStorage.getItem('pwa-install-page');
      // 모바일 페이지에서 설치했는데 관리자 페이지로 왔다면 모바일로 리다이렉트
      if (installedPage === '/mobile') {
        window.location.href = '/mobile';
        return;
      }
    }

    fetchRecords();
    
    // Supabase Realtime 구독 설정
    const channel = supabase
      .channel('kv-store-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모두 감지
          schema: 'public',
          table: 'kv_store_logistics'
        },
        (payload) => {
          console.log('[Realtime] DB 변경 감지:', payload);
          
          // DB 변경 시 데이터 다시 가져오기
          fetchRecords();
          
          // 변경 유형에 따라 알림
          if (payload.eventType === 'INSERT') {
            toast.info('새로운 운송 기록이 추가되었습니다.');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('운송 기록이 수정되었습니다.');
          } else if (payload.eventType === 'DELETE') {
            toast.info('운송 기록이 삭제되었습니다.');
          }
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 기록 추가
  const handleAddRecord = async (record: any) => {
    try {
      const response = await fetch(`${apiUrl}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(record),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("기록이 추가되었습니다.");
        fetchRecords();
      } else {
        console.error("기록 추가 실패:", data.error);
        toast.error("기록 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("기록 추가 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
    }
  };

  // 기록 수정
  const handleUpdateRecord = async (id: string, record: any) => {
    // 즉시 UI 업데이트 (낙관적 업데이트) + isNew 플래그 제거
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...record, isNew: false } : r));
    setFilteredRecords(prev => prev.map(r => r.id === id ? { ...r, ...record, isNew: false } : r));
    
    try {
      const response = await fetch(`${apiUrl}/records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...record, isNew: false }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("기록이 수정되었습니다.");
        // 백그라운드에서 서버 데이터와 동기화
        fetchRecords();
      } else {
        console.error("기록 수정 실패:", data.error);
        toast.error("기록 수정에 실패했습니다.");
        // 실패 시 데이터 다시 가져오기
        fetchRecords();
      }
    } catch (error) {
      console.error("기록 수정 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
      // 실패 시 데이터 다시 가져오기
      fetchRecords();
    }
  };

  // 검색 및 필터링
  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...records];

    // 통합 검색
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.salesClient.toLowerCase().includes(searchLower) ||
          r.loadingPoint.toLowerCase().includes(searchLower) ||
          r.unloadingPoint.toLowerCase().includes(searchLower) ||
          r.purchaseClient.toLowerCase().includes(searchLower)
      );
    }

    // 일자 범위 필터
    if (filters.dateFrom) {
      filtered = filtered.filter((r) => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((r) => r.date <= filters.dateTo);
    }

    // 차량번호 필터
    if (filters.vehicleNumber) {
      filtered = filtered.filter((r) =>
        r.vehicleNumber.toLowerCase().includes(filters.vehicleNumber.toLowerCase())
      );
    }

    // 성명 필터
    if (filters.driverName) {
      filtered = filtered.filter((r) =>
        r.driverName.toLowerCase().includes(filters.driverName.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  // 기록 삭제
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`${apiUrl}/records/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("기록이 삭제되었습니다.");
        fetchRecords();
      } else {
        console.error("기록 삭제 실패:", data.error);
        toast.error("기록 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("기록 삭제 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
    }
  };

  // 파일 Import
  const handleImport = async (importedRecords: any[]) => {
    try {
      const response = await fetch(`${apiUrl}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ records: importedRecords }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`${data.count}건의 기록이 추가되었습니다.`);
        fetchRecords();
      } else {
        console.error("Import 실패:", data.error);
        toast.error("파일 Import에 실패했습니다.");
      }
    } catch (error) {
      console.error("Import 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
    }
  };

  const newRecordsCount = records.filter(r => r.isNew).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <InstallPWA />
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 md:p-3 shadow-lg shadow-blue-500/30 rounded-none">
              <Truck className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                운송 관리 시스템
              </h1>
              <p className="text-xs md:text-sm text-slate-400 hidden sm:block">물류 데이터 관리 및 정산</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-6 md:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* 컴팩트한 탭 네비게이션 - 모바일도 한 줄 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab("records")}
              className={`group relative overflow-hidden p-3 md:p-4 transition-all rounded-none ${
                activeTab === "records"
                  ? "bg-gradient-to-br from-blue-600 to-blue-500"
                  : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 ${
                  activeTab === "records"
                    ? "bg-white/20"
                    : "bg-blue-500/20"
                }`}>
                  <FileText className={`w-4 h-4 md:w-5 md:h-5 ${
                    activeTab === "records" ? "text-white" : "text-blue-400"
                  }`} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h3 className={`text-xs md:text-base font-semibold ${
                      activeTab === "records" ? "text-white" : "text-slate-200"
                    }`}>
                      운송 기록
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      activeTab === "records" 
                        ? "bg-white/30 text-white" 
                        : "bg-blue-500/30 text-blue-300"
                    }`}>
                      {records.length}
                    </span>
                    {newRecordsCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                        {newRecordsCount}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] md:text-xs mt-0.5 hidden md:block ${
                    activeTab === "records" ? "text-blue-100" : "text-slate-400"
                  }`}>
                    데이터 관리 및 조회
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settlement")}
              className={`group relative overflow-hidden p-3 md:p-4 transition-all rounded-none ${
                activeTab === "settlement"
                  ? "bg-gradient-to-br from-purple-600 to-purple-500"
                  : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 rounded-none ${
                  activeTab === "settlement"
                    ? "bg-white/20"
                    : "bg-purple-500/20"
                }`}>
                  <BarChart3 className={`w-4 h-4 md:w-5 md:h-5 ${
                    activeTab === "settlement" ? "text-white" : "text-purple-400"
                  }`} />
                </div>
                <div className="text-center md:text-left">
                  <h3 className={`text-xs md:text-base font-semibold ${
                    activeTab === "settlement" ? "text-white" : "text-slate-200"
                  }`}>
                    정산 관리
                  </h3>
                  <p className={`text-[10px] md:text-xs mt-0.5 hidden md:block ${
                    activeTab === "settlement" ? "text-purple-100" : "text-slate-400"
                  }`}>
                    일일/월간/사용자별
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("import")}
              className={`group relative overflow-hidden p-3 md:p-4 transition-all rounded-none ${
                activeTab === "import"
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-500"
                  : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 rounded-none ${
                  activeTab === "import"
                    ? "bg-white/20"
                    : "bg-emerald-500/20"
                }`}>
                  <Upload className={`w-4 h-4 md:w-5 md:h-5 ${
                    activeTab === "import" ? "text-white" : "text-emerald-400"
                  }`} />
                </div>
                <div className="text-center md:text-left">
                  <h3 className={`text-xs md:text-base font-semibold ${
                    activeTab === "import" ? "text-white" : "text-slate-200"
                  }`}>
                    파일 Import
                  </h3>
                  <p className={`text-[10px] md:text-xs mt-0.5 hidden md:block ${
                    activeTab === "import" ? "text-emerald-100" : "text-slate-400"
                  }`}>
                    Excel 가져오기
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* 운송 기록 탭 */}
          {activeTab === "records" && (
            <div className="space-y-4">
              {/* 상단 액션 버튼 영역 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  onClick={() => setShowSearch(!showSearch)}
                  variant={showSearch ? "default" : "outline"}
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  {showSearch ? "검색 닫기" : "검색 및 필터"}
                </Button>
                <div className="flex-1"></div>
                <ExportButton records={filteredRecords} format="excel" />
                <Button variant="outline" onClick={fetchRecords} disabled={loading} className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
                  {loading ? "로딩 중..." : "새로고침"}
                </Button>
              </div>

              {/* 접을 수 있는 검색 필터 */}
              {showSearch && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <RecordSearch onSearch={handleSearch} />
                </div>
              )}
              
              {/* 메인 리스트 영역 */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
                  <h2 className="text-lg font-semibold text-white">
                    전체 기록 
                    {filteredRecords.length !== records.length && (
                      <span className="text-sm text-slate-400 ml-2">
                        ({filteredRecords.length}/{records.length}건)
                      </span>
                    )}
                    {newRecordsCount > 0 && (
                      <span className="text-sm text-red-400 ml-2 animate-pulse">
                        · 새 데이터 {newRecordsCount}건
                      </span>
                    )}
                  </h2>
                </div>
                
                <RecordTable records={filteredRecords} onDelete={handleDeleteRecord} onAdd={handleAddRecord} onUpdate={handleUpdateRecord} />
                
                {filteredRecords.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm p-4 md:p-5 shadow-lg border border-slate-700/50 rounded-none">
                    {/* 모바일 레이아웃 */}
                    <div className="md:hidden space-y-3">
                      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-4 border border-emerald-500/30">
                        <div className="text-xs text-emerald-300 mb-1 text-center">총 청구운임</div>
                        <div className="text-2xl font-bold text-center text-emerald-400">
                          {new Intl.NumberFormat('ko-KR').format(
                            filteredRecords.reduce((sum, r) => sum + r.invoiceAmount, 0)
                          )}원
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 border border-blue-500/30">
                        <div className="text-xs text-blue-300 mb-1 text-center">총 운송료</div>
                        <div className="text-2xl font-bold text-center text-blue-400">
                          {new Intl.NumberFormat('ko-KR').format(
                            filteredRecords.reduce((sum, r) => sum + r.transportFee, 0)
                          )}원
                        </div>
                      </div>
                    </div>
                    
                    {/* 데스크톱 레이아웃 */}
                    <div className="hidden md:grid grid-cols-3 gap-4 text-center">
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 border border-slate-700 shadow-lg rounded-none">
                        <div className="text-sm text-slate-400 font-medium mb-1">표시된 기록 수</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">{filteredRecords.length}건</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 rounded-none">
                        <div className="text-sm text-emerald-300 font-medium mb-1">총 청구운임</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {new Intl.NumberFormat('ko-KR').format(
                            filteredRecords.reduce((sum, r) => sum + r.invoiceAmount, 0)
                          )}원
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 border border-blue-500/30 shadow-lg shadow-blue-500/10 rounded-none">
                        <div className="text-sm text-blue-300 font-medium mb-1">총 ��송료</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {new Intl.NumberFormat('ko-KR').format(
                            filteredRecords.reduce((sum, r) => sum + r.transportFee, 0)
                          )}원
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 정산 보고서 탭 */}
          {activeTab === "settlement" && (
            <SettlementView apiUrl={apiUrl} authToken={authToken} />
          )}

          {/* 파일 Import 탭 */}
          {activeTab === "import" && (
            <FileImport onImport={handleImport} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-400">
          <p>© <Link to="/mobile" className="hover:text-slate-300">2026</Link> 운송 관리 시스템</p>
        </div>
      </footer>
    </div>
  );
}