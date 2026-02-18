import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface FileImportProps {
  onImport: (records: any[]) => void;
}

export function FileImport({ onImport }: FileImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Excel 파일 처리
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          const records = jsonData.map((row: any) => ({
            date: row['일자'] || row['date'] || '',
            salesClient: row['매출처'] || row['salesClient'] || '',
            loadingPoint: row['상차지'] || row['loadingPoint'] || '',
            unloadingPoint: row['하차지'] || row['unloadingPoint'] || '',
            vehicleNumber: row['차량번호'] || row['vehicleNumber'] || '',
            driverName: row['성명'] || row['driverName'] || '',
            rate: parseFloat(row['요율'] || row['rate'] || '0'),
            purchaseClient: row['매입처'] || row['purchaseClient'] || '',
            invoiceAmount: parseFloat(row['청구운임'] || row['invoiceAmount'] || '0'),
          }));
          onImport(records);
        } catch (error) {
          console.error('Excel 파일 읽기 오류:', error);
          alert('Excel 파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Excel 파일만 지원됩니다.');
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Excel 샘플 파일 다운로드
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        '일자': '2026-02-17',
        '매출처': '(주)한국물류',
        '상차지': '서울특별시 강남구',
        '하차지': '부산광역시 해운대구',
        '차량번호': '12가3456',
        '성명': '홍길동',
        '요율': 0.85,
        '매입처': '(주)운송파트너',
        '청구운임': 500000,
      },
      {
        '일자': '2026-02-17',
        '매출처': '(주)대한운송',
        '상차지': '인천광역시 남동구',
        '하차지': '대전광역시 유성구',
        '차량번호': '34나5678',
        '성명': '김철수',
        '요율': 0.90,
        '매입처': '(주)물류센터',
        '청구운임': 350000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '운송기록');
    XLSX.writeFile(workbook, '운송기록_샘플.xlsx');
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-5 md:p-6 shadow-lg border border-slate-700/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <FileSpreadsheet className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-white">Excel 파일 Import</h2>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-500/20 p-4 md:p-5 border border-blue-500/30 shadow-lg shadow-blue-500/10">
          <h3 className="font-semibold text-blue-100 mb-3 text-sm md:text-base flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 flex items-center justify-center text-white text-xs">✓</div>
            지원 형식
          </h3>
          <ul className="text-xs md:text-sm text-blue-200 space-y-1.5 ml-8">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400"></span>
              Excel 파일 (.xlsx, .xls)
            </li>
          </ul>
        </div>
        
        <div className="bg-slate-700/50 p-4 md:p-5 border border-slate-600/50 shadow-lg">
          <h3 className="font-semibold text-slate-100 mb-3 text-sm md:text-base flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-500 flex items-center justify-center text-white text-xs">!</div>
            필수 컬럼명
          </h3>
          <div className="text-xs md:text-sm text-slate-200 space-y-2 ml-8">
            <p className="break-words leading-relaxed">일자, 매출처, 상차지, 하차지, 차량번호, 성명, 요율, 매입처, 청구운임</p>
            <p className="text-xs text-slate-400 mt-2 bg-slate-800/50 p-2 border border-slate-600/50">
              ※ 영문 컬럼명도 지원: date, salesClient, loadingPoint, unloadingPoint, vehicleNumber, driverName, rate, purchaseClient, invoiceAmount
            </p>
          </div>
        </div>

        <div className="bg-emerald-500/20 p-4 md:p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <h3 className="font-semibold text-emerald-100 mb-3 text-sm md:text-base flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white text-xs">↓</div>
            샘플 파일 다운로드
          </h3>
          <div className="flex ml-8">
            <Button
              onClick={downloadSampleExcel}
              variant="outline"
              className="flex-1 gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            >
              <Download className="w-4 h-4" />
              Excel 샘플 다운로드
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
        >
          <Upload className="w-4 h-4" />
          Excel 파일 선택하기
        </Button>
      </div>
    </div>
  );
}