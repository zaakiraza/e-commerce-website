/** The authenticated caller, taken from the JWT `sub` claim. */
export interface AuthUser {
  id: string;
}
