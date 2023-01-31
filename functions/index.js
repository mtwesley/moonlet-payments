const functions = require("firebase-functions");
const admin = require("firebase-admin");
const momo = require("mtn-momo");

admin.initializeApp();

exports.processMTNMomoLonestar = functions.https.onCall((data, context) => {
  const { auth } = context;
  const { payment, msisdn } = data;
  const db = admin.firestore();

  const { Collections } = momo.create({
    callbackHost: "https://pay.moonlet.tech",
  });

  const collections = Collections({
    userSecret: process.env.MTN_MOMO_COLLECTIONS_SECRET,
    userId: process.env.MTN_MOMO_COLLECTIONS_USER_ID,
    primaryKey: process.env.MTN_MOMO_COLLECTIONS_KEY,
  });

  if (!payment?.id || !msisdn) return null;

  return db
    .collection("payments")
    .doc(payment.id)
    .get()
    .then((doc) => {
      const payment = { id: doc.id, ...doc.data() };
      if (doc.exists && doc.data().paymentUserId === auth.uid) {
        return doc.ref.update({ values: { msisdn } }).then(() =>
          collections
            .requestToPay({
              amount: payment.amount,
              currency: payment.currency,
              externalId: payment.id,
              payer: {
                partyIdType: "MSISDN",
                partyId: msisdn,
              },
              payerMessage: payment.title,
              payeeNote: payment.description,
            })
            .then((transactionId) =>
              collections.getTransaction(transactionId).then((transaction) => {
                if (transaction)
                  return updateMTNMomoLonestarTransaction(transaction).then(
                    () => transactionId
                  );
                return null;
              })
            )
        );
      }
      return null;
    });
});

exports.checkMTNMomoLonestar = functions.https.onCall((data, context) => {
  const { payment } = data;
  const db = admin.firestore();

  const { Collections } = momo.create({
    callbackHost: process.env.MTN_MOMO_CALLBACK_HOST,
  });

  const collections = Collections({
    userSecret: process.env.MTN_MOMO_COLLECTIONS_SECRET,
    userId: process.env.MTN_MOMO_COLLECTIONS_USER_ID,
    primaryKey: process.env.MTN_MOMO_COLLECTIONS_KEY,
  });

  if (!payment?.id) return null;

  return db
    .collection("paymentsData")
    .doc(payment.id)
    .then((doc) => {
      const transactionId = doc?.data()?.financialTransactionId;
      if (transactionId) {
        return collections.getTransaction(transactionId).then((transaction) => {
          if (transaction)
            return updateMTNMomoLonestarTransaction(transaction).then(
              () => transactionId
            );
        });
      }
      return null;
    });
});

const updateMTNMomoLonestarTransaction = (transaction) => {
  const db = admin.firestore();

  return db
    .collection("paymentsData")
    .doc(transaction.externalId)
    .set(transaction)
    .then(() => {
      if (transaction.status === "PENDING")
        return db.collection("payments").doc(transaction.externalId).update({
          status: "in-progress",
        });
      else if (transaction.status === "SUCCESSFUL")
        return db.collection("payments").doc(transaction.externalId).update({
          status: "accepted",
        });
      else if (transaction.status === "FAILED")
        return db.collection("payments").doc(transaction.externalId).update({
          status: "rejected",
        });
    });
};
