import { RequestHandler } from 'express';
import { db } from '../../utils/admin';

export const setUserData: RequestHandler = async (req, res) => {
  // at least one field will be specified. unspecified fields will be an empty string
  // TODO: optimize to not write these fields to the db if it is an empty string
  const userDetails = {
    bio: req.body.bio,
    website: req.body.website,
    location: req.body.location
  };

  try {
    await db.doc(`users/${req.body.user.userHandle}`).update(userDetails);
    res.status(200).json({ message: 'User details added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
