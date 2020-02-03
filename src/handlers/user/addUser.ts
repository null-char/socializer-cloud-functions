import { db } from '../../utils/admin';
import { config } from '../../utils/config';
import { RequestHandler } from 'express';

const defaultProfilePicture = 'no-img.png';

export const addUser: RequestHandler = async (req, res) => {
  const newUser = {
    userId: req.body.userId,
    userHandle: req.body.userHandle,
    email: req.body.email,
    bio: `Hey! I'm a new socializer!`,
    website: '',
    location: 'Earth'
  };

  // validates user details. email validation is handled by firebase
  const userDoc = await db.doc(`/users/${newUser.userHandle}`).get();
  if (userDoc.exists) {
    // return an error if a user with the same handle exists
    return res
      .status(400)
      .json({ error: { code: 'auth/username-already-taken' } });
  } else {
    try {
      const userDetails = {
        userHandle: newUser.userHandle,
        email: newUser.email,
        bio: newUser.bio,
        location: newUser.location,
        website: newUser.website,
        profileImageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultProfilePicture}?alt=media`,
        createdAt: new Date().toISOString(),
        userId: newUser.userId
      };

      await db
        .collection('users')
        .doc(newUser.userHandle)
        .set(userDetails);

      // resource created
      return res.status(201).json({
        success: {
          message: 'User successfully added to database'
        }
      });
    } catch (err) {
      return res.status(500).json({ error: { code: 'server/unavailable' } });
    }
  }
};
