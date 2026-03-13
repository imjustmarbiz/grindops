import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

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

const DEV_USER: User = {
  id: "dev-user",
  email: "dev@example.com",
  firstName: "Dev",
  lastName: null,
  profileImageUrl: null,
  discordId: "dev-user",
  discordUsername: "devuser",
  discordAvatar: null,
  role: "owner",
  discordRoles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (process.env.NODE_ENV !== "production" && id?.startsWith?.("dev-user")) {
      return { ...DEV_USER, id, discordId: id };
    }
    if (isDevNoDb() || !db) {
      return id?.startsWith?.("dev-user") ? { ...DEV_USER, id, discordId: id } : undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    if (process.env.NODE_ENV !== "production" && discordId?.startsWith?.("dev-user")) {
      return { ...DEV_USER, id: discordId, discordId };
    }
    if (isDevNoDb() || !db) {
      return discordId?.startsWith?.("dev-user") ? { ...DEV_USER, id: discordId, discordId } : undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (isDevNoDb() || !db) {
      return { ...DEV_USER, ...userData } as User;
    }
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
