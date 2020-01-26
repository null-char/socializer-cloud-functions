import { db } from '../../utils/admin';
import { RequestHandler } from 'express';

export const addComment: RequestHandler = async (req, res) => {
  if (!req.body.postId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  try {
    await db
      .doc(`posts/${req.body.postId}`)
      .collection('comments')
      .doc(req.body.user.userHandle)
      .set({
        userData: req.body.user,
        body: req.body.commentBody,
        createdAt: new Date().toISOString()
      });
    res.status(200).json({
      message: `Comment added successfully to post with post id ${req.body.postId}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeComment: RequestHandler = async (req, res) => {
  if (!req.params.postId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  try {
    await db
      .doc(`posts/${req.params.postId}`)
      .collection('comments')
      .doc(req.body.user.userHandle)
      .delete();
    res.status(204).json({ message: 'Removed comment successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
