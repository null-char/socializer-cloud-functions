import { db } from '../../utils/admin';
import { RequestHandler } from 'express';

// a user can only like a post once so it's fine to have the document id be the user handle
export const likePost: RequestHandler = async (req, res) => {
  if (!req.body.postId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  try {
    await db
      .doc(`posts/${req.body.postId}`)
      .collection('likes')
      .doc(req.body.user.userHandle)
      .set(req.body.user);
    res.status(200).json({
      message: `Like added successfully to post with post id ${req.body.postId}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const unlikePost: RequestHandler = async (req, res) => {
  if (!req.params.postId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  try {
    await db
      .doc(`posts/${req.params.postId}`)
      .collection('likes')
      .doc(req.body.user.userHandle)
      .delete();
    res.status(204).json({
      message: `Like removed successfully from post with post id ${req.params.postId}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
