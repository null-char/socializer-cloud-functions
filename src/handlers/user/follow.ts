import { RequestHandler } from 'express';
import { db } from '../../utils/admin';

export const followUser: RequestHandler = async (req, res) => {
  if (!req.body.userHandle) res.status(400).json({ error: 'Bad request' });
  try {
    await db
      .doc(`users/${req.body.userHandle}`)
      .collection('followers')
      .doc(req.body.user.userHandle)
      .set(req.body.user);
    res.status(200).json({
      message: `User with user id ${req.body.user.userHandle} followed user with user id ${req.body.userHandle} successfully`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const unfollowUser: RequestHandler = async (req, res) => {
  if (!req.params.userHandle) res.status(400).json({ error: 'Bad request' });
  try {
    await db
      .doc(`users/${req.params.userHandle}`)
      .collection('followers')
      .doc(req.body.user.userHandle)
      .delete();
    res.status(200).json({
      message: `User with id ${req.body.user.userHandle} unfollowed user with id ${req.params.userHandle} successfully`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFollowers: RequestHandler = async (req, res) => {
  try {
    const followersCollection = await db
      .doc(`users/${req.body.userHandle}`)
      .collection('followers')
      .get();
    res.status(200).json(followersCollection.docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
