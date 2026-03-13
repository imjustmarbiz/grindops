import { db } from "../../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const isDevNoDb = () => {
  if (process.env.NODE_ENV === "production") return false;
  const databaseUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL || "";
  return (
    !databaseUrl ||
    databaseUrl.includes("localhost:5432") ||
    databaseUrl.includes("127.0.0.1:5432") ||
    databaseUrl.includes("[::1]:5432")
  );
};

export interface IChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    if (isDevNoDb() || !db) return undefined;
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  },

  async getAllConversations() {
    if (isDevNoDb() || !db) return [];
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string) {
    if (isDevNoDb() || !db) {
      return { id: 0, title, createdAt: new Date() } as typeof conversations.$inferSelect;
    }
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  },

  async deleteConversation(id: number) {
    if (isDevNoDb() || !db) return;
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  async getMessagesByConversation(conversationId: number) {
    if (isDevNoDb() || !db) return [];
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    if (isDevNoDb() || !db) {
      return { id: 0, conversationId, role, content, createdAt: new Date() } as typeof messages.$inferSelect;
    }
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  },
};

