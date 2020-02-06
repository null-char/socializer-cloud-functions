import * as admin from 'firebase-admin';
import { db } from './admin';
import { RequestHandler } from 'express';

export const tokenAuth: RequestHandler = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    // token is after the "Bearer ". split the string to get the token
    const token = req.headers.authorization.split('Bearer ')[1];

    // Verify token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userDoc = await db
        .collection('users')
        .where('userId', '==', decodedToken.uid)
        .limit(1)
        .get();
      req.body.user = userDoc.docs[0].data();
      next();
    } catch (err) {
      // not authorized
      res.status(403).json(err);
    }
  } else {
    res
      .status(403)
      .json({ error: 'Invalid token or no authorization header provided' });
  }
};
