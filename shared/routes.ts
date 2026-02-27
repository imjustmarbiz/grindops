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
      input: z.object({
        status: z.string(),
        replacementAction: z.enum(["strike", "warning", "no_penalty"]).optional(),
        replacementReason: z.string().optional(),
      }),
    },
    updatePrice: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/price' as const,
      input: z.object({ customerPrice: z.string() }),
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/orders/:id' as const,
      input: z.object({
        serviceId: z.string().optional(),
        platform: z.string().nullable().optional(),
        gamertag: z.string().nullable().optional(),
        orderDueDate: z.string().optional(),
        completedAt: z.string().nullable().optional(),
        isRush: z.boolean().optional(),
        isEmergency: z.boolean().optional(),
        complexity: z.number().min(1).max(5).optional(),
        location: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        orderBrief: z.string().nullable().optional(),
        discordBidLink: z.string().nullable().optional(),
        discordTicketChannelId: z.string().nullable().optional(),
        customerDiscordId: z.string().nullable().optional(),
        assignedGrinderId: z.string().nullable().optional(),
        mgtOrderNumber: z.number().nullable().optional(),
        customerPrice: z.string().optional(),
      }),
    },
    linkTicket: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/ticket' as const,
      input: z.object({
        discordTicketChannelId: z.string().min(1, "Discord channel ID is required"),
      }),
    },
    unlinkTicket: {
      method: 'DELETE' as const,
      path: '/api/orders/:id/ticket' as const,
    },
    ticketInvite: {
      method: 'POST' as const,
      path: '/api/orders/:id/ticket-invite' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/orders/:id' as const,
    },
    staffAssign: {
      method: 'POST' as const,
      path: '/api/orders/:id/assign' as const,
      input: z.object({
        grinderId: z.string().min(1, "Grinder is required"),
        bidAmount: z.string().min(1, "Bid/pay amount is required"),
        notes: z.string().optional(),
      }),
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
    replace: {
      method: 'POST' as const,
      path: '/api/assignments/:id/replace' as const,
      input: z.object({
        replacementGrinderId: z.string().min(1, "Replacement grinder is required"),
        originalGrinderPay: z.string(),
        replacementGrinderPay: z.string(),
        reason: z.string().optional(),
      }),
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
