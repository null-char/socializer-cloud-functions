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
    await db
      .collection('posts')
      .doc(newPost.createdAt)
      .set(newPost);
    return res.json({
      message: `Document added successfully with id ${newPost.createdAt}`
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Something went wrong with the server' });
  }
};

export const likePost: RequestHandler = async (req, res) => {
  try {
    await db
      .doc(`posts/${req.body.postId}`)
      .update({ likes: { userHandle: req.body.userHandle } });
    res
      .status(200)
      .json({
        message: `Like added successfully to post with post id ${req.body.postId}`
      });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const addComment: RequestHandler = async (req, res) => {
  try {
    await db.doc(`posts/${req.body.postId}`).update({
      comments: {
        userHandle: req.body.userHandle,
        body: req.body.commentBody
      }
    });
    res
      .status(200)
      .json({
        message: `Comment added successfully to post with post id ${req.body.postId}`
      });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
