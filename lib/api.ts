export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CreateVoucherRequest {
  amount_usd: number;
}

export interface CreateVoucherResponse {
  success: boolean;
  voucher_code: string;
  amount_ghs: number;
  amount_usd: number;
}

export interface ValidateVoucherRequest {
  code: string;
}

export interface ValidateVoucherResponse {
  success: boolean;
  valid: boolean;
  amount_usd: number;
  amount_ghs: number;
  status: string;
  message: string;
}

export interface ClaimVoucherRequest {
  code: string;
  receiver_name: string;
  receiver_phone: string;
  network: string;
}

export interface ClaimVoucherResponse {
  success: boolean;
  message: string;
  voucher: {
    id: number;
    code: string;
    amount_usd: number;
    amount_ghs: number;
    status: string;
    receiver_name: string;
    receiver_phone: string;
    network: string;
    created_at: string;
    claimed_at: string;
  };
}

export interface Voucher {
  id: number;
  code: string;
  amount_usd: number;
  amount_ghs: number;
  status: string;
  receiver_name?: string;
  receiver_phone?: string;
  network?: string;
  created_at: string;
  claimed_at?: string;
}

export interface GetVouchersResponse {
  success: boolean;
  count: number;
  vouchers: Voucher[];
}

export interface UpdateVoucherRequest {
  code: string;
  status: string;
}

export interface UpdateVoucherResponse {
  success: boolean;
  message: string;
  voucher: {
    id: number;
    code: string;
    status: string;
  };
  error?: string;
}

export interface InitializePaymentRequest {
  amount_usd: number;
}

export interface InitializePaymentResponse {
  success: boolean;
  authorization_url?: string;
  reference?: string;
  amount_usd?: number;
  amount_ghs?: number;
  error?: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  voucher: {
    code: string;
    amount_usd: number;
    amount_ghs: number;
  };
  payment_details?: {
    reference: string;
    amount_paid: number;
    currency: string;
    paid_at: string;
  };
}

export interface ConfigResponse {
  success: boolean;
  config: {
    today_rate: number;
    percentage: number;
    updated_at: string;
  };
  error?: string;
}

export interface UpdateConfigRequest {
  today_rate: number;
  percentage: number;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Request failed',
        response.status
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred');
  }
}

export const api = {
  // Voucher operations
  createVoucher: (data: CreateVoucherRequest) =>
    apiRequest<CreateVoucherResponse>('/voucher/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  validateVoucher: (data: ValidateVoucherRequest) =>
    apiRequest<ValidateVoucherResponse>('/voucher/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  claimVoucher: (data: ClaimVoucherRequest) =>
    apiRequest<ClaimVoucherResponse>('/voucher/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin operations
  getVouchers: () =>
    apiRequest<GetVouchersResponse>('/admin/vouchers'),

  updateVoucherStatus: (data: UpdateVoucherRequest) =>
    apiRequest<UpdateVoucherResponse>('/admin/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Payment operations
  initializePayment: (data: InitializePaymentRequest) =>
    apiRequest<InitializePaymentResponse>('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyPayment: (data: VerifyPaymentRequest) =>
    apiRequest<VerifyPaymentResponse>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Configuration operations
  getConfig: () =>
    apiRequest<ConfigResponse>('/config'),

  updateConfig: (data: UpdateConfigRequest) =>
    apiRequest<ConfigResponse>('/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export { ApiError };
