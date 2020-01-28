import * as functions from 'firebase-functions';
import * as express from 'express';
import * as firebase from 'firebase';
import { config } from './utils/config';
import {
  signUp,
  signIn,
  uploadUserImage,
  setUserData,
  followUser,
  unfollowUser,
  getAllUserData
} from './handlers/user/index';
import {
  getAllPosts,
  getPost,
  addPost,
  removePost,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  replyToComment,
  removeReplyToComment
} from './handlers/posts/index';
import { tokenAuth } from './utils/tokenAuth';

const app = express();
firebase.initializeApp(config);

// Get all posts or one post
app.get('/posts', getAllPosts);
app.get('/posts/:postId', getPost);

// Add/Remove user posts
app.post('/posts', tokenAuth, addPost);
app.delete('/posts/:postId', tokenAuth, removePost);

// Add/Remove likes to user posts
app.post('/posts/like-post', tokenAuth, likePost);
app.delete('/posts/unlike-post/:postId', tokenAuth, unlikePost);

// Add/Remove comments to user posts
app.post('/posts/add-comment', tokenAuth, addComment);
app.delete(
  '/posts/remove-comment/:postId/:commentId',
  tokenAuth,
  removeComment
);

// Add/Remove replies to comments
app.post('/posts/add-reply', tokenAuth, replyToComment);
app.delete(
  '/posts/remove-reply/:postId/:commentId/:replyId',
  tokenAuth,
  removeReplyToComment
);

// SIGN UP
// We'll do stuff like checking if email is not blank or if password is a certain length in the client side code

app.post('/signup', signUp);
app.post('/signin', signIn);
// temporary. should be done on the client
app.post('/signout', async (req, res) => {
  try {
    await firebase.auth().signOut();
    res.status(200).json({ message: 'Signed out successfully' });
  } catch (err) {
    console.error(err);
    res.json(err);
  }
});

app.post('/user/image', tokenAuth, uploadUserImage);
app.post('/user', tokenAuth, setUserData);
app.post('/user/follow', tokenAuth, followUser);
app.delete('/user/unfollow/:userHandle', tokenAuth, unfollowUser);
app.get('/user', getAllUserData);

export const api = functions.https.onRequest(app);
