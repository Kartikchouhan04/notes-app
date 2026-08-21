import { z } from "zod";
import { FULL_NAME_MAX_LENGTH } from "../constants";

/**
 * Only full_name is accepted. Email is owned by Supabase Auth, and there is no
 * password field by design — passwords are changed through
 * supabase.auth.updateUser(), never written to a table.
 */
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(
      FULL_NAME_MAX_LENGTH,
      `Name cannot exceed ${FULL_NAME_MAX_LENGTH} characters`
    )
    .nullable()
    .transform((value) => (value ? value : null)),
});
