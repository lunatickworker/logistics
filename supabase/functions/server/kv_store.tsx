/**
 * 데이터 저장소 레이어
 * PostgreSQL transport_records 테이블에 대한 모든 데이터 액세스 로직을 담당
 */

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

/**
 * 데이터베이스 행을 프론트엔드 형식으로 변환
 */
function mapRowToRecord(row: any) {
  return {
    id: row.id,
    date: row.date,
    salesClient: row.sales_client || "",
    loadingPoint: row.loading_point,
    unloadingPoint: row.unloading_point,
    vehicleNumber: row.vehicle_number,
    driverName: row.driver_name,
    phoneNumber: row.phone_number || "",
    rate: row.rate,
    purchaseClient: row.purchase_client || "",
    invoiceAmount: row.invoice_amount,
    transportFee: row.transport_fee,
    isNew: row.is_new,
    createdAt: row.created_at,
  };
}

/**
 * 전체 운송 기록 조회
 */
export async function getAllRecords() {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }

  return data.map(mapRowToRecord);
}

/**
 * 새 운송 기록 추가
 */
export async function createRecord(recordData: {
  date: string;
  salesClient: string | null;
  loadingPoint: string;
  unloadingPoint: string;
  vehicleNumber: string;
  driverName: string;
  phoneNumber: string | null;
  rate: number;
  purchaseClient: string | null;
  invoiceAmount: number;
  transportFee: number;
  isNew: boolean;
}) {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .insert([
      {
        date: recordData.date,
        sales_client: recordData.salesClient,
        loading_point: recordData.loadingPoint,
        unloading_point: recordData.unloadingPoint,
        vehicle_number: recordData.vehicleNumber,
        driver_name: recordData.driverName,
        phone_number: recordData.phoneNumber,
        rate: recordData.rate,
        purchase_client: recordData.purchaseClient,
        invoice_amount: recordData.invoiceAmount,
        transport_fee: recordData.transportFee,
        is_new: recordData.isNew,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create record: ${error.message}`);
  }

  return mapRowToRecord(data);
}

/**
 * 운송 기록 수정
 */
export async function updateRecord(
  id: string,
  recordData: {
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
    isNew: boolean;
  }
) {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .update({
      date: recordData.date,
      sales_client: recordData.salesClient,
      loading_point: recordData.loadingPoint,
      unloading_point: recordData.unloadingPoint,
      vehicle_number: recordData.vehicleNumber,
      driver_name: recordData.driverName,
      phone_number: recordData.phoneNumber,
      rate: recordData.rate,
      purchase_client: recordData.purchaseClient,
      invoice_amount: recordData.invoiceAmount,
      transport_fee: recordData.transportFee,
      is_new: recordData.isNew,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update record: ${error.message}`);
  }

  return mapRowToRecord(data);
}

/**
 * 운송 기록 삭제
 */
export async function deleteRecord(id: string) {
  const supabase = client();
  const { error } = await supabase
    .from("transport_records")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete record: ${error.message}`);
  }

  return true;
}

/**
 * 여러 기록 일괄 추가 (Import)
 */
export async function importRecords(records: any[]) {
  const supabase = client();
  const recordsToInsert = records.map((item) => {
    const rate = Number(item.rate) || 0;
    const invoiceAmount = Number(item.invoiceAmount) || 0;
    const transportFee = Math.round(invoiceAmount * rate);

    return {
      date: item.date || "",
      sales_client: item.salesClient || "",
      loading_point: item.loadingPoint || "",
      unloading_point: item.unloadingPoint || "",
      vehicle_number: item.vehicleNumber || "",
      driver_name: item.driverName || "",
      phone_number: item.phoneNumber || "",
      rate,
      purchase_client: item.purchaseClient || "",
      invoice_amount: invoiceAmount,
      transport_fee: transportFee,
      is_new: item.isNew || false,
    };
  });

  const { data, error } = await supabase
    .from("transport_records")
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw new Error(`Failed to import records: ${error.message}`);
  }

  return data.map(mapRowToRecord);
}

/**
 * 일일 정산 조회
 */
export async function getDailySettlement(date: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .eq("date", date);

  if (error) {
    throw new Error(`Failed to fetch daily settlement: ${error.message}`);
  }

  const records = data.map(mapRowToRecord);
  const totalInvoiceAmount = records.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);
  const totalTransportFee = records.reduce((sum, r) => sum + (r.transportFee || 0), 0);

  return {
    date,
    count: records.length,
    totalInvoiceAmount,
    totalTransportFee,
    records,
  };
}

/**
 * 월간 정산 조회
 */
export async function getMonthlySettlement(month: string) {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .gte("date", `${month}-01`)
    .lt("date", `${month}-32`);

  if (error) {
    throw new Error(`Failed to fetch monthly settlement: ${error.message}`);
  }

  const records = data.map(mapRowToRecord);
  const totalInvoiceAmount = records.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);
  const totalTransportFee = records.reduce((sum, r) => sum + (r.transportFee || 0), 0);

  return {
    month,
    count: records.length,
    totalInvoiceAmount,
    totalTransportFee,
    records,
  };
}

/**
 * 일자별 정산 조회
 */
export async function getSettlementByDate() {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch settlement by date: ${error.message}`);
  }

  const byDate: any = {};
  data.forEach((row) => {
    const date = row.date || "미지정";
    if (!byDate[date]) {
      byDate[date] = {
        date,
        count: 0,
        totalInvoiceAmount: 0,
        totalTransportFee: 0,
        records: [],
      };
    }

    const record = mapRowToRecord(row);
    byDate[date].count++;
    byDate[date].totalInvoiceAmount += Number(row.invoice_amount) || 0;
    byDate[date].totalTransportFee += Number(row.transport_fee) || 0;
    byDate[date].records.push(record);
  });

  return Object.values(byDate).sort((a: any, b: any) => b.date.localeCompare(a.date));
}

