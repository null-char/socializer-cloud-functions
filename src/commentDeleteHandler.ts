import * as functions from 'firebase-functions';
import { db } from './utils/admin';

export const commentDeleteHandler = async (
  context: functions.EventContext,
  basePath: string
) => {
  const { postId, commentId } = context.params;
  const batch = db.batch();

  try {
    const repliesCollection = await db
      .doc(`${basePath}/${postId}/comments/${commentId}`)
      .collection('replies')
      .get();

    repliesCollection.docs.forEach((reply) =>
      batch.delete(
        db.doc(
          `${basePath}/${postId}/comments/${commentId}/replies/${reply.id}`
        )
      )
    );
    await batch.commit();
  } catch (err) {
    console.error(err);
  }
};
