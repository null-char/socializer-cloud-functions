import * as Busboy from 'busboy';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid/v4';
import * as admin from 'firebase-admin';
import { db } from '../../utils/admin';
import { config } from '../../utils/config';
import { RequestHandler } from 'express';

export const uploadUserImage: RequestHandler = async (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  let fileToUpload: { filepath: string; fileName: string; mimetype: string };

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (!mimetype.startsWith('image')) {
      res.status(400).json({
        error: 'Bad request. Only files of mimetype image are allowed.'
      });
      return;
    }
    const fileExtension = filename.split('.').pop();
    const fileName = `${uuid()}.${fileExtension}`;
    const filepath = path.join(os.tmpdir(), fileName);
    fileToUpload = { filepath, fileName, mimetype };

    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', async () => {
    try {
      await admin
        .storage()
        .bucket()
        .upload(fileToUpload.filepath, {
          resumable: false,
          metadata: {
            contentType: fileToUpload.mimetype
          }
        });
      const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${fileToUpload.fileName}?alt=media`;
      await db
        .doc(`users/${req.body.user.userHandle}`)
        .update({ profileImageUrl: fileUrl });
      res.status(200).json({ message: 'File successfully uploaded' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  busboy.end(req.body);
};
