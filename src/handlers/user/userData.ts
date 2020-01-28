import { RequestHandler } from 'express';
import { db } from '../../utils/admin';

export const setUserData: RequestHandler = async (req, res) => {
  // at least one field will be specified. unspecified fields will be an empty string
  // TODO: optimize to not write these fields to the db if it is an empty string
  const userDetails = {
    bio: req.body.bio || '',
    website: req.body.website || '',
    location: req.body.location || ''
  };

  try {
    await db.doc(`users/${req.body.user.userHandle}`).update(userDetails);
    res.status(200).json({ message: 'User details added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllUserData: RequestHandler = async (req, res) => {
  try {
    const userData = await db
      .collection('users')
      .doc(req.body.requestedUser)
      .get();
    const userFollowersCollection = await db
      .collection('users')
      .doc(req.body.requestedUser)
      .collection('followers')
      .get();
    // document ids would be user handles. we only need the user handles and nothing else
    const userFollowers = userFollowersCollection.docs.map(doc => doc.id);
    const userPostsSnapshot = await db
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .where('userHandle', '==', req.body.requestedUser)
      .get();
    // will be any empty array if no posts are associated with specified user
    const userPosts = userPostsSnapshot.docs.map(doc => doc.data());
    res.status(200).json({
      userData: { followers: userFollowers, ...userData.data() },
      posts: userPosts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
