import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './utils/admin';
import { postDeleteHandler } from './postDeleteHandler';
import { commentDeleteHandler } from './commentDeleteHandler';

export const onUserDelete = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snapshot, context) => {
    const { userId } = context.params;
    const batch = db.batch();

    try {
      const postsCollection = await db
        .doc(`users/${userId}`)
        .collection('posts')
        .get();
      const subscribersCollection = await db
        .doc(`users/${userId}`)
        .collection('subscribers')
        .get();
      const feedCollection = await db
        .doc(`users/${userId}`)
        .collection('feed')
        .get();
      const notifications = await db
        .doc(`users/${userId}`)
        .collection('notifications')
        .get();

      postsCollection.docs.map((post) => {
        batch.delete(db.doc(`users/${userId}/posts/${post.id}`));
      });

      subscribersCollection.docs.map((sub) => {
        batch.delete(db.doc(`users/${userId}/subscribers/${sub.id}`));
      });

      // we no longer need to preserve the user's feed either
      feedCollection.docs.map((post) => {
        batch.delete(db.doc(`users/${userId}/feed/${post.id}`));
      });

      notifications.docs.map((notif) => {
        batch.delete(db.doc(`users/${userId}/notifications/${notif.id}`));
      });

      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  });

export const onPostDelete = functions.firestore
  .document('users/{userId}/posts/{postId}')
  .onDelete(async (snapshot, context) => {
    await postDeleteHandler(context, `users/${context.params.userId}/posts`);
  });

export const onFeedPostDelete = functions.firestore
  .document('users/{userId}/feed/{postId}')
  .onDelete(async (_, context) => {
    await postDeleteHandler(context, `users/${context.params.userId}/feed`);
  });

export const onCommentDelete = functions.firestore
  .document('users/{userId}/posts/{postId}/comments/{commentId}')
  .onDelete(async (snapshot, context) => {
    await commentDeleteHandler(context, `users/${context.params.userId}/posts`);
  });

export const onFeedCommentDelete = functions.firestore
  .document('users/{userId}/feed/{postId}/comments/{commentId}')
  .onDelete(async (_, context) => {
    await commentDeleteHandler(context, `users/${context.params.userId}/feed`);
  });

// for setting the number of comments
export const onCommentWrite = functions.firestore
  .document('users/{userId}/posts/{postId}/comments/{commentId}')
  .onWrite(async (change, context) => {
    if (!change.before.exists) {
      // Document is created
      await db
        .doc(`users/${context.params.userId}/posts/${context.params.postId}`)
        .update({ numComments: admin.firestore.FieldValue.increment(1) });

      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .set({ ...change.after.data() });
      });
    } else if (!change.after.exists) {
      // document delete. decrement
      await db
        .doc(`users/${context.params.userId}/posts/${context.params.postId}`)
        .update({ numComments: admin.firestore.FieldValue.increment(-1) });

      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .delete();
      });
    } else if (change.before.exists && change.after.exists) {
      // UPDATE
      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .set({ ...change.after.data() });
      });
    }
  });

export const onPostWrite = functions.firestore
  .document('users/{userId}/posts/{postId}')
  .onWrite(async (change, context) => {
    if (!change.before.exists) {
      // post create
      await db
        .collection('users')
        .doc(context.params.userId)
        .update({ numPosts: admin.firestore.FieldValue.increment(1) });

      // deliver to all users subscribed to said user
      const subscribers = await db
        .collection('users')
        .doc(context.params.userId)
        .collection('subscribers')
        .get();

      // add to the feed of every user subscribed to the user who added the post
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .collection('users')
          .doc(subscriber.id)
          .collection('feed')
          .doc(context.params.postId)
          .set({ ...change.after.data() });
      });
    } else if (!change.after.exists) {
      // post delete
      await db
        .collection('users')
        .doc(context.params.userId)
        .update({ numPosts: admin.firestore.FieldValue.increment(-1) });

      const subscribers = await db
        .collection('users')
        .doc(context.params.userId)
        .collection('subscribers')
        .get();
      // remove the post from the feed of every user subscribed
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .collection('users')
          .doc(subscriber.id)
          .collection('feed')
          .doc(context.params.postId)
          .delete();
      });
    } else if (change.before.exists && change.after.exists) {
      // UPDATE: A post was updated
      const subscribers = await db
        .collection('users')
        .doc(context.params.userId)
        .collection('subscribers')
        .get();

      // add to the feed of every user subscribed to the user who added the post
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .collection('users')
          .doc(subscriber.id)
          .collection('feed')
          .doc(context.params.postId)
          .set({ ...change.after.data() });
      });
    }
  });

