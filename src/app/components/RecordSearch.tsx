import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Search, X } from "lucide-react";

interface RecordSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  searchText: string;
  dateFrom: string;
  dateTo: string;
  vehicleNumber: string;
  driverName: string;
}

export function RecordSearch({ onSearch }: RecordSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: "",
    dateFrom: "",
    dateTo: "",
    vehicleNumber: "",
    driverName: "",
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      searchText: "",
      dateFrom: "",
      dateTo: "",
      vehicleNumber: "",
      driverName: "",
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-5 md:p-6 shadow-lg border border-slate-700/50 space-y-4">
      <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-white">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Search className="w-4 h-4 text-white" />
        </div>
        검색 및 필터
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="searchText">통합 검색</Label>
          <Input
            id="searchText"
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            placeholder="매출처, 상차지, 하차지 등"
          />
        </div>
        
        <div>
          <Label htmlFor="dateFrom">시작 일자</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="dateTo">종료 일자</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="vehicleNumber">차량번호</Label>
          <Input
            id="vehicleNumber"
            value={filters.vehicleNumber}
            onChange={(e) => setFilters({ ...filters, vehicleNumber: e.target.value })}
            placeholder="예: 12가3456"
          />
        </div>
        
        <div>
          <Label htmlFor="driverName">성명</Label>
          <Input
            id="driverName"
            value={filters.driverName}
            onChange={(e) => setFilters({ ...filters, driverName: e.target.value })}
            placeholder="운전자 성명"
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          검색
        </Button>
        <Button onClick={handleReset} variant="outline" className="gap-2">
          <X className="w-4 h-4" />
          초기화
        </Button>
      </div>
    </div>
  );
}