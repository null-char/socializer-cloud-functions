import * as functions from 'firebase-functions';
import * as express from 'express';
import * as firebase from 'firebase';
import { getPosts, addPost } from './handlers/posts';
import { signUp, signIn } from './handlers/user';
import { tokenAuth } from './utils/tokenAuth';

const app = express();
const config = {
  apiKey: 'AIzaSyCN6y89ruVX7xESbDjp6UXwBJ7f5Z7sEi8',
  authDomain: 'socializer-e77ce.firebaseapp.com',
  databaseURL: 'https://socializer-e77ce.firebaseio.com',
  projectId: 'socializer-e77ce',
  storageBucket: 'socializer-e77ce.appspot.com',
  messagingSenderId: '155031946649',
  appId: '1:155031946649:web:8c9494f2a17cc80bdfff08',
  measurementId: 'G-QL72HQ5GHC'
};
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