/**
 * 사용자(성명)별 정산 조회
 */
export async function getSettlementByUser() {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .order("driver_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch settlement by user: ${error.message}`);
  }

  const byUser: any = {};
  data.forEach((row) => {
    const user = row.driver_name || "미지정";
    if (!byUser[user]) {
      byUser[user] = {
        driverName: user,
        count: 0,
        totalInvoiceAmount: 0,
        totalTransportFee: 0,
        records: [],
      };
    }

    const record = mapRowToRecord(row);
    byUser[user].count++;
    byUser[user].totalInvoiceAmount += Number(row.invoice_amount) || 0;
    byUser[user].totalTransportFee += Number(row.transport_fee) || 0;
    byUser[user].records.push(record);
  });

  return Object.values(byUser).sort((a: any, b: any) => b.count - a.count);
}

/**
 * 차량번호별 정산 조회
 */
export async function getSettlementByVehicle() {
  const supabase = client();
  const { data, error } = await supabase
    .from("transport_records")
    .select("*")
    .order("vehicle_number", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch settlement by vehicle: ${error.message}`);
  }

  const byVehicle: any = {};
  data.forEach((row) => {
    const vehicle = row.vehicle_number || "미지정";
    if (!byVehicle[vehicle]) {
      byVehicle[vehicle] = {
        vehicleNumber: vehicle,
        count: 0,
        totalInvoiceAmount: 0,
        totalTransportFee: 0,
        records: [],
      };
    }

    const record = mapRowToRecord(row);
    byVehicle[vehicle].count++;
    byVehicle[vehicle].totalInvoiceAmount += Number(row.invoice_amount) || 0;
    byVehicle[vehicle].totalTransportFee += Number(row.transport_fee) || 0;
    byVehicle[vehicle].records.push(record);
  });

  return Object.values(byVehicle).sort((a: any, b: any) => b.count - a.count);
}