import * as functions from 'firebase-functions';
import * as express from 'express';
import * as firebase from 'firebase';
import { config } from './utils/config';
import { getPosts, addPost } from './handlers/posts';
import { signUp, signIn } from './handlers/user';
import { tokenAuth } from './utils/tokenAuth';

const app = express();
firebase.initializeApp(config);

app.get('/posts', getPosts);
app.use('/posts', tokenAuth);
app.post('/posts', addPost);

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

export const api = functions.https.onRequest(app);
