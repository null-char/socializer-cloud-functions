import * as firebase from 'firebase';
import * as Busboy from 'busboy';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid/v4';
import { db } from '../utils/admin';
import { config } from '../utils/config';
import { RequestHandler } from 'express';
import admin = require('firebase-admin');

// FIREBASE STORAGE URL: https://firebasestorage.googleapis.com/v0/b/socializer-e77ce.appspot.com/o/filepath here?alt=media&token=tokenhereifpossible

const defaultProfilePicture = 'no-img.png';

export const signUp: RequestHandler = async (req, res) => {
  const newUser = {
    userHandle: req.body.userHandle,
    email: req.body.email,
    password: req.body.password // sign up form will have a show password field button so no need of confirmation
  };

  // validates user details. email validation is handled by firebase
  const userDoc = await db.doc(`/users/${newUser.userHandle}`).get();
  if (userDoc.exists) {
    // return an error if a user with the same handle exists
    return res.status(400).json({ userHandle: 'This handle is already taken' });
  } else {
    try {
      const userCredentials = await firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
      const token = userCredentials.user?.getIdToken();
      const userId = userCredentials.user?.uid;

      const userDetails = {
        userHandle: newUser.userHandle,
        email: newUser.email,
        profileImageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultProfilePicture}?alt=media`,
        createdAt: new Date().toISOString(),
        userId
      };

      await db
        .collection('users')
        .doc(newUser.userHandle)
        .set(userDetails);

      // resource created
      return res.status(201).json({
        token: token
      });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        return res.status(400).json({ email: 'Email is already in use' });
      } else {
        return res.status(500).json({ error: err.code });
      }
    }
  }
};

export const signIn: RequestHandler = async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  // CAN YOU PLEASE TRY TO FUCKING HANDLE ALL PROMISES? BOTH IN LIFE AND IN CODE

  try {
    const userCredentials = await firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password);
    const token = await userCredentials.user?.getIdToken();
    return res.status(200).json({
      message: `User signed in successfully with user id ${userCredentials.user?.uid}`,
      token: token
    });
  } catch (err) {
    switch (err.code) {
      case 'auth/invalid-email':
        return res.status(400).json({ email: 'The email entered is invalid' });
      case 'auth/user-disabled':
        return res.status(403).json({ user: 'Account is disabled' });
      case 'auth/wrong-password':
        return res
          .status(400)
          .json({ password: 'The password entered is invalid' });
      case 'auth/user-not-found':
        return res.status(404).json({ user: 'User not found' });
      default:
        return res.status(500).json(err);
    }
  }
};

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
        .doc(`users/${req.body.userHandle}`)
        .update({ profileImageUrl: fileUrl });
      res.status(200).json({ message: 'File successfully uploaded' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  busboy.end(req.body);
};
