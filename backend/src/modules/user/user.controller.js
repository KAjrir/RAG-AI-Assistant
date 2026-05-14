import fs from "fs/promises";
import path from "path";
import { Router } from "express";
import multer from "multer";

import { checkProfilePicture, checkSlugAvailability, createOrg, getPendingInvites, joinOrg, updateOnboardingStatus, updateProfilePicture } from "./user.service.js";
import { assetsPath, uploadsDirectory } from "../../constants.js";

const profilePictureFileDirectory = `${uploadsDirectory}/profile-pictures`
const profilePictureResourcePath = `${assetsPath}/profile-pictures`

const router = Router();

await fs.mkdir(profilePictureFileDirectory, {recursive: true})

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, profilePictureFileDirectory);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${req.userId}-${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Alleen JPG, PNG of WebP is toegestaan.'));
    }
    cb(null, true);
  }
});


router.patch("/name", async (req, res) => {
    const userId = req.userId
    const newName = req.body.name

    const name = await updateName(newName, userId)

    res.status(200).json({ success: true })
})

router.post("/profile-picture", upload.single('profile_picture'), async (req, res) => {
    const userId = req.userId

    const filePath = req.file.path;
    const resourcePath = `${profilePictureResourcePath}/${req.file.filename}`;
    
    try {
        const existing = await checkProfilePicture(userId)
    
        if(existing?.profile_picture_file_url) {
            await fs.unlink(existing.profile_picture_file_url)
        }
    
        await updateProfilePicture(userId, filePath, resourcePath)
        res.status(200).json({ url: resourcePath })
    } catch (err) {
        await fs.unlink(filePath)
        console.error(err)
        res.status(500).json({ error: "Server error"})
    }
})

router.delete('/profile-picture', async (req, res) => {
    const userId = req.userId
    try {
        const user = await checkProfilePicture(userId)

        if (!user?.profile_picture_file_url) {
            return res.status(404).json({ error: 'Geen profielfoto gevonden.' });
        }

        await fs.unlink(user.profile_picture_file_url);

        await updateProfilePicture(userId, null, null)

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/create-org", async (req, res) => {
    const userId = req.userId
    const { orgName, slug } = req.body
    console.log(orgName, slug, userId)
    await createOrg(orgName, slug, userId)
    await updateOnboardingStatus(userId)

    res.status(201).json({ success: true })
})

router.post("/join-org", async (req, res) => {
    const userId = req.userId
    const invitationToken = req.body.token

    await joinOrg(invitationToken, userId)
    await updateOnboardingStatus(userId)

    res.status(201).json({ success: true })
})

router.get("/pending-invites", async (req, res) => {
    const userId = req.userId
    const pendingInvites = await getPendingInvites(userId)

    res.status(200).json({ invites: pendingInvites })
})

router.get("/check-slug", async (req, res) => {
    const newSlug = req.query.slug

    if (!newSlug.trim()) {
        return res.status(200).json()
    }

    const existing = await checkSlugAvailability(newSlug)

    if (!existing) {
        return res.status(200).json({ available: true })
    }

    res.status(200).json({ available: false})
})


export default router;