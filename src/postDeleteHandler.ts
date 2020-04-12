import * as functions from 'firebase-functions';
import { db } from './utils/admin';

export const postDeleteHandler = async (
  context: functions.EventContext,
  basePath: string
) => {
  const { postId } = context.params;
  const batch = db.batch();
  // users/${userId}/posts
  try {
    const commentsCollection = await db
      .doc(`${basePath}/${postId}`)
      .collection('comments')
      .get();
    const seedsCollection = await db
      .doc(`${basePath}/${postId}`)
      .collection('seeds')
      .get();

    commentsCollection.docs.forEach((comment) =>
      batch.delete(db.doc(`${basePath}/${postId}/comments/${comment.id}`))
    );
    seedsCollection.docs.forEach((seed) =>
      batch.delete(db.doc(`${basePath}/${postId}/seeds/${seed.id}`))
    );
    await batch.commit();
  } catch (err) {
    console.error(err);
  }
};
