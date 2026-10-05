/**
 * Client-safe limits shared by the contact/bug-report forms and their API
 * routes (`lib/contactEmail.ts`).
 */
export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 } as const;

/**
 * Hidden form field real users never fill in. Bots that auto-fill every input
 * do — those submissions get a fake success and are dropped.
 */
export const HONEYPOT_FIELD = "website";
