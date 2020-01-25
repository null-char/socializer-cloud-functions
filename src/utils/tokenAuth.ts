import * as admin from 'firebase-admin';
import { db } from './admin';
import { RequestHandler } from 'express';

export const tokenAuth: RequestHandler = async (req, res, next) => {
  // only execute this middleware function if the request method is POST
  if (req.method === 'POST') {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split('Bearer ')[1];
      // Verify token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userDoc = await db
          .collection('users')
          .where('userId', '==', decodedToken.uid)
          .limit(1)
          .get();
        req.body.userHandle = userDoc.docs[0].data().userHandle;
        return next();
      } catch (err) {
        res.status(403).json(err);
      }
    } else {
      res
        .status(403)
        .json({ error: 'Invalid token or no authorization header provided' });
    }
  } else {
    return next();
  }
};
