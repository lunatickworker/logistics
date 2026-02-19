import { useState } from "react";
import { Trash2, ArrowUpDown, Save, Truck as TruckIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2, X, Share2, CheckSquare, Square, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface Record {
  id: string;
  date: string;
  salesClient: string;
  loadingPoint: string;
  unloadingPoint: string;
  vehicleNumber: string;
  driverName: string;
  phoneNumber: string;
  rate: number;
  purchaseClient: string;
  invoiceAmount: number;
  transportFee: number;
  isNew?: boolean;
}

interface RecordTableProps {
  records: Record[];
  onDelete: (id: string) => void;
  onAdd: (record: any) => void;
  onUpdate: (id: string, record: any) => void;
}

type SortField = "date" | "vehicleNumber" | "driverName" | "invoiceAmount" | "transportFee";
type SortDirection = "asc" | "desc";

export function RecordTable({ records, onDelete, onAdd, onUpdate }: RecordTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  // 새 레코드 입력 상태
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    salesClient: "",
    loadingPoint: "",
    unloadingPoint: "",
    vehicleNumber: "",
    driverName: "",
    phoneNumber: "",
    rate: "",
    purchaseClient: "",
    invoiceAmount: "",
  });
  
  // 레코드 변경 시 1초 후 자동 저장
  const handleRecordChange = (recordId: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || records.find(r => r.id === recordId)),
        [field]: value,
      }
    }));
  };
  
  // 편집 모드 종료
  const handleCancelEdit = (recordId: string) => {
    setEditingId(null);
    setEditData(prev => {
      const newData = { ...prev };
      delete newData[recordId];
      return newData;
    });
  };
  
  // 편집 모드 시작
  const handleEdit = (recordId: string) => {
    setEditingId(recordId);
    setEditData(prev => ({
      ...prev,
      [recordId]: records.find(r => r.id === recordId),
    }));
  };
  
  // 편집된 레코드 저장
  const handleSaveEdit = (recordId: string) => {
    const data = editData[recordId] || records.find(r => r.id === recordId);
    if (data) {
      const updatedData = { ...data };
      
      const rateValue = parseFloat(updatedData.rate);
      const invoiceValue = parseFloat(updatedData.invoiceAmount);
      
      // 유효성 검사
      if (isNaN(rateValue) || rateValue <= 0) {
        alert("요율은 0보다 큰 값이어야 합니다.");
        return;
      }
      
      if (isNaN(invoiceValue) || invoiceValue < 0) {
        alert("청구운임은 0 이상의 값이어야 합니다.");
        return;
      }
      
      const transportFee = Math.round(invoiceValue * rateValue);
      
      onUpdate(recordId, {
        date: updatedData.date,
        salesClient: updatedData.salesClient,
        loadingPoint: updatedData.loadingPoint,
        unloadingPoint: updatedData.unloadingPoint,
        vehicleNumber: updatedData.vehicleNumber,
        driverName: updatedData.driverName,
        phoneNumber: updatedData.phoneNumber,
        rate: rateValue,
        purchaseClient: updatedData.purchaseClient,
        invoiceAmount: invoiceValue,
        transportFee: transportFee,
      });
      
      // 저장 후 편집 데이터 제거
      setEditingId(null);
      setEditData(prev => {
        const newData = { ...prev };
        delete newData[recordId];
        return newData;
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSaveNew = () => {
    // 필수 필드 검증
    if (!newRecord.date || !newRecord.salesClient || !newRecord.loadingPoint || 
        !newRecord.unloadingPoint || !newRecord.vehicleNumber || !newRecord.driverName || 
        !newRecord.rate || !newRecord.purchaseClient || !newRecord.invoiceAmount) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    onAdd({
      ...newRecord,
      rate: parseFloat(newRecord.rate) || 0,
      invoiceAmount: parseFloat(newRecord.invoiceAmount) || 0,
    });

    // 폼 리셋
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      salesClient: "",
      loadingPoint: "",
      unloadingPoint: "",
      vehicleNumber: "",
      driverName: "",
      phoneNumber: "",
      rate: "",
      purchaseClient: "",
      invoiceAmount: "",
    });
  };

  const sortedRecords = [...records].sort((a, b) => {
    // 1. isNew 플래그 우선: NEW 레코드가 항상 맨 위
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;

    // 2. 일반 정렬 기준 적용
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      {label}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <span className="text-blue-400">↑</span>
        ) : (
          <span className="text-blue-400">↓</span>
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  );

  if (sortedRecords.length === 0 && !newRecord.date) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm shadow-lg border border-slate-700/50 p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-slate-700/50 flex items-center justify-center">
            <TruckIcon className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400">등록된 기록이 없습니다.</p>
        </div>
      </div>
    );
  }

  // 운송료 계산
  const calculatedTransportFee = newRecord.invoiceAmount && newRecord.rate
    ? Math.round(parseFloat(newRecord.invoiceAmount) * parseFloat(newRecord.rate))
    : 0;

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const currentRecords = sortedRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 레코드 선택/해제
  const toggleSelect = (id: string) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedRecords.size === currentRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(currentRecords.map(r => r.id)));
    }
  };

  // 카카오톡 공유 (Web Share API)
  const shareToKakao = async () => {
    if (selectedRecords.size === 0) {
      toast.error("공유할 기록을 선택해주세요");
      return;
    }

    const selectedData = records.filter(r => selectedRecords.has(r.id));
    
    // 이미지 형식으로 텍스트 포맷팅
    const formattedText = selectedData.map(record => {
      const date = record.date.split('-').slice(1).join('/'); // MM/DD 형식
      return `${date}. ${record.loadingPoint.split(' ')[0]} → ${record.unloadingPoint.split(' ')[0]}

운임 - ${record.vehicleNumber} ${formatNumber(record.invoiceAmount)}
${record.purchaseClient}#${record.driverName.charAt(0)}기사님 ${record.driverName}`;
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
    <div className="bg-slate-800/50 backdrop-blur-sm shadow-lg border border-slate-700/50 overflow-hidden">
      {/* 데스크톱 테이블 뷰 (md 이상) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-700/80 border-b-2 border-slate-600/50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                <SortButton field="date" label="일자" />
              </th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">매출처</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">상차지</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">하차지</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                <SortButton field="vehicleNumber" label="차량번호" />
              </th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                <SortButton field="driverName" label="성명" />
              </th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">전화번호</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">요율</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">매입처</th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                <SortButton field="invoiceAmount" label="청구운임" />
              </th>
              <th className="px-4 py-4 text-right text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">
                <SortButton field="transportFee" label="운송료" />
              </th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-slate-200 uppercase tracking-wide whitespace-nowrap">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {/* 입력 행 */}
            <tr className="bg-blue-500/10 border-b-2 border-blue-500/30">
              <td className="px-3 py-3">
                <Input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.salesClient}
                  onChange={(e) => setNewRecord({ ...newRecord, salesClient: e.target.value })}
                  placeholder="매출처"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.loadingPoint}
                  onChange={(e) => setNewRecord({ ...newRecord, loadingPoint: e.target.value })}
                  placeholder="상차지"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.unloadingPoint}
                  onChange={(e) => setNewRecord({ ...newRecord, unloadingPoint: e.target.value })}
                  placeholder="하차지"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.vehicleNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleNumber: e.target.value })}
                  placeholder="차량번호"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.driverName}
                  onChange={(e) => setNewRecord({ ...newRecord, driverName: e.target.value })}
                  placeholder="성명"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.phoneNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, phoneNumber: e.target.value })}
                  placeholder="전화번호"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  type="number"
                  step="0.01"
                  value={newRecord.rate}
                  onChange={(e) => setNewRecord({ ...newRecord, rate: e.target.value })}
                  placeholder="0.85"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  value={newRecord.purchaseClient}
                  onChange={(e) => setNewRecord({ ...newRecord, purchaseClient: e.target.value })}
                  placeholder="매입처"
                  className="h-11 text-sm bg-slate-900 border-slate-600"
                />
              </td>
              <td className="px-3 py-3">
                <Input
                  type="number"
                  value={newRecord.invoiceAmount}
                  onChange={(e) => setNewRecord({ ...newRecord, invoiceAmount: e.target.value })}
                  placeholder="500000"
                  className="h-11 text-sm bg-slate-900 border-slate-600 text-right"
                />
              </td>
              <td className="px-3 py-3 text-right">
                <div className="text-sm font-semibold text-blue-400 leading-[44px]">
                  {calculatedTransportFee > 0 ? `${formatNumber(calculatedTransportFee)}원` : "-"}
                </div>
              </td>
              <td className="px-3 py-3 text-center">
                <Button
                  onClick={handleSaveNew}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 h-11 px-4"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </td>
            </tr>

            {/* 기존 레코드 행들 */}
            {currentRecords.map((record, idx) => {
              const isEditing = editingId === record.id;
              const editedTransportFee = isEditing && editData[record.id].invoiceAmount && editData[record.id].rate
                ? Math.round(parseFloat(editData[record.id].invoiceAmount) * parseFloat(editData[record.id].rate))
                : record.transportFee;

              return isEditing ? (
                <tr key={record.id} className="bg-amber-500/10 border-b-2 border-amber-500/30">
                  <td className="px-3 py-3">
                    <Input
                      type="date"
                      value={editData[record.id].date}
                      onChange={(e) => handleRecordChange(record.id, "date", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].salesClient}
                      onChange={(e) => handleRecordChange(record.id, "salesClient", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].loadingPoint}
                      onChange={(e) => handleRecordChange(record.id, "loadingPoint", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].unloadingPoint}
                      onChange={(e) => handleRecordChange(record.id, "unloadingPoint", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].vehicleNumber}
                      onChange={(e) => handleRecordChange(record.id, "vehicleNumber", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].driverName}
                      onChange={(e) => handleRecordChange(record.id, "driverName", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].phoneNumber}
                      onChange={(e) => handleRecordChange(record.id, "phoneNumber", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={editData[record.id].rate}
                      onChange={(e) => handleRecordChange(record.id, "rate", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      value={editData[record.id].purchaseClient}
                      onChange={(e) => handleRecordChange(record.id, "purchaseClient", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      value={editData[record.id].invoiceAmount}
                      onChange={(e) => handleRecordChange(record.id, "invoiceAmount", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600 text-right"
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-sm font-semibold text-amber-400 leading-[36px]">
                      {editedTransportFee > 0 ? `${formatNumber(editedTransportFee)}원` : "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        onClick={() => handleSaveEdit(record.id)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 h-9 px-3"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleCancelEdit(record.id)}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white h-9 px-3"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={record.id} className={`hover:bg-slate-700/30 transition-colors ${record.isNew ? 'bg-red-500/10 border-l-4 border-l-red-500' : idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'}`}>
                  <td className="px-4 py-4 text-sm whitespace-nowrap font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      {record.date}
                      {record.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white animate-pulse">
                          <Bell className="w-3 h-3" />
                          NEW
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.salesClient}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.loadingPoint}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.unloadingPoint}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap font-semibold text-blue-400">{record.vehicleNumber}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.driverName}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.phoneNumber}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.rate.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-slate-300">{record.purchaseClient}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-right font-semibold text-emerald-400">{formatNumber(record.invoiceAmount)}원</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-right font-bold text-blue-400">{formatNumber(record.transportFee)}원</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record.id)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-9 px-2"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(record.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 (md 미만) */}
      <div className="md:hidden">
        {/* 새 레코드 추가 카드 */}
        <div className="p-4 bg-blue-500/10 border-b-2 border-blue-500/30">
          <div className="text-sm font-semibold text-blue-400 mb-3">새 기록 추가</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">일자</label>
              <Input
                type="date"
                value={newRecord.date}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                className="h-10 text-sm bg-slate-900 border-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">매출처</label>
                <Input
                  value={newRecord.salesClient}
                  onChange={(e) => setNewRecord({ ...newRecord, salesClient: e.target.value })}
                  placeholder="매출처"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">매입처</label>
                <Input
                  value={newRecord.purchaseClient}
                  onChange={(e) => setNewRecord({ ...newRecord, purchaseClient: e.target.value })}
                  placeholder="매입처"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">상차지</label>
                <Input
                  value={newRecord.loadingPoint}
                  onChange={(e) => setNewRecord({ ...newRecord, loadingPoint: e.target.value })}
                  placeholder="상차지"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">하차지</label>
                <Input
                  value={newRecord.unloadingPoint}
                  onChange={(e) => setNewRecord({ ...newRecord, unloadingPoint: e.target.value })}
                  placeholder="하차지"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">차량번호</label>
                <Input
                  value={newRecord.vehicleNumber}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleNumber: e.target.value })}
                  placeholder="차량번호"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">성명</label>
                <Input
                  value={newRecord.driverName}
                  onChange={(e) => setNewRecord({ ...newRecord, driverName: e.target.value })}
                  placeholder="성명"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">전화번호</label>
              <Input
                value={newRecord.phoneNumber}
                onChange={(e) => setNewRecord({ ...newRecord, phoneNumber: e.target.value })}
                placeholder="010-1234-5678"
                className="h-10 text-sm bg-slate-900 border-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">요율</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newRecord.rate}
                  onChange={(e) => setNewRecord({ ...newRecord, rate: e.target.value })}
                  placeholder="0.85"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">청구운임</label>
                <Input
                  type="number"
                  value={newRecord.invoiceAmount}
                  onChange={(e) => setNewRecord({ ...newRecord, invoiceAmount: e.target.value })}
                  placeholder="500000"
                  className="h-10 text-sm bg-slate-900 border-slate-600"
                />
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">운송료 (자동계산)</div>
              <div className="text-lg font-bold text-blue-400">
                {calculatedTransportFee > 0 ? `${formatNumber(calculatedTransportFee)}원` : "-"}
              </div>
            </div>
            <Button
              onClick={handleSaveNew}
              className="w-full bg-blue-600 hover:bg-blue-500 h-11"
            >
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        </div>

        {/* 기존 레코드 카드들 */}
        <div className="divide-y divide-slate-700/30">
          {currentRecords.map((record, idx) => {
            const isEditing = editingId === record.id;
            const editedTransportFee = isEditing && editData[record.id].invoiceAmount && editData[record.id].rate
              ? Math.round(parseFloat(editData[record.id].invoiceAmount) * parseFloat(editData[record.id].rate))
              : record.transportFee;

            return isEditing ? (
              <div key={record.id} className="p-4 bg-amber-500/10 border-l-4 border-amber-500">
                <div className="text-sm font-semibold text-amber-400 mb-3">수정 중</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">일자</label>
                    <Input
                      type="date"
                      value={editData[record.id].date}
                      onChange={(e) => handleRecordChange(record.id, "date", e.target.value)}
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">매출처</label>
                      <Input
                        value={editData[record.id].salesClient}
                        onChange={(e) => handleRecordChange(record.id, "salesClient", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">매입처</label>
                      <Input
                        value={editData[record.id].purchaseClient}
                        onChange={(e) => handleRecordChange(record.id, "purchaseClient", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">상차지</label>
                      <Input
                        value={editData[record.id].loadingPoint}
                        onChange={(e) => handleRecordChange(record.id, "loadingPoint", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">하차지</label>
                      <Input
                        value={editData[record.id].unloadingPoint}
                        onChange={(e) => handleRecordChange(record.id, "unloadingPoint", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">차량번호</label>
                      <Input
                        value={editData[record.id].vehicleNumber}
                        onChange={(e) => handleRecordChange(record.id, "vehicleNumber", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">성명</label>
                      <Input
                        value={editData[record.id].driverName}
                        onChange={(e) => handleRecordChange(record.id, "driverName", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">전화번호</label>
                    <Input
                      value={editData[record.id].phoneNumber}
                      onChange={(e) => handleRecordChange(record.id, "phoneNumber", e.target.value)}
                      placeholder="010-1234-5678"
                      className="h-9 text-sm bg-slate-900 border-slate-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">요율</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData[record.id].rate}
                        onChange={(e) => handleRecordChange(record.id, "rate", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">청구운임</label>
                      <Input
                        type="number"
                        value={editData[record.id].invoiceAmount}
                        onChange={(e) => handleRecordChange(record.id, "invoiceAmount", e.target.value)}
                        className="h-9 text-sm bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3 border border-amber-700">
                    <div className="text-xs text-slate-400 mb-1">운송료 (자동계산)</div>
                    <div className="text-lg font-bold text-amber-400">
                      {editedTransportFee > 0 ? `${formatNumber(editedTransportFee)}원` : "-"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit(record.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-10"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      저장
                    </Button>
                    <Button
                      onClick={() => handleCancelEdit(record.id)}
                      variant="ghost"
                      className="flex-1 text-slate-400 hover:text-white h-10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={record.id} className={`p-3 border-l-4 ${record.isNew ? 'bg-red-500/10 border-red-500' : idx % 2 === 0 ? 'bg-slate-800/30 border-slate-600' : 'bg-slate-800/10 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSelect(record.id)}
                      className="flex items-center justify-center w-6 h-6 border-2 border-slate-500 hover:border-blue-400 transition-colors"
                    >
                      {selectedRecords.has(record.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400 fill-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <div className="text-xs font-medium text-slate-400">{record.date}</div>
                    <div className="text-xs font-bold text-blue-400">{record.vehicleNumber}</div>
                    {record.isNew && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white animate-pulse">
                        <Bell className="w-3 h-3" />
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record.id)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(record.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-slate-300 mb-2">
                  <span className="text-slate-500">{record.driverName}</span>
                  <span className="text-slate-600 mx-1">·</span>
                  <span>{record.loadingPoint}</span>
                  <span className="text-slate-600 mx-1">→</span>
                  <span>{record.unloadingPoint}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="flex gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">매출</span>
                      <span className="text-slate-400 ml-1">{record.salesClient}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">매입</span>
                      <span className="text-slate-400 ml-1">{record.purchaseClient}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
                  <div className="text-xs">
                    <span className="text-emerald-300">청구 </span>
                    <span className="font-semibold text-emerald-400">{formatNumber(record.invoiceAmount)}원</span>
                  </div>
                  <div className="text-xs text-slate-500">×{record.rate.toFixed(2)}</div>
                  <div className="text-xs">
                    <span className="text-blue-300">운송 </span>
                    <span className="font-bold text-blue-400">{formatNumber(record.transportFee)}원</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-4 bg-slate-800/50 border-t border-slate-700/50">
        {/* 모바일 공유 버튼 - 선택 시에만 표시 */}
        {selectedRecords.size > 0 && (
          <div className="fixed bottom-20 right-4 z-50 md:hidden">
            <Button
              onClick={shareToKakao}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/50 rounded-full px-6 h-14"
            >
              <Share2 className="w-5 h-5 mr-2" />
              {selectedRecords.size}건 공유
            </Button>
          </div>
        )}
        
        {/* 페이지당 선택 */}
        <div className="hidden md:flex items-center gap-1">
          <span className="text-sm text-slate-400 mr-2">페이지당</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-600 text-slate-200 text-sm px-2 py-1 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* 모바일: 페이지당 */}
        <div className="md:hidden flex items-center gap-1">
          <span className="text-xs text-slate-400">페이지당</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-600 text-slate-200 text-sm px-2 py-1 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* 페이지네이션 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1 px-2 md:px-3">
            <span className="text-sm font-semibold text-slate-200">{currentPage}</span>
            <span className="text-sm text-slate-500">/</span>
            <span className="text-sm text-slate-400">{totalPages}</span>
          </div>

          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-none"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 전체 건수 */}
        <div className="hidden md:block text-sm text-slate-400">
          전체 <span className="font-semibold text-slate-200">{sortedRecords.length}</span>건
        </div>

        {/* 모바일: 전체 건수 */}
        <div className="md:hidden text-xs text-slate-400 whitespace-nowrap">
          전체 <span className="font-semibold text-slate-200">{sortedRecords.length}</span>건
        </div>
      </div>
    </div>
  );
}