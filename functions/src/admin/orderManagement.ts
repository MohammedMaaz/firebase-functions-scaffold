//@ts-nocheck
import Admin from '.';
import Alert from '../alert';
import Customer from '../customer';
import Driver from '../driver';
import SMS from '../sms';
import TimeLog from '../timeLog';
import {withAdmin} from '../utils/cf';
import {auth, db, refs, serverTimestamp} from '../utils/firebase_config';
import {verifyDocExists, verifyOrderHasNotStatus} from '../utils/preconditions';
import Protos from '../utils/protos';
import {docToData} from '../utils/utils';

//order created this way (i.e by admin) must contain a field name createdByAdmin equals to the admin's uid
//to distinguish this order from normal orders and perform additional security check
export const createCustomerOrder = withAdmin(async (config, data, context) => {
  //STEP1: extract data
  const {customerDetails, scheduledAt, ...order} = data;

  await db().runTransaction(async (t) => {
    //STEP2: create customer's acc if not exists
    const user = await Admin.create_customer(
      config,
      customerDetails,
      context,
      t,
    );

    //STEP3: create order on behalf of customer
    const orderData = {
      ...order,
      createdByAdmin: context.auth.uid,
      customerDetails: {uid: user.uid},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    orderData.bookingDetails.waterAmount = Number(
      orderData.bookingDetails.waterAmount,
    );

    if (scheduledAt) orderData.scheduledAt = new Date(scheduledAt);

    t.set(refs.orders.doc(), orderData);
  });
});

export const assignOrderToDriver = withAdmin(async (config, data, context) => {
  const {driverUid, orderId, sendSMSAlert = false} = data;
  const driverUser = await auth().getUser(driverUid);

  await Driver.accept_order(
    config,
    {orderId},
    {auth: {uid: driverUid, token: {phone_number: driverUser.phoneNumber}}},
    context,
  );

  await Promise.all([
    Alert.send_push({
      title: 'New Order!',
      body: `You have been assigned a new order.`,
      uid: driverUid,
      userType: 'driver',
      groupId: orderId,
      dataPayload: {
        eventType: Alert.event_types.ORDER_ASSIGNED_TO_DRIVER,
        orderId,
      },
    }),
    sendSMSAlert
      ? SMS.send({
          phoneNumbers: [driverUser.phoneNumber],
          message: `You have been assigned an order of water tanker, download Waterlink app to start your delivery https://bit.ly/2Fj5Meh`,
        })
      : Promise.resolve(),
  ]);
});

export const cancelOrder = withAdmin(async (config, data, context) => {
  const {orderId, reason = null} = data;
  let order;

  await db().runTransaction(async (t) => {
    order = await t.get(refs.orders.doc(orderId));
    verifyDocExists(order);
    order = docToData(order);

    verifyOrderHasNotStatus(order, [
      'completed',
      'driver-cancelled',
      'customer-cancelled',
      'admin-cancelled',
      'server-error',
    ]);

    if (order.driverDetails?.uid)
      await TimeLog.close({
        logType: 'inDelivery',
        uid: order.driverDetails.uid,
        t,
      });

    t.update(order._original.ref, {
      status: Protos.status({value: 'admin-cancelled', description: reason}),
      updatedAt: serverTimestamp(),
    });
  });

  await Promise.all([
    Alert.send_push({
      title: 'Order cancelled!',
      body: `Your order has been cancelled by Waterlink${
        reason ? ' due to the reason: "' + reason + '".' : '.'
      }`,
      uid: order.customerDetails.uid,
      userType: 'customer',
      groupId: orderId,
      dataPayload: {
        eventType: Alert.event_types.ADMIN_CANCELLED_ORDER,
        orderId,
      },
    }),
    order.driverDetails?.uid
      ? Alert.send_push({
          title: 'Order cancelled!',
          body: `Your order has been cancelled by Waterlink${
            reason ? ' due to the reason: "' + reason + '".' : '.'
          }`,
          uid: order.driverDetails.uid,
          userType: 'driver',
          groupId: orderId,
          dataPayload: {
            eventType: Alert.event_types.ADMIN_CANCELLED_ORDER,
            orderId,
          },
        })
      : Promise.resolve(),
  ]);
});

export const markOrderArrived = withAdmin((config, data, context) =>
  Driver.mark_order_arrived(config, data, context, context),
);

export const markOrderCompleted = withAdmin((config, data, context) =>
  Driver.mark_order_completed(config, data, context, context),
);

export const submitOrderAmount = withAdmin((config, data, context) =>
  Driver.submit_order_amount(config, data, context, context),
);

export const broadcastOrder = withAdmin((config, data, context) =>
  Customer.retry_order_broadcast(config, data, context, context),
);