export const onSubscribeWrite = functions.firestore
  .document('users/{userId}/subscribers/{subscriberId}')
  .onWrite(async (change, context) => {
    if (!change.before.exists) {
      const { userId, subscriberId } = context.params;
      // user subscribed to another user. add all posts of the user to the subscribed user
      await db
        .collection('users')
        .doc(userId)
        .update({ numSubscribers: admin.firestore.FieldValue.increment(1) }); // increment number of subscribers

      const userPosts = await db
        .collection('users')
        .doc(userId)
        .collection('posts')
        .limit(15)
        .get();

      userPosts.forEach(async (post) => {
        const userPostRef = db
          .collection('users')
          .doc(userId)
          .collection('posts')
          .doc(post.id);
        const subscriberFeedPostRef = db
          .collection('users')
          .doc(subscriberId)
          .collection('feed')
          .doc(post.id);

        await subscriberFeedPostRef.set({ ...post.data() });

        const comments = await userPostRef.collection('comments').get();

        comments.forEach(async (comment) => {
          await subscriberFeedPostRef
            .collection('comments')
            .doc(comment.id)
            .set({ ...comment.data() });

          const replies = await userPostRef
            .collection('comments')
            .doc(comment.id)
            .collection('replies')
            .get();

          replies.forEach(async (reply) => {
            await subscriberFeedPostRef
              .collection('comments')
              .doc(comment.id)
              .collection('replies')
              .doc(reply.id)
              .set({ ...reply.data() });
          });
        });
      });
    } else if (!change.after.exists) {
      // user unsubscribed. remove all posts from feed
      await db
        .collection('users')
        .doc(context.params.userId)
        .update({ numSubscribers: admin.firestore.FieldValue.increment(-1) }); // decrement number of subscribers
      const markedPosts = await db
        .collection('users')
        .doc(context.params.subscriberHandle)
        .collection('feed')
        .where('userId', '==', context.params.userId)
        .get();
      markedPosts.docs.forEach(async (markedPost) => {
        await markedPost.ref.delete();
      });
    }
  });

export const onSeedPost = functions.firestore
  .document('users/{userId}/posts/{postId}/seeds/{seedId}')
  .onWrite(async (change, context) => {
    // the like id represents the user handle
    if (!change.before.exists) {
      // seeded a post
      await db
        .collection('users')
        .doc(context.params.userId)
        .update({ numSeeds: admin.firestore.FieldValue.increment(1) });

      // change value of numSeeds on the post itself
      await db
        .doc(`users/${context.params.userId}`)
        .collection('posts')
        .doc(context.params.postId)
        .update({ numSeeds: admin.firestore.FieldValue.increment(1) });

      //Update this post for every user's feed subscribed to this post
      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        // update data
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('seeds')
          .doc(context.params.seedId)
          .set({ ...change.after.data() });
      });
    } else if (!change.after.exists) {
      // unseeded a post / unliked a post
      await db
        .collection('users')
        .doc(context.params.userId)
        .update({ numSeeds: admin.firestore.FieldValue.increment(-1) });

      // change value of numSeeds on the post itself
      await db
        .doc(`users/${context.params.userId}`)
        .collection('posts')
        .doc(context.params.postId)
        .update({ numSeeds: admin.firestore.FieldValue.increment(-1) });

      //Update this post for every user's feed subscribed to this post
      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('seeds')
          .doc(context.params.seedId)
          .delete();
      });
    }
  });

export const onReplyWrite = functions.firestore
  .document(
    'users/{userId}/posts/{postId}/comments/{commentId}/replies/{replyId}'
  )
  .onWrite(async (change, context) => {
    if (!change.before.exists) {
      // Document create
      await db
        .doc(
          `users/${context.params.userId}/posts/${context.params.postId}/comments/${context.params.commentId}`
        )
        .update({ numReplies: admin.firestore.FieldValue.increment(1) });

      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        // add data in all subbed feeds
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .collection('replies')
          .doc(context.params.replyId)
          .set({ ...change.after.data() });
      });
    } else if (!change.after.exists) {
      // Document was deleted. decrement
      await db
        .doc(
          `users/${context.params.userId}/posts/${context.params.postId}/comments/${context.params.commentId}`
        )
        .update({ numReplies: admin.firestore.FieldValue.increment(-1) });

      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();
      subscribers.docs.forEach(async (subscriber) => {
        // delete reply in all subbed feeds
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .collection('replies')
          .doc(context.params.replyId)
          .delete();
      });
    } else if (change.before.exists && change.after.exists) {
      // UPDATE: User edited a reply or something
      const subscribers = await db
        .doc(`users/${context.params.userId}`)
        .collection('subscribers')
        .get();

      subscribers.docs.forEach(async (subscriber) => {
        // add data in all subbed feeds
        await db
          .doc(`users/${subscriber.id}`)
          .collection('feed')
          .doc(context.params.postId)
          .collection('comments')
          .doc(context.params.commentId)
          .collection('replies')
          .doc(context.params.replyId)
          .set({ ...change.after.data() });
      });
    }
  });
