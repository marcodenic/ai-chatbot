"use server";
// /app/(auth)/actions.ts

import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";

// A simple Zod schema
const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ----------------------------------
// DEBUG HELPER: log real DB errors
// ----------------------------------
function logDbError(operation: string, error: unknown) {
  console.error(`❌ [${operation}] Database error:`, error);
}

// ----------------------------------
// Data shapes for your UI states
// ----------------------------------
export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

// Server Action for login
export async function login(
  _currentState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Attempt to sign in
    const result = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false, // we handle redirects ourselves
    });

    // If signIn fails, you might want to check `result.error` or `result.ok`
    // For now, assume success if no exception thrown:
    return { status: "success" };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    logDbError("login", err);
    return { status: "failed" };
  }
}

// ----------------------------------
export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

// Server Action for register
export async function register(
  _currentState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    let existingUser: any;
    try {
      // Attempt to fetch user by email
      const [user] = await getUser(validatedData.email);
      existingUser = user;
    } catch (dbErr) {
      logDbError("getUser", dbErr);
      // We'll continue and just assume user doesn't exist,
      // or we might return { status: 'failed' } if we prefer to abort.
    }

    if (existingUser) {
      return { status: "user_exists" };
    }

    try {
      // Attempt to create user
      await createUser(validatedData.email, validatedData.password);
    } catch (dbErr) {
      logDbError("createUser", dbErr);
      return { status: "failed" };
    }

    // Now sign them in immediately
    const res = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    // If signIn fails: optionally check res
    // if (res?.error) return { status: 'failed' };

    return { status: "success" };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    logDbError("register", err);
    return { status: "failed" };
  }
}
