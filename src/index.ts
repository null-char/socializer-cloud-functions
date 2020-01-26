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
  getAllPosts,
  getPost,
  addPost,
  removePost,
  likePost,
  unlikePost,
  addComment,
  removeComment
} from './handlers/index';
import { tokenAuth } from './utils/tokenAuth';

const app = express();
firebase.initializeApp(config);

app.get('/posts', getAllPosts);
app.get('/posts/:postId', getPost);

app.post('/posts', tokenAuth, addPost);
app.delete('/posts/:postId', tokenAuth, removePost);

app.post('/posts/likePost', tokenAuth, likePost);
app.post('/posts/unlikePost', tokenAuth, unlikePost);

app.post('/posts/addComment', tokenAuth, addComment);
app.delete('/posts/removeComment', tokenAuth, removeComment);

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
    res.json(err);
  }
});

app.post('/user/image', tokenAuth, uploadUserImage);
app.post('/user', tokenAuth, setUserData);
app.post('/user/follow', tokenAuth, followUser);
app.delete('/user/unfollow/:userHandle', tokenAuth, unfollowUser);

export const api = functions.https.onRequest(app);
