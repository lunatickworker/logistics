import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Calendar, TrendingUp, Users, Truck, FileText, ArrowUpDown, ChevronDown, ChevronUp, Download, Search } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Input } from "./ui/input";

interface SettlementViewProps {
  apiUrl: string;
  authToken: string;
}

type SortField = "key" | "count" | "totalInvoiceAmount" | "totalTransportFee";
type SortDirection = "asc" | "desc";

export function SettlementView({ apiUrl, authToken }: SettlementViewProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "by-date" | "by-user" | "by-vehicle">("daily");
  const [settlementData, setSettlementData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("totalTransportFee");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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
        toast.error(`정산 데이터 조회 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("정산 데이터 조회 중 오류:", error);
      toast.error("정산 데이터 조회 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement(activeTab === "by-date" ? "by-date" : activeTab === "by-user" ? "by-user" : activeTab === "by-vehicle" ? "by-vehicle" : activeTab);
    setSearchQuery("");
    setExpandedItems(new Set());
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

  // 정렬 및 필터링된 데이터
  const processedSettlements = useMemo(() => {
    if (!settlementData?.settlements) return [];

    let items = settlementData.settlements.map((item: any) => ({
      ...item,
      key: item.date || item.driverName || item.vehicleNumber,
    }));

    // 검색 필터
    if (searchQuery.trim()) {
      items = items.filter((item: any) => 
        item.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    items.sort((a: any, b: any) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue, 'ko-KR')
          : bValue.localeCompare(aValue, 'ko-KR');
      }
      
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return items;
  }, [settlementData, sortField, sortDirection, searchQuery]);

  // 통계 계산
  const statistics = useMemo(() => {
    if (!processedSettlements.length) return null;

    const totalInvoice = processedSettlements.reduce((sum: number, item: any) => sum + item.totalInvoiceAmount, 0);
    const totalTransport = processedSettlements.reduce((sum: number, item: any) => sum + item.totalTransportFee, 0);
    const totalCount = processedSettlements.reduce((sum: number, item: any) => sum + item.count, 0);

    const avgInvoice = totalInvoice / processedSettlements.length;
    const avgTransport = totalTransport / processedSettlements.length;
    const avgRate = totalTransport / totalInvoice;

    const maxInvoice = Math.max(...processedSettlements.map((item: any) => item.totalInvoiceAmount));
    const minInvoice = Math.min(...processedSettlements.map((item: any) => item.totalInvoiceAmount));

    return {
      totalInvoice,
      totalTransport,
      totalCount,
      avgInvoice,
      avgTransport,
      avgRate,
      maxInvoice,
      minInvoice,
      itemCount: processedSettlements.length,
    };
  }, [processedSettlements]);

  // 차트 데이터 (상위 10개)
  const chartData = useMemo(() => {
    return processedSettlements.slice(0, 10).map((item: any) => ({
      name: item.key,
      청구운임: item.totalInvoiceAmount,
      운송료: item.totalTransportFee,
    }));
  }, [processedSettlements]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const exportToCSV = () => {
    if (!processedSettlements.length) return;

    const headers = [
      activeTab === "by-date" ? "일자" : activeTab === "by-user" ? "사용자" : "차량번호",
      "건수",
      "청구운임",
      "운송료",
    ];

    const rows = processedSettlements.map((item: any) => [
      item.key,
      item.count,
      item.totalInvoiceAmount,
      item.totalTransportFee,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `정산보고서_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  return (
    <div className="space-y-6 max-w-[2048px] mx-auto">
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
              <div className="space-y-6">
                {/* 통계 카드 */}
                {statistics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 border border-blue-500/30">
                      <div className="text-xs text-blue-300 font-medium mb-1">총 항목</div>
                      <div className="text-xl font-bold text-blue-100">{statistics.itemCount}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-4 border border-emerald-500/30">
                      <div className="text-xs text-emerald-300 font-medium mb-1">총 건수</div>
                      <div className="text-xl font-bold text-emerald-100">{statistics.totalCount}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 border border-purple-500/30">
                      <div className="text-xs text-purple-300 font-medium mb-1">총 청구운임</div>
                      <div className="text-lg font-bold text-purple-100">{formatNumber(statistics.totalInvoice)}원</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 p-4 border border-pink-500/30">
                      <div className="text-xs text-pink-300 font-medium mb-1">총 운송료</div>
                      <div className="text-lg font-bold text-pink-100">{formatNumber(statistics.totalTransport)}원</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 border border-orange-500/30">
                      <div className="text-xs text-orange-300 font-medium mb-1">평균 청구운임</div>
                      <div className="text-lg font-bold text-orange-100">{formatNumber(Math.round(statistics.avgInvoice))}원</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 p-4 border border-cyan-500/30">
                      <div className="text-xs text-cyan-300 font-medium mb-1">평균 운송료</div>
                      <div className="text-lg font-bold text-cyan-100">{formatNumber(Math.round(statistics.avgTransport))}원</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-4 border border-amber-500/30">
                      <div className="text-xs text-amber-300 font-medium mb-1">평균 요율</div>
                      <div className="text-lg font-bold text-amber-100">{(statistics.avgRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                )}

                {/* 차트 */}
                {chartData.length > 0 && (
                  <div className="bg-slate-700/30 p-5 border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      상위 10개 항목 비교
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #475569',
                            borderRadius: 0
                          }}
                          labelStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number) => formatNumber(value) + '원'}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#94a3b8' }}
                        />
                        <Bar dataKey="청구운임" fill="#10b981" />
                        <Bar dataKey="운송료" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* 검색 및 내보내기 */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-700/30 border-slate-600/50 text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                  
                  <Button
                    onClick={exportToCSV}
                    className="bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV 내보내기
                  </Button>
                </div>

                {/* 정렬 가능한 테이블 헤더 */}
                <div className="bg-slate-700/50 border border-slate-600/50 overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-600/50">
                    <button
                      onClick={() => handleSort("key")}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors text-left"
                    >
                      {activeTab === "by-date" ? "일자" : activeTab === "by-user" ? "사용자" : "차량번호"}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => handleSort("count")}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors text-left"
                    >
                      건수
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => handleSort("totalInvoiceAmount")}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors text-left"
                    >
                      청구운임
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => handleSort("totalTransportFee")}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100 transition-colors text-left"
                    >
                      운송료
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 데이터 행 */}
                  <div className="divide-y divide-slate-600/30">
                    {processedSettlements.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        검색 결과가 없습니다
                      </div>
                    ) : (
                      processedSettlements.map((item: any, index: number) => {
                        const isExpanded = expandedItems.has(item.key);
                        const rate = item.totalTransportFee / item.totalInvoiceAmount;
                        
                        return (
                          <div key={item.key} className="hover:bg-slate-700/30 transition-colors">
                            <button
                              onClick={() => toggleExpand(item.key)}
                              className="w-full grid grid-cols-4 gap-4 p-4 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-1 h-8 ${index % 5 === 0 ? 'bg-purple-500' : index % 5 === 1 ? 'bg-blue-500' : index % 5 === 2 ? 'bg-emerald-500' : index % 5 === 3 ? 'bg-pink-500' : 'bg-orange-500'}`}></div>
                                <div>
                                  <div className="font-semibold text-slate-100">{item.key}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    {isExpanded ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
                                    {' '}상세보기
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-slate-200 flex items-center">
                                <span className="text-lg font-semibold">{item.count}</span>
                                <span className="text-xs text-slate-400 ml-1">건</span>
                              </div>
                              
                              <div className="text-emerald-300 flex items-center">
                                <span className="text-sm font-semibold">{formatNumber(item.totalInvoiceAmount)}</span>
                                <span className="text-xs text-emerald-400/70 ml-1">원</span>
                              </div>
                              
                              <div className="text-purple-300 flex items-center">
                                <span className="text-sm font-semibold">{formatNumber(item.totalTransportFee)}</span>
                                <span className="text-xs text-purple-400/70 ml-1">원</span>
                              </div>
                            </button>

                            {/* 확장된 상세 정보 */}
                            {isExpanded && (
                              <div className="px-4 pb-4 bg-slate-800/50">
                                <div className="border border-slate-600/50 p-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">평균 청구운임</div>
                                      <div className="text-sm font-semibold text-slate-200">
                                        {formatNumber(Math.round(item.totalInvoiceAmount / item.count))}원
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">평균 운송료</div>
                                      <div className="text-sm font-semibold text-slate-200">
                                        {formatNumber(Math.round(item.totalTransportFee / item.count))}원
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">평균 요율</div>
                                      <div className="text-sm font-semibold text-slate-200">
                                        {(rate * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">순수익</div>
                                      <div className="text-sm font-semibold text-amber-300">
                                        {formatNumber(item.totalInvoiceAmount - item.totalTransportFee)}원
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 프로그레스 바 */}
                                  <div className="mt-4">
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                      <span>운송료 비율</span>
                                      <span>{(rate * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                                        style={{ width: `${rate * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 요약 정보 */}
                {statistics && processedSettlements.length > 0 && (
                  <div className="bg-slate-700/30 p-5 border border-slate-600/50">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">요약</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">최대 청구운임: </span>
                        <span className="text-slate-100 font-semibold">{formatNumber(statistics.maxInvoice)}원</span>
                      </div>
                      <div>
                        <span className="text-slate-400">최소 청구운임: </span>
                        <span className="text-slate-100 font-semibold">{formatNumber(statistics.minInvoice)}원</span>
                      </div>
                      <div>
                        <span className="text-slate-400">표시 항목: </span>
                        <span className="text-slate-100 font-semibold">{processedSettlements.length} / {settlementData.settlements.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
