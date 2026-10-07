// auth.schemas.ts: request/response shapes for the `auth` tag, mirroring contract/openapi.yaml.
import { z } from "zod";

/** POST /auth/login body: credentials exactly as documented (email format, required password). */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** The signed-in user embedded in LoginResponse; exactly the documented fields. */
export interface AuthUserResponse {
  id: string;
  email: string;
  role: "user" | "admin";
}

/** 200 LoginResponse: bearer token plus its documented `token` alias. */
export interface LoginResponse {
  accessToken: string;
  token: string;
  user: AuthUserResponse;
}
