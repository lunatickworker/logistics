export interface Record {
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
  createdAt: string;
}
