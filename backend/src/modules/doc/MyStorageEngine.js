import crypto from "crypto";
import path from "path";
import fs from "fs";
import multer from "multer";

import { uploadsDirectory, assetsPath } from "../../constants.js";
import { checkHash } from "./doc.service.js";

const documentsFileDirectory = `${uploadsDirectory}/documents`
const documentsResourcePath = `${assetsPath}/documents`


await fs.promises.mkdir(documentsFileDirectory, {recursive: true})

class MyStorageEngine {
    constructor () {

    }

    getFileInfo(file) {
        const uuid = crypto.randomUUID();
        const fileExt = path.extname(file.originalname).toLowerCase()
        const filename = `${uuid}${fileExt}`
        return {
            filename: filename,
            path: `${documentsFileDirectory}/${filename}`,
            resource_url: `${documentsResourcePath}/${filename}`,
        }
    }

    _handleFile(req, file, cb ) {
        const hash = crypto.createHash("sha256");
        let buffer = Buffer.alloc(0)

        file.stream.on("data", (data) => {
            hash.update(data)
            buffer = Buffer.concat([buffer, data])
        });
        
        file.stream.on("end", async () => {
            const fileHash = hash.digest("hex")

            const existing = await checkHash(fileHash, req.orgId)
            if(existing) {
                return cb(null, {
                    isDuplicate: true,
                    duplicateFile: {...existing, duplicateFileName: file.originalname}
                })
            }

            const fileInfo = this.getFileInfo(file);

            fs.writeFile(fileInfo.path, buffer, err => {
                if (err) return cb(err)

                cb(null, {
                    isDuplicate: false,
                    size: buffer.length,
                    hash: fileHash,
                    ...fileInfo
                })
            })
        })


        file.stream.on("error", err => {
            fs.unlink(file.path, () => {
                cb(err)
            })
        });
    }

    _removeFile(req, file, cb) {
        fs.unlink(file.path, cb)
    }
}

const fileFilter = (req, file, cb) => {
    const fileTypes = /\.(pdf)$/
    const validExtname = fileTypes.test(path.extname(file.originalname).toLowerCase())

    if(validExtname){
        return cb(null, true)
    } else {
        cb(`Cannot upload ${file.originalname}`)
    }
}

export default multer({
    storage: new MyStorageEngine(),
    limits: {
        fileSize: 25 * 1024 * 1024, //25MB
    },
    fileFilter
})