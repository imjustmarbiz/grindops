import { z } from "zod";
import { 
  insertServiceSchema, 
  insertGrinderSchema, 
  insertOrderSchema, 
  insertBidSchema, 
  insertAssignmentSchema,
  insertQueueConfigSchema,
  services,
  grinders,
  orders,
  bids,
  assignments,
  queueConfig
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

const QueueItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  serviceName: z.string(),
  customerPrice: z.string(),
  dueDateTime: z.string().transform(str => new Date(str)), // Coerce string to Date
  grinderName: z.string(),
  tier: z.string(),
  bidAmount: z.string(),
  estDeliveryDateTime: z.string().transform(str => new Date(str)),
  finalPriorityScore: z.number(),
});

const DashboardStatsSchema = z.object({
  activeOrders: z.number(),
  completedToday: z.number(),
  availableGrinders: z.number(),
  totalGrinders: z.number(),
});


export const api = {
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services' as const,
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
  },
  grinders: {
    list: {
      method: 'GET' as const,
      path: '/api/grinders' as const,
      responses: {
        200: z.array(z.custom<typeof grinders.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/grinders/:id' as const,
      responses: {
        200: z.custom<typeof grinders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id' as const,
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders' as const,
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  bids: {
    list: {
      method: 'GET' as const,
      path: '/api/bids' as const,
      responses: {
        200: z.array(z.custom<typeof bids.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bids' as const,
      input: insertBidSchema,
      responses: {
        201: z.custom<typeof bids.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  assignments: {
    list: {
      method: 'GET' as const,
      path: '/api/assignments' as const,
      responses: {
        200: z.array(z.custom<typeof assignments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/assignments' as const,
      input: insertAssignmentSchema,
      responses: {
        201: z.custom<typeof assignments.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  queue: {
    getTop: {
      method: 'GET' as const,
      path: '/api/queue/top' as const,
      responses: {
        200: z.array(QueueItemSchema),
      },
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats' as const,
      responses: {
        200: DashboardStatsSchema,
      }
    }
  }
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
