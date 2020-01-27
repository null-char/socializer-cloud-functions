import { db } from '../../utils/admin';
import { RequestHandler } from 'express';

export const addComment: RequestHandler = async (req, res) => {
  if (!req.body.postId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  const newComment = {
    userData: req.body.user,
    body: req.body.commentBody,
    createdAt: new Date().toISOString()
  };

  try {
    const commentDoc = await db
      .doc(`posts/${req.body.postId}`)
      .collection('comments')
      .add(newComment);
    res.status(200).json({ commentId: commentDoc.id, ...newComment });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeComment: RequestHandler = async (req, res) => {
  if (!req.params.postId && !req.params.commentId)
    res
      .status(400)
      .json({ error: 'Bad request. Make sure to specify post id.' });

  const commentDoc = await db
    .doc(`posts/${req.params.postId}`)
    .collection('comments')
    .doc(req.params.commentId)
    .get();

  if (
    commentDoc.exists &&
    commentDoc.data()?.userHandle === req.body.user.userHandle
  ) {
    try {
      await db
        .doc(`posts/${req.params.postId}`)
        .collection('comments')
        .doc(req.params.commentId)
        .delete();
      res.status(200).json({ message: 'Removed comment successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(403).json({ error: 'Unauthenticated' });
  }
};

// The comment id would be the user handle of the person that you're replying to
/**
 *
 * @param req Expects a body with fields:
 * - postId
 * - commentId
 * - replyBody
 */
export const replyToComment: RequestHandler = async (req, res) => {
  if (!req.body.postId && !req.body.commentId)
    res.status(400).json({
      error: 'Bad request. Make sure to specify post id and comment id'
    });

  const newReply = {
    replyBody: req.body.replyBody,
    userHandle: req.body.user.userHandle,
    createdAt: new Date().toISOString()
  };

  try {
    const replyDoc = await db
      .doc(`posts/${req.body.postId}`)
      .collection('comments')
      .doc(req.body.commentId)
      .collection('replies')
      .add(newReply);
    res.status(200).json({ replyId: replyDoc.id, ...newReply });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeReplyToComment: RequestHandler = async (req, res) => {
  // maybe a bit too deep of a subcollection?
  const replyDoc = await db
    .doc(`/posts/${req.params.postId}`)
    .collection('comments')
    .doc(req.params.commentId)
    .collection('replies')
    .doc(req.params.replyId)
    .get();

  if (
    replyDoc.exists &&
    replyDoc.data()?.userHandle === req.body.user.userHandle
  ) {
    try {
      await db
        .doc(`posts/${req.params.postId}`)
        .collection('comments')
        .doc(req.params.commentId)
        .collection('replies')
        .doc(req.params.replyId)
        .delete();
      res
        .status(200)
        .json({ message: `Reply removed with id ${req.params.replyId}` });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.status(403).json({ error: 'Unauthenticated' });
  }
};
