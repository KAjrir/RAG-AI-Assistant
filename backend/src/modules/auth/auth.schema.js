import { z } from zod;

export const registerSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.email().transform(v => v.toLowerCase()),
    password: z.string()
        .min(8, "Wachtwoord moet minimaal 8 tekens bevatten")
        .max(255, "Wachtwoord is te lang")
        .regex(/[A-Z]/, "Minimaal één hoofdletter")
        .regex(/[a-z]/, "Minimaal één kleine letter")
        .regex(/[0-9]/, "Minimaal één cijfer")
        .regex(/[^A-Za-z0-9]/, "Minimaal één speciaal teken")
})

export const loginSchema = z.object({
    email: z.email().transform(v => v.toLowerCase()),
    password: z.string().min(1)
})