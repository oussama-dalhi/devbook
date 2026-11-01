import { Router } from 'express';
import * as z from 'zod';
export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.email().trim().max(254),
  password: z.string().min(8).max(100),
});

type RegisterInput = z.infer<typeof registerSchema>;

authRouter.post('/register', (req: { body: RegisterInput }, res) => {
    const result = registerSchema.safeParse(req.body);
    if(!result.success)
    {
        return res.status(400).json(result.error);
    } else {
        return res.status(200).json({ name: result.data.name, username: result.data.username, email: result.data.email })
    }
})


authRouter.get('/', (_req, res) => {
    res.json({ message: "Auth routes are working"});
});