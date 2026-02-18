import { Button } from "./ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface Record {
  id: string;
  date: string;
  salesClient: string;
  loadingPoint: string;
  unloadingPoint: string;
  vehicleNumber: string;
  driverName: string;
  rate: number;
  purchaseClient: string;
  invoiceAmount: number;
  transportFee: number;
  createdAt: string;
}

interface ExportButtonProps {
  records: Record[];
  format: "csv" | "excel";
}

export function ExportButton({ records, format }: ExportButtonProps) {
  const exportData = () => {
    if (records.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    // 데이터를 한글 컬럼명으로 변환
    const exportRecords = records.map((record) => ({
      일자: record.date,
      매출처: record.salesClient,
      상차지: record.loadingPoint,
      하차지: record.unloadingPoint,
      차량번호: record.vehicleNumber,
      성명: record.driverName,
      요율: record.rate,
      매입처: record.purchaseClient,
      청구운임: record.invoiceAmount,
      운송료: record.transportFee,
    }));

    if (format === "csv") {
      const csv = Papa.unparse(exportRecords);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `운송기록_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportRecords);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '운송기록');
      XLSX.writeFile(workbook, `운송기록_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  return (
    <Button onClick={exportData} variant="outline" className="gap-2 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">{format === "csv" ? "CSV" : "Excel"} 다운로드</span>
      <span className="sm:hidden">{format === "csv" ? "CSV" : "Excel"}</span>
    </Button>
  );
}