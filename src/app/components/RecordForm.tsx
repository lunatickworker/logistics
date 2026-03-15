import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, Calendar, MapPin, Truck, Calculator } from "lucide-react";

interface RecordFormProps {
  onSubmit: (record: any) => void;
}

export function RecordForm({ onSubmit }: RecordFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    salesClient: "",
    loadingPoint: "",
    unloadingPoint: "",
    vehicleNumber: "",
    driverName: "",
    transportFee: "",
    purchaseClient: "",
    invoiceAmount: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = parseFloat(formData.invoiceAmount) || 0;
    const tf = parseFloat(formData.transportFee);
    const rate = (!isNaN(tf) && invoice > 0) ? tf / invoice : 0;

    onSubmit({
      ...formData,
      rate: rate,
      invoiceAmount: invoice,
      transportFee: !isNaN(tf) ? Math.round(tf) : 0,
    });

    // 폼 리셋
    setFormData({
      date: new Date().toISOString().split('T')[0],
      salesClient: "",
      loadingPoint: "",
      unloadingPoint: "",
      vehicleNumber: "",
      driverName: "",
      transportFee: "",
      purchaseClient: "",
      invoiceAmount: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 shadow-lg">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 border-b border-blue-400/20">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5" />
          새 운송 기록 추가
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* 섹션 1: 일자 및 거래처 정보 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-600/50">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">일자 및 거래처</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-300 font-medium">일자</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesClient" className="text-slate-300 font-medium">매출처</Label>
              <Input
                id="salesClient"
                value={formData.salesClient}
                onChange={(e) => setFormData({ ...formData, salesClient: e.target.value })}
                placeholder="매출처 입력"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseClient" className="text-slate-300 font-medium">매입처</Label>
              <Input
                id="purchaseClient"
                value={formData.purchaseClient}
                onChange={(e) => setFormData({ ...formData, purchaseClient: e.target.value })}
                placeholder="매입처 입력"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>
          </div>
        </div>

        {/* 섹션 2: 운송 경로 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-600/50">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">운송 경로</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loadingPoint" className="text-slate-300 font-medium">상차지</Label>
              <Input
                id="loadingPoint"
                value={formData.loadingPoint}
                onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                placeholder="상차지 입력"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unloadingPoint" className="text-slate-300 font-medium">하차지</Label>
              <Input
                id="unloadingPoint"
                value={formData.unloadingPoint}
                onChange={(e) => setFormData({ ...formData, unloadingPoint: e.target.value })}
                placeholder="하차지 입력"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>
          </div>
        </div>

        {/* 섹션 3: 차량 및 운전자 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-600/50">
            <Truck className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">차량 및 운전자</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber" className="text-slate-300 font-medium">차량번호</Label>
              <Input
                id="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="예: 12가3456"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverName" className="text-slate-300 font-medium">운전자 성명</Label>
              <Input
                id="driverName"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="운전자 성명"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>
          </div>
        </div>

        {/* 섹션 4: 금액 정보 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-600/50">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">금액 정보</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceAmount" className="text-slate-300 font-medium">청구운임 (원)</Label>
              <Input
                id="invoiceAmount"
                type="number"
                value={formData.invoiceAmount}
                onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                placeholder="예: 500000"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportFee" className="text-slate-300 font-medium">운송료</Label>
              <Input
                id="transportFee"
                type="number"
                step="1"
                value={formData.transportFee}
                onChange={(e) => setFormData({ ...formData, transportFee: e.target.value })}
                placeholder="예: 425000"
                className="bg-slate-900/50 border-slate-600 text-white h-11"
              />
            </div>
          </div>

          {/* 요율 미리보기 (운송료/청구운임) */}
          {formData.invoiceAmount && formData.transportFee && (
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-300">계산된 요율</span>
                <span className="text-xl font-bold text-blue-400">
                  {(() => {
                    const invoice = parseFloat(formData.invoiceAmount) || 0;
                    const tf = parseFloat(formData.transportFee) || 0;
                    const r = invoice > 0 ? tf / invoice : 0;
                    return `${(r * 100).toFixed(2)}%`;
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end pt-4 border-t border-slate-700/50">
          <Button type="submit" className="gap-2 bg-blue-600 hover:bg-blue-500 h-11 px-6">
            <Plus className="w-4 h-4" />
            기록 추가
          </Button>
        </div>
      </div>
    </form>
  );
}
