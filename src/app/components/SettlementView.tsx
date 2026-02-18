import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar, TrendingUp, Users, Truck, FileText } from "lucide-react";
import { BarChart3 } from "lucide-react";

interface SettlementViewProps {
  apiUrl: string;
  authToken: string;
}

export function SettlementView({ apiUrl, authToken }: SettlementViewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "by-date" | "by-user" | "by-vehicle">("daily");
  const [settlementData, setSettlementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettlement = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/settlement/${type}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSettlementData(data);
      } else {
        console.error("정산 데이터 조회 실패:", data.error);
      }
    } catch (error) {
      console.error("정산 데이터 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement(activeTab === "by-date" ? "by-date" : activeTab === "by-user" ? "by-user" : activeTab === "by-vehicle" ? "by-vehicle" : activeTab);
  }, [activeTab]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const tabs = [
    { id: "daily" as const, label: "일일정산", icon: Calendar },
    { id: "monthly" as const, label: "월간정산", icon: TrendingUp },
    { id: "by-date" as const, label: "일자별", icon: FileText },
    { id: "by-user" as const, label: "사용자별", icon: Users },
    { id: "by-vehicle" as const, label: "차량별", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/80 backdrop-blur-sm shadow-lg border border-slate-700/50 p-5 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">정산 보고서</h2>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`gap-2 flex-shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30' 
                  : 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">로딩 중...</div>
        ) : (
          <div className="space-y-6">
            {/* 일일 및 월간 정산 */}
            {(activeTab === "daily" || activeTab === "monthly") && settlementData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-500/20 p-5 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                    <div className="text-sm text-blue-300 font-medium">
                      {activeTab === "daily" ? "일자" : "월"}
                    </div>
                    <div className="text-2xl font-bold text-blue-100 mt-1">
                      {settlementData.date || settlementData.month}
                    </div>
                  </div>
                  
                  <div className="bg-emerald-500/20 p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                    <div className="text-sm text-emerald-300 font-medium">총 청구운임</div>
                    <div className="text-2xl font-bold text-emerald-100 mt-1">
                      {formatNumber(settlementData.totalInvoiceAmount)}원
                    </div>
                  </div>
                  
                  <div className="bg-purple-500/20 p-5 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <div className="text-sm text-purple-300 font-medium">총 운송료</div>
                    <div className="text-2xl font-bold text-purple-100 mt-1">
                      {formatNumber(settlementData.totalTransportFee)}원
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 p-5 border border-slate-600/50">
                  <div className="text-sm text-slate-300">총 건수</div>
                  <div className="text-xl font-semibold text-slate-100 mt-1">
                    {settlementData.count}건
                  </div>
                </div>
              </div>
            )}

            {/* 일자별/사용자별/차량별 정산 */}
            {(activeTab === "by-date" || activeTab === "by-user" || activeTab === "by-vehicle") && settlementData?.settlements && (
              <div className="space-y-3">
                {settlementData.settlements.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-700/30 border border-slate-600/50 p-4 hover:bg-slate-700/50 hover:border-slate-500/50 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-100">
                          {activeTab === "by-date" && item.date}
                          {activeTab === "by-user" && `${item.driverName} 님`}
                          {activeTab === "by-vehicle" && item.vehicleNumber}
                        </h3>
                        <div className="text-sm text-slate-400 mt-1">총 {item.count}건</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/20 px-4 py-2.5 border border-emerald-500/30">
                          <div className="text-xs text-emerald-300">청구운임</div>
                          <div className="text-sm font-semibold text-emerald-100">
                            {formatNumber(item.totalInvoiceAmount)}원
                          </div>
                        </div>
                        
                        <div className="bg-purple-500/20 px-4 py-2.5 border border-purple-500/30">
                          <div className="text-xs text-purple-300">운송료</div>
                          <div className="text-sm font-semibold text-purple-100">
                            {formatNumber(item.totalTransportFee)}원
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}