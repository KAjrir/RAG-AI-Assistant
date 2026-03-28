import { Router } from "express";
import { getDocs } from "./doc.service.js";

const router = Router();

router.get("/", async (req, res) => {
    const { limit } = req.query


    const docs = await getDocs()

})


export default router;