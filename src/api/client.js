const API_BASE = "/api";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getLanguage() {
  try {
    const stored = localStorage.getItem("planlyze-language");
    if (stored) return stored.split("-")[0];
  } catch (e) {}
  return "ar";
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token");
  const lang = getLanguage();

  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": lang,
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || "Request failed", response.status, data);
  }

  return data;
}

export const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
};

export const auth = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  verifyEmail: (email, code) => api.post("/auth/verify-email", { email, code }),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }),
  me: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/me", data),
  changePassword: (data) => api.post("/auth/change-password", data),
  logout: () => api.post("/auth/logout"),

  setToken: (token) => localStorage.setItem("auth_token", token),
  getToken: () => localStorage.getItem("auth_token"),
  removeToken: () => localStorage.removeItem("auth_token"),
  isAuthenticated: () => !!localStorage.getItem("auth_token"),
};

export const Analysis = {
  list: () => api.get("/analyses"),
  listAll: () => api.get("/analyses/all"),
  get: (id) => api.get(`/analyses/${id}`),
  create: (data) => api.post("/analyses", data),
  update: (id, data) => api.put(`/analyses/${id}`, data),
  delete: (id) => api.delete(`/analyses/${id}`),
  filter: async (filters) => {
    const analyses = await api.get("/analyses");
    if (!filters || Object.keys(filters).length === 0) return analyses;
    return analyses.filter((a) => {
      for (const [key, value] of Object.entries(filters)) {
        if (a[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Transaction = {
  list: () => api.get("/transactions"),
  create: (data) => api.post("/transactions", data),
  filter: async (filters) => {
    const transactions = await api.get("/transactions");
    if (!filters || Object.keys(filters).length === 0) return transactions;
    return transactions.filter((t) => {
      for (const [key, value] of Object.entries(filters)) {
        if (t[key] !== value) return false;
      }
      return true;
    });
  },
};

export const CreditPackage = {
  list: () => api.get("/credit-packages"),
  create: (data) => api.post("/credit-packages", data),
  update: (id, data) => api.put(`/credit-packages/${id}`, data),
  delete: (id) => api.delete(`/credit-packages/${id}`),
  filter: async (filters) => {
    const packages = await api.get("/credit-packages");
    if (!filters || Object.keys(filters).length === 0) return packages;
    return packages.filter((p) => {
      for (const [key, value] of Object.entries(filters)) {
        if (p[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Payment = {
  list: () => api.get("/payments"),
  create: (data) => api.post("/payments", data),
  approve: (id) => api.post(`/payments/${id}/approve`),
  reject: (id, reason) => api.post(`/payments/${id}/reject`, { reason }),
  filter: async (filters) => {
    const payments = await api.get("/payments");
    if (!filters || Object.keys(filters).length === 0) return payments;
    return payments.filter((p) => {
      for (const [key, value] of Object.entries(filters)) {
        if (p[key] !== value) return false;
      }
      return true;
    });
  },
};

export const EmailTemplate = {
  list: () => api.get("/email-templates"),
  create: (data) => api.post("/email-templates", data),
  update: (id, data) => api.put(`/email-templates/${id}`, data),
  filter: async (filters) => {
    const templates = await api.get("/email-templates");
    if (!filters || Object.keys(filters).length === 0) return templates;
    return templates.filter((t) => {
      for (const [key, value] of Object.entries(filters)) {
        if (t[key] !== value) return false;
      }
      return true;
    });
  },
};

export const PaymentMethod = {
  list: async (sortBy) => {
    const methods = await api.get("/payment-methods");
    if (sortBy && Array.isArray(methods)) {
      return methods.sort((a, b) => (a[sortBy] || 0) - (b[sortBy] || 0));
    }
    return methods;
  },
  create: (data) => api.post("/payment-methods", data),
  update: (id, data) => api.put(`/payment-methods/${id}`, data),
  filter: async (filters, sortBy) => {
    const methods = await api.get("/payment-methods");
    let result = methods;
    if (filters && Object.keys(filters).length > 0) {
      result = methods.filter((m) => {
        for (const [key, value] of Object.entries(filters)) {
          if (m[key] !== value) return false;
        }
        return true;
      });
    }
    if (sortBy && Array.isArray(result)) {
      result = result.sort((a, b) => (a[sortBy] || 0) - (b[sortBy] || 0));
    }
    return result;
  },
};

export const DiscountCode = {
  list: () => api.get("/discount-codes"),
  create: (data) => api.post("/discount-codes", data),
  update: (id, data) => api.put(`/discount-codes/${id}`, data),
  delete: (id) => api.delete(`/discount-codes/${id}`),
  validate: (code) => api.post("/discount-codes/validate", { code }),
  getUsers: (id) => api.get(`/discount-codes/${id}/users`),
  filter: async (filters) => {
    const codes = await api.get("/discount-codes");
    if (!filters || Object.keys(filters).length === 0) return codes;
    return codes.filter((c) => {
      for (const [key, value] of Object.entries(filters)) {
        if (c[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Role = {
  list: () => api.get("/roles"),
  get: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post("/roles", data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  filter: async (filters, sortBy) => {
    const roles = await api.get("/roles");
    let result = roles;
    if (filters && Object.keys(filters).length > 0) {
      result = roles.filter((r) => {
        for (const [key, value] of Object.entries(filters)) {
          if (r[key] !== value) return false;
        }
        return true;
      });
    }
    if (sortBy) {
      const desc = sortBy.startsWith("-");
      const field = desc ? sortBy.slice(1) : sortBy;
      result.sort((a, b) => {
        if (a[field] < b[field]) return desc ? 1 : -1;
        if (a[field] > b[field]) return desc ? -1 : 1;
        return 0;
      });
    }
    return result;
  },
};

export const Settings = {
  get: () => api.get("/settings"),
  update: (data) => api.post("/settings", data),
};

export const Partner = {
  list: () => api.get("/partners"),
  get: (id) => api.get(`/partners/${id}`),
  create: (data) => api.post("/partners", data),
  update: (id, data) => api.put(`/partners/${id}`, data),
  delete: (id) => api.delete(`/partners/${id}`),
};

export const SystemSettings = {
  get: (key) => api.get(`/system-settings/${key}`),
  update: (key, value) => api.put(`/system-settings/${key}`, { value }),
  list: () => api.get("/system-settings"),
};

export const AuditLog = {
  list: () => api.get("/audit-logs"),
  create: (data) => api.post("/audit-logs", data),
  filter: async (filters) => {
    const logs = await api.get("/audit-logs");
    if (!filters || Object.keys(filters).length === 0) return logs;
    return logs.filter((l) => {
      for (const [key, value] of Object.entries(filters)) {
        if (l[key] !== value) return false;
      }
      return true;
    });
  },
};

export const ApiRequestLog = {
  list: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", params.page);
    if (params.per_page) queryParams.set("per_page", params.per_page);
    if (params.method) queryParams.set("method", params.method);
    if (params.path) queryParams.set("path", params.path);
    if (params.status) queryParams.set("status", params.status);
    if (params.user_email) queryParams.set("user_email", params.user_email);
    const queryString = queryParams.toString();
    return api.get(`/api-request-logs${queryString ? "?" + queryString : ""}`);
  },
  get: (id) => api.get(`/api-request-logs/${id}`),
};

export const ActivityFeed = {
  list: () => api.get("/activity-feed"),
  create: (data) => api.post("/activity-feed", data),
  filter: async (filters) => {
    const activities = await api.get("/activity-feed");
    if (!filters || Object.keys(filters).length === 0) return activities;
    return activities.filter((a) => {
      for (const [key, value] of Object.entries(filters)) {
        if (a[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Notification = {
  list: () => api.get("/notifications"),
  create: (data) => api.post("/notifications", data),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
  filter: async (filters) => {
    const notifications = await api.get("/notifications");
    if (!filters || Object.keys(filters).length === 0) return notifications;
    return notifications.filter((n) => {
      for (const [key, value] of Object.entries(filters)) {
        if (n[key] !== value) return false;
      }
      return true;
    });
  },
};

export const ReportShare = {
  list: () => api.get("/report-shares"),
  create: (data) => api.post("/report-shares", data),
  getPublic: (token) => api.get(`/report-shares/public/${token}`),
  filter: async (filters) => {
    const shares = await api.get("/report-shares");
    if (!filters || Object.keys(filters).length === 0) return shares;
    return shares.filter((s) => {
      for (const [key, value] of Object.entries(filters)) {
        if (s[key] !== value) return false;
      }
      return true;
    });
  },
};

export const ChatConversation = {
  list: () => api.get("/chat-conversations"),
  get: (id) => api.get(`/chat-conversations/${id}`),
  create: (data) => api.post("/chat-conversations", data),
  update: (id, data) => api.put(`/chat-conversations/${id}`, data),
  filter: async (filters) => {
    const conversations = await api.get("/chat-conversations");
    if (!filters || Object.keys(filters).length === 0) return conversations;
    return conversations.filter((c) => {
      for (const [key, value] of Object.entries(filters)) {
        if (c[key] !== value) return false;
      }
      return true;
    });
  },
};

export const Referral = {
  list: () => api.get("/referrals"),
  apply: (referralCode) =>
    api.post("/referrals/apply", { referral_code: referralCode }),
  filter: async (filters) => {
    const referrals = await api.get("/referrals");
    if (!filters || Object.keys(filters).length === 0) return referrals;
    return referrals.filter((r) => {
      for (const [key, value] of Object.entries(filters)) {
        if (r[key] !== value) return false;
      }
      return true;
    });
  },
};

export const User = {
  me: () => auth.me(),
  updateProfile: (data) => auth.updateProfile(data),
  list: () => api.get("/users"),
  update: (id, data) => api.put(`/users/${id}`, data),
  adjustCredits: (id, credits, reason) =>
    api.post(`/users/${id}/adjust-credits`, { credits, reason }),
  filter: async (filters) => {
    const users = await api.get("/users");
    if (!filters || Object.keys(filters).length === 0) return users;
    return users.filter((u) => {
      for (const [key, value] of Object.entries(filters)) {
        if (u[key] !== value) return false;
      }
      return true;
    });
  },
};

export const AI = {
  generateAnalysis: (analysisId) =>
    api.post("/ai/generate-analysis", { analysis_id: analysisId }),
  chat: (message, conversationId, analysisId) =>
    api.post("/ai/chat", {
      message,
      conversation_id: conversationId,
      analysis_id: analysisId,
    }),
  invoke: (prompt, system, maxTokens) =>
    api.post("/ai/invoke-llm", { prompt, system, max_tokens: maxTokens }),
};

export const InvokeLLM = async (prompt, options = {}) => {
  const response = await api.post("/ai/invoke-llm", {
    prompt,
    system: options.system || "",
    max_tokens: options.maxTokens || 2048,
  });
  return response.response;
};
