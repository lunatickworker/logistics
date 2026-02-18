import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/server/health", (c) => {
  console.log("[Health Check] Endpoint called");
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 운송 기록 추가
app.post("/server/records", async (c) => {
  console.log("[POST /records] Request received");
  try {
    const body = await c.req.json();
    console.log("[POST /records] Request body:", body);
    const { date, salesClient, loadingPoint, unloadingPoint, vehicleNumber, driverName, phoneNumber, rate, purchaseClient, invoiceAmount, isNew } = body;
    
    const transportFee = Math.round(Number(invoiceAmount) * Number(rate));
    
    const record = await kv.createRecord({
      date,
      salesClient: salesClient || null, // 빈 문자열 대신 null
      loadingPoint,
      unloadingPoint,
      vehicleNumber,
      driverName,
      phoneNumber: phoneNumber || null, // 빈 문자열 대신 null
      rate: Number(rate) || 0,
      purchaseClient: purchaseClient || null, // 빈 문자열 대신 null
      invoiceAmount: Number(invoiceAmount),
      transportFee,
      isNew: isNew || false,
    });
    
    console.log("[POST /records] Record saved successfully:", record);
    return c.json({ success: true, record });
  } catch (error) {
    console.error(`[POST /records] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 운송 기록 조회 (전체)
app.get("/server/records", async (c) => {
  console.log("[GET /records] Request received");
  try {
    const records = await kv.getAllRecords();
    console.log(`[GET /records] Found ${records.length} records`);
    return c.json({ success: true, records });
  } catch (error) {
    console.error(`[GET /records] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 운송 기록 수정
app.put("/server/records/:id", async (c) => {
  console.log("[PUT /records/:id] Request received");
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { date, salesClient, loadingPoint, unloadingPoint, vehicleNumber, driverName, phoneNumber, rate, purchaseClient, invoiceAmount, isNew } = body;
    
    const transportFee = Math.round(Number(invoiceAmount) * Number(rate));
    
    const record = await kv.updateRecord(id, {
      date,
      salesClient: salesClient || "",
      loadingPoint,
      unloadingPoint,
      vehicleNumber,
      driverName,
      phoneNumber: phoneNumber || "",
      rate: Number(rate) || 0,
      purchaseClient: purchaseClient || "",
      invoiceAmount: Number(invoiceAmount),
      transportFee,
      isNew: isNew || false,
    });
    
    console.log("[PUT /records/:id] Record updated successfully");
    return c.json({ success: true, record });
  } catch (error) {
    console.error(`[PUT /records/:id] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 운송 기록 삭제
app.delete("/server/records/:id", async (c) => {
  console.log("[DELETE /records/:id] Request received");
  try {
    const id = c.req.param("id");
    await kv.deleteRecord(id);
    console.log("[DELETE /records/:id] Record deleted successfully");
    return c.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /records/:id] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// CSV/Excel 데이터 일괄 import
app.post("/server/import", async (c) => {
  console.log("[POST /import] Request received");
  try {
    const body = await c.req.json();
    const { records } = body;
    
    const importedRecords = await kv.importRecords(records);
    console.log(`[POST /import] Successfully imported ${importedRecords.length} records`);
    return c.json({ success: true, count: importedRecords.length, records: importedRecords });
  } catch (error) {
    console.error(`[POST /import] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 일일 정산
app.get("/server/settlement/daily", async (c) => {
  console.log("[GET /settlement/daily] Request received");
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await kv.getDailySettlement(today);
    console.log(`[GET /settlement/daily] Found ${result.count} records for ${today}`);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error(`[GET /settlement/daily] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 매월 정산
app.get("/server/settlement/monthly", async (c) => {
  console.log("[GET /settlement/monthly] Request received");
  try {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const result = await kv.getMonthlySettlement(currentMonth);
    console.log(`[GET /settlement/monthly] Found ${result.count} records for ${currentMonth}`);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error(`[GET /settlement/monthly] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 일자별 정산
app.get("/server/settlement/by-date", async (c) => {
  console.log("[GET /settlement/by-date] Request received");
  try {
    const settlements = await kv.getSettlementByDate();
    console.log(`[GET /settlement/by-date] Found ${settlements.length} unique dates`);
    return c.json({ success: true, settlements });
  } catch (error) {
    console.error(`[GET /settlement/by-date] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 사용자(성명)별 정산
app.get("/server/settlement/by-user", async (c) => {
  console.log("[GET /settlement/by-user] Request received");
  try {
    const settlements = await kv.getSettlementByUser();
    console.log(`[GET /settlement/by-user] Found ${settlements.length} unique users`);
    return c.json({ success: true, settlements });
  } catch (error) {
    console.error(`[GET /settlement/by-user] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 차량번호별 정산
app.get("/server/settlement/by-vehicle", async (c) => {
  console.log("[GET /settlement/by-vehicle] Request received");
  try {
    const settlements = await kv.getSettlementByVehicle();
    console.log(`[GET /settlement/by-vehicle] Found ${settlements.length} unique vehicles`);
    return c.json({ success: true, settlements });
  } catch (error) {
    console.error(`[GET /settlement/by-vehicle] Error:`, error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);