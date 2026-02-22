import { z } from "zod";
import { 
  insertServiceSchema, 
  insertGrinderSchema, 
  insertOrderSchema, 
  insertBidSchema, 
  insertAssignmentSchema,
  insertQueueConfigSchema,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

export const api = {
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services' as const,
    },
  },
  grinders: {
    list: {
      method: 'GET' as const,
      path: '/api/grinders' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/grinders/:id' as const,
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/grinders/:id' as const,
      input: insertGrinderSchema.partial(),
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: insertOrderSchema,
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status' as const,
      input: z.object({ status: z.string() }),
    },
    suggestions: {
      method: 'GET' as const,
      path: '/api/orders/:id/suggestions' as const,
    },
  },
  bids: {
    list: {
      method: 'GET' as const,
      path: '/api/bids' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/bids' as const,
      input: insertBidSchema,
    },
  },
  assignments: {
    list: {
      method: 'GET' as const,
      path: '/api/assignments' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/assignments' as const,
      input: insertAssignmentSchema,
    },
  },
  analytics: {
    summary: {
      method: 'GET' as const,
      path: '/api/analytics/summary' as const,
    },
  },
  queue: {
    getTop: {
      method: 'GET' as const,
      path: '/api/queue/top' as const,
    },
    emergency: {
      method: 'GET' as const,
      path: '/api/queue/emergency' as const,
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
    },
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
    },
  },
  config: {
    get: {
      method: 'GET' as const,
      path: '/api/config' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/config' as const,
      input: insertQueueConfigSchema.partial(),
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
