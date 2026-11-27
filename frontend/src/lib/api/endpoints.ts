import type {
  AvailabilitySort,
  AvailableCarResponse,
  CarImageResponse,
  CarRequest,
  CarResponse,
  CarUpdateRequest,
  CurrentUser,
  CustomerRegisterRequest,
  CustomerResponse,
  CustomerUpdateRequest,
  LocalDateTime,
  PricingPolicyResponse,
  RentalRequest,
  RentalResponse,
  RollbackRequest,
  TransactionStatus,
  UUID,
} from "./types";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | undefined>;
  json?: unknown;
  form?: FormData;
  /**
   * required: token gerekir; 401 gelirse oturum düşmüştür (tarayıcıda girişe yönlendirilir).
   * optional: token varsa gönderilir, 401 sadece "giriş yapılmamış" demektir.
   * none: herkese açık uç; token gönderilmez.
   */
  auth?: "required" | "optional" | "none";
}

/** Backend yolu ("/api/cars") ve seçenekleri alıp cevabı döndüren taşıyıcı. Sunucu ve tarayıcı için iki uygulaması var. */
export type Transport = <T>(path: string, options?: RequestOptions) => Promise<T>;

const seg = (value: string) => encodeURIComponent(value);

/**
 * Bütün backend uçları burada, tek yerde. Sunucu bileşenleri `serverApi`, tarayıcı `clientApi` ile kullanır;
 * ikisi de bu fonksiyondan üretilir.
 */
export function createApi(request: Transport) {
  return {
    auth: {
      me: () => request<CurrentUser>("/api/auth/me", { auth: "optional" }),
    },

    customers: {
      register: (body: CustomerRegisterRequest) =>
        request<CustomerResponse>("/api/customers/register", { method: "POST", json: body, auth: "none" }),
      get: (id: UUID) => request<CustomerResponse>(`/api/customers/${seg(id)}`),
      update: (id: UUID, body: CustomerUpdateRequest) =>
        request<CustomerResponse>(`/api/customers/${seg(id)}`, { method: "PUT", json: body }),
      /** amount: "500.00" gibi; backend bunu sorgu parametresi olarak bekliyor */
      loadBalance: (id: UUID, amount: string) =>
        request<string>(`/api/customers/${seg(id)}/balance`, { method: "PUT", query: { amount } }),
      list: () => request<CustomerResponse[]>("/api/customers"),
      byEmail: (email: string) => request<CustomerResponse>(`/api/customers/email/${seg(email)}`),
      searchByFirstName: (name: string) =>
        request<CustomerResponse[]>("/api/customers/search/firstname", { query: { name } }),
      searchByLicenseYear: (year: number) =>
        request<CustomerResponse[]>("/api/customers/search/licenseyear", { query: { year } }),
      remove: (id: UUID) => request<string>(`/api/customers/${seg(id)}`, { method: "DELETE" }),
    },

    cars: {
      list: () => request<CarResponse[]>("/api/cars", { auth: "none" }),
      get: (id: UUID) => request<CarResponse>(`/api/cars/${seg(id)}`, { auth: "none" }),
      available: (params: { start: LocalDateTime; days: number; sort?: AvailabilitySort }) =>
        request<AvailableCarResponse[]>("/api/cars/available", {
          auth: "none",
          query: { start: params.start, days: params.days, sort: params.sort },
        }),
      create: (body: CarRequest) => request<CarResponse>("/api/cars", { method: "POST", json: body }),
      update: (id: UUID, body: CarUpdateRequest) =>
        request<CarResponse>(`/api/cars/${seg(id)}`, { method: "PUT", json: body }),
      setMaintenance: (id: UUID) => request<string>(`/api/cars/${seg(id)}/maintenance`, { method: "PUT" }),
      setAvailable: (id: UUID) => request<string>(`/api/cars/${seg(id)}/available`, { method: "PUT" }),
      remove: (id: UUID) => request<string>(`/api/cars/${seg(id)}`, { method: "DELETE" }),
    },

    images: {
      list: (carId: UUID) => request<CarImageResponse[]>(`/api/cars/${seg(carId)}/images`, { auth: "none" }),
      upload: (carId: UUID, files: readonly File[]) => {
        const form = new FormData();
        for (const file of files) form.append("files", file, file.name);
        return request<CarImageResponse[]>(`/api/cars/${seg(carId)}/images`, { method: "POST", form });
      },
      makeCover: (carId: UUID, imageId: UUID) =>
        request<CarImageResponse[]>(`/api/cars/${seg(carId)}/images/${seg(imageId)}/cover`, { method: "PUT" }),
      remove: (carId: UUID, imageId: UUID) =>
        request<void>(`/api/cars/${seg(carId)}/images/${seg(imageId)}`, { method: "DELETE" }),
    },

    pricing: {
      policies: () => request<PricingPolicyResponse[]>("/api/pricing/policies", { auth: "none" }),
      /** rate: "0.1500" gibi, 0 ≤ rate < 1 */
      updateRate: (policyName: string, rate: string) =>
        request<string>(`/api/pricing/policies/${seg(policyName)}`, { method: "PUT", query: { rate } }),
    },

    rentals: {
      create: (body: RentalRequest) => request<RentalResponse>("/api/rentals", { method: "POST", json: body }),
      get: (id: UUID) => request<RentalResponse>(`/api/rentals/${seg(id)}`),
      cancel: (id: UUID) => request<RentalResponse>(`/api/rentals/${seg(id)}/cancel`, { method: "PUT" }),
      byCustomer: (customerId: UUID) => request<RentalResponse[]>(`/api/rentals/customer/${seg(customerId)}`),
      list: () => request<RentalResponse[]>("/api/rentals"),
      byStatus: (status: TransactionStatus) => request<RentalResponse[]>(`/api/rentals/status/${seg(status)}`),
      byCar: (carId: UUID) => request<RentalResponse[]>(`/api/rentals/car/${seg(carId)}`),
      pickup: (id: UUID) => request<string>(`/api/rentals/${seg(id)}/pickup`, { method: "PUT" }),
      complete: (id: UUID) => request<string>(`/api/rentals/${seg(id)}/return`, { method: "PUT" }),
      rollback: (id: UUID, body: RollbackRequest) =>
        request<RentalResponse>(`/api/rentals/${seg(id)}/rollback`, { method: "PUT", json: body }),
    },
  };
}

export type Api = ReturnType<typeof createApi>;

/** Sorgu dizesi; undefined değerler atlanır. */
export function buildQuery(query: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}
