import crypto from "crypto";
import path from "path";
import fs from "fs";
import multer from "multer";

import { uploadsDirectory, assetsPath } from "../../constants.js";

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
            ext: fileExt
        }
    }

    _handleFile(req, file, cb ) {
        const done = (() => {
            let called = false;
            return (err, data) => {
                if (called) return;
                called = true;
                cb(err, data);
            };
        })();

        const hash = crypto.createHash("sha256");

        const fileInfo = this.getFileInfo(file);
        let outstream = fs.createWriteStream(fileInfo.path);

        file.stream.on("data", (data) => {
            hash.update(data)
        });

        file.stream.pipe(outstream);

        outstream.on("finish", () => {
            done(null, {
                size: outstream.bytesWritten,
                hash: hash.digest("hex"),
                ...fileInfo
            });
        });

        file.stream.on("error", err => {
            fs.unlink(file.path, () => {
                done(err)
            })
        });

        outstream.on("error", err => {
            fs.unlink(file.path, () => {
                done(err)
            })
        });
    }

    _removeFile(req, file, cb) {
        fs.unlink(file.path, cb)
    }
}

const fileFilter = (req, file, cb) => {
    const fileTypes = /\.(pdf|txt)$/
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