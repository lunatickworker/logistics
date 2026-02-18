import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Save, CheckCircle2, Share2, CheckSquare, Square, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Record } from "../types";
import { InstallPWA } from "../components/InstallPWA";

export function MobileInputPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    loadingPoint: "",
    unloadingPoint: "",
    invoiceAmount: "",
    vehicleNumber: "",
    driverName: "",
    phoneNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRecords, setMyRecords] = useState<Record[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/server`;
  const authToken = publicAnonKey;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.date || !formData.loadingPoint || !formData.unloadingPoint || 
        !formData.invoiceAmount || !formData.vehicleNumber || !formData.driverName || 
        !formData.phoneNumber) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${apiUrl}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          date: formData.date,
          salesClient: "", // 관리자가 입력
          loadingPoint: formData.loadingPoint,
          unloadingPoint: formData.unloadingPoint,
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          phoneNumber: formData.phoneNumber,
          rate: 0, // 관리자가 입력
          purchaseClient: "", // 관리자가 입력
          invoiceAmount: parseFloat(formData.invoiceAmount),
          isNew: true, // 새 데이터 플래그
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("운송 기록이 등록되었습니다!");
        
        // 기록 목록 새로고침
        fetchMyRecords();
        
        // 2초 후 폼 리셋
        setTimeout(() => {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            loadingPoint: "",
            unloadingPoint: "",
            invoiceAmount: "",
            vehicleNumber: "",
            driverName: "",
            phoneNumber: "",
          });
          setSubmitted(false);
        }, 2000);
      } else {
        console.error("기록 추가 실패:", data.error);
        toast.error("등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("기록 추가 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
    } finally {
      setSaving(false);
    }
  };

  const fetchMyRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/records`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMyRecords(data.records);
      } else {
        console.error("기록 가져오기 실패:", data.error);
        toast.error("기록을 가져올 수 없습니다.");
      }
    } catch (error) {
      console.error("기록 가져오기 중 오류:", error);
      toast.error("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRecords();
  }, []);

  const handleSelectRecord = (id: string) => {
    const newSelectedRecords = new Set(selectedRecords);
    if (newSelectedRecords.has(id)) {
      newSelectedRecords.delete(id);
    } else {
      newSelectedRecords.add(id);
    }
    setSelectedRecords(newSelectedRecords);
  };

  const handleShareRecords = async () => {
    const selectedRecordIds = Array.from(selectedRecords);
    if (selectedRecordIds.length === 0) {
      toast.error("공유할 기록을 선택해주세요.");
      return;
    }

    const selectedData = myRecords.filter(r => selectedRecords.has(r.id));
    
    // 이미지 형식으로 텍스트 포맷팅
    const formattedText = selectedData.map(record => {
      const date = record.date.split('-').slice(1).join('/'); // MM/DD 형식
      const loadingShort = record.loadingPoint.split(' ')[0]; // 첫 단어만
      const unloadingShort = record.unloadingPoint.split(' ')[0]; // 첫 단어만
      return `${date}. ${loadingShort} → ${unloadingShort}

운임 - ${record.vehicleNumber} ${record.invoiceAmount.toLocaleString()}
${record.driverName} ${record.phoneNumber}`;
    }).join('\n\n');

    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: '운송 기록',
          text: formattedText,
        });
        toast.success(`${selectedRecords.size}건의 기록을 공유했습니다`);
        setSelectedRecords(new Set()); // 공유 후 선택 해제
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // 사용자가 취소한 경우가 아니면 클립보드로 대체
          try {
            await navigator.clipboard.writeText(formattedText);
            toast.success("클립보드에 복사되었습니다");
            setSelectedRecords(new Set());
          } catch (clipError) {
            toast.error("공유에 실패했습니다");
          }
        }
      }
    } else {
      // Web Share API 미지원 시 클립보드로 복사
      try {
        await navigator.clipboard.writeText(formattedText);
        toast.success("클립보드에 복사되었습니다. 카카오톡에 붙여넣기 하세요");
        setSelectedRecords(new Set());
      } catch (error) {
        toast.error("복사에 실패했습니다");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-slate-700/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">
                운송 기록 입력
              </h1>
              <p className="text-xs text-slate-400">모바일 입력 전용</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {submitted ? (
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50 p-8 text-center animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">등록 완료!</h2>
            <p className="text-slate-300">관리자 페이지에서 확인해주세요.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  날짜 <span className="text-red-400">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  상차지 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.loadingPoint}
                  onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                  placeholder="예: 서울시 강남구"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  하차지 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.unloadingPoint}
                  onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                  placeholder="예: 부산시 해운대구"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  청구운임 <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.invoiceAmount}
                  onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                  placeholder="예: 500000"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  차량번호 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  placeholder="예: 12가3456"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  성명 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.driverName}
                  onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                  placeholder="예: 홍길동"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  전화번호 <span className="text-red-400">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="예: 010-1234-5678"
                  className="h-12 text-base bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/50"
            >
              {saving ? (
                "등록 중..."
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  운송 기록 등록
                </>
              )}
            </Button>

            <Link to="/" className="block">
              <div className="bg-slate-800/30 border border-slate-700/50 p-4 text-center cursor-pointer hover:bg-slate-800/50 transition-colors">
                <p className="text-xs text-slate-400">
                  등록한 내용은 관리자 페이지에서 확인 및 수정할 수 있습니다.
                </p>
              </div>
            </Link>
          </form>
        )}

        {/* 기록 리스트 섹션 */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              나의 운송 기록
              {myRecords.length > 0 && (
                <span className="ml-2 text-sm text-slate-400">
                  ({myRecords.length}건)
                </span>
              )}
            </h2>
            <Button
              type="button"
              onClick={fetchMyRecords}
              disabled={loading}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {myRecords.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 text-center">
              <p className="text-slate-400 text-sm">등록된 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 divide-y divide-slate-700/30">
                {myRecords.map(record => (
                  <div 
                    key={record.id} 
                    className={`p-4 transition-colors ${
                      selectedRecords.has(record.id) 
                        ? 'bg-blue-500/10 border-l-4 border-l-blue-500' 
                        : 'hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 체크박스 */}
                      <button
                        onClick={() => handleSelectRecord(record.id)}
                        className="mt-1 flex-shrink-0 w-6 h-6 border-2 border-slate-500 hover:border-blue-400 transition-colors flex items-center justify-center"
                      >
                        {selectedRecords.has(record.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-400 fill-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500" />
                        )}
                      </button>

                      {/* 기록 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">
                              {record.date}
                            </span>
                            <span className="text-xs font-bold text-blue-400">
                              {record.vehicleNumber}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-emerald-400">
                            {record.invoiceAmount.toLocaleString()}원
                          </span>
                        </div>

                        <div className="text-sm text-slate-300 mb-2">
                          <span>{record.loadingPoint.split(' ')[0]}</span>
                          <span className="text-slate-600 mx-2">→</span>
                          <span>{record.unloadingPoint.split(' ')[0]}</span>
                        </div>

                        <div className="text-xs text-slate-400">
                          <span>{record.driverName}</span>
                          <span className="text-slate-600 mx-1">·</span>
                          <span>{record.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 플로팅 공유 버튼 */}
              {selectedRecords.size > 0 && (
                <div className="fixed bottom-6 right-6 z-50">
                  <Button
                    onClick={handleShareRecords}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-xl shadow-emerald-500/50 rounded-full px-8 h-14 text-base font-semibold"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    {selectedRecords.size}건 공유
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* PWA 설치 프롬프트 */}
      <InstallPWA />
    </div>
  );
}