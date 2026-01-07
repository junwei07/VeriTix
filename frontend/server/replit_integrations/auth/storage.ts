import { users } from "@shared/schema";
import type { User, InsertUser as UpsertUser } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: Partial<UpsertUser>): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: Partial<UpsertUser>): Promise<User> {
    // Check if user exists by ID or email
    // Since Replit Auth uses 'sub' (id), we rely on that.
    
    // For upsert, we need to handle the case where ID might not exist yet if we are using random UUIDs?
    // Actually Replit Auth passes 'sub' as ID.
    
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id as string, // Replit Auth ID
        email: userData.email,
        username: userData.email?.split('@')[0] || 'user_' + Date.now(), // Fallback username
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      } as any)
      .onConflictDoUpdate({
        target: users.id,
        set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
