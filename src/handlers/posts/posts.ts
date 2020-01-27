import { db } from '../../utils/admin';
import { RequestHandler } from 'express';

export const getAllPosts: RequestHandler = async (req, res) => {
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

export const getPost: RequestHandler = async (req, res) => {
  try {
    const postDoc = await db
      .collection('posts')
      .doc(req.params.postId)
      .get();
    const postComments = await db
      .collection('posts')
      .doc(req.params.postId)
      .collection('comments')
      .get();
    const commentsData = postComments.docs.map(doc => doc.data());
    const postData = {
      postId: postDoc.id,
      comments: commentsData,
      ...postDoc.data()
    };
    res.status(200).json(postData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const addPost: RequestHandler = async (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.body.user.userHandle,
    createdAt: new Date().toISOString()
  };

  try {
    const postDoc = await db.collection('posts').add(newPost);
    return res.json({ postId: postDoc.id, ...newPost });
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Something went wrong with the server' });
  }
};

export const removePost: RequestHandler = async (req, res) => {
  const postDoc = await db
    .collection('posts')
    .doc(req.params.postId)
    .get();
  if (
    postDoc.exists &&
    postDoc.data()?.userHandle === req.body.user.userHandle
  ) {
    try {
      await db
        .collection('posts')
        .doc(req.params.postId)
        .delete();
      res.status(200).json({ message: `Post deleted with id ${postDoc.id}` });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(403).json({ error: 'Unauthenticated' });
  }
};
