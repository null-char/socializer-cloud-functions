import { db } from '../utils/admin';
import { RequestHandler } from 'express';

export const getPosts: RequestHandler = async (req, res) => {
  try {
    const querySnapshot = await db
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();
    const docData = querySnapshot.docs.map(doc => {
      return {
        postId: doc.id,
        ...doc.data()
      };
    });
    return res.status(200).json(docData);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const addPost: RequestHandler = async (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await db.collection('posts').add(newPost);
    return res.json({
      message: `Document added successfully with id ${docRef.id}`
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Something went wrong with the server' });
  }
};
