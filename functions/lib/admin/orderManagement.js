"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastOrder = exports.submitOrderAmount = exports.markOrderCompleted = exports.markOrderArrived = exports.cancelOrder = exports.assignOrderToDriver = exports.createCustomerOrder = void 0;
//@ts-nocheck
const _1 = require(".");
const alert_1 = require("../alert");
const customer_1 = require("../customer");
const driver_1 = require("../driver");
const sms_1 = require("../sms");
const timeLog_1 = require("../timeLog");
const cf_1 = require("../utils/cf");
const firebase_config_1 = require("../utils/firebase_config");
const preconditions_1 = require("../utils/preconditions");
const protos_1 = require("../utils/protos");
const utils_1 = require("../utils/utils");
//order created this way (i.e by admin) must contain a field name createdByAdmin equals to the admin's uid
//to distinguish this order from normal orders and perform additional security check
exports.createCustomerOrder = cf_1.withAdmin(async (config, data, context) => {
    //STEP1: extract data
    const { customerDetails, scheduledAt } = data, order = __rest(data, ["customerDetails", "scheduledAt"]);
    await firebase_config_1.db().runTransaction(async (t) => {
        //STEP2: create customer's acc if not exists
        const user = await _1.default.create_customer(config, customerDetails, context, t);
        //STEP3: create order on behalf of customer
        const orderData = Object.assign(Object.assign({}, order), { createdByAdmin: context.auth.uid, customerDetails: { uid: user.uid }, createdAt: firebase_config_1.serverTimestamp(), updatedAt: firebase_config_1.serverTimestamp() });
        orderData.bookingDetails.waterAmount = Number(orderData.bookingDetails.waterAmount);
        if (scheduledAt)
            orderData.scheduledAt = new Date(scheduledAt);
        t.set(firebase_config_1.refs.orders.doc(), orderData);
    });
});
exports.assignOrderToDriver = cf_1.withAdmin(async (config, data, context) => {
    const { driverUid, orderId, sendSMSAlert = false } = data;
    const driverUser = await firebase_config_1.auth().getUser(driverUid);
    await driver_1.default.accept_order(config, { orderId }, { auth: { uid: driverUid, token: { phone_number: driverUser.phoneNumber } } }, context);
    await Promise.all([
        alert_1.default.send_push({
            title: 'New Order!',
            body: `You have been assigned a new order.`,
            uid: driverUid,
            userType: 'driver',
            groupId: orderId,
            dataPayload: {
                eventType: alert_1.default.event_types.ORDER_ASSIGNED_TO_DRIVER,
                orderId,
            },
        }),
        sendSMSAlert
            ? sms_1.default.send({
                phoneNumbers: [driverUser.phoneNumber],
                message: `You have been assigned an order of water tanker, download Waterlink app to start your delivery https://bit.ly/2Fj5Meh`,
            })
            : Promise.resolve(),
    ]);
});
exports.cancelOrder = cf_1.withAdmin(async (config, data, context) => {
    var _a;
    const { orderId, reason = null } = data;
    let order;
    await firebase_config_1.db().runTransaction(async (t) => {
        var _a;
        order = await t.get(firebase_config_1.refs.orders.doc(orderId));
        preconditions_1.verifyDocExists(order);
        order = utils_1.docToData(order);
        preconditions_1.verifyOrderHasNotStatus(order, [
            'completed',
            'driver-cancelled',
            'customer-cancelled',
            'admin-cancelled',
            'server-error',
        ]);
        if ((_a = order.driverDetails) === null || _a === void 0 ? void 0 : _a.uid)
            await timeLog_1.default.close({
                logType: 'inDelivery',
                uid: order.driverDetails.uid,
                t,
            });
        t.update(order._original.ref, {
            status: protos_1.default.status({ value: 'admin-cancelled', description: reason }),
            updatedAt: firebase_config_1.serverTimestamp(),
        });
    });
    await Promise.all([
        alert_1.default.send_push({
            title: 'Order cancelled!',
            body: `Your order has been cancelled by Waterlink${reason ? ' due to the reason: "' + reason + '".' : '.'}`,
            uid: order.customerDetails.uid,
            userType: 'customer',
            groupId: orderId,
            dataPayload: {
                eventType: alert_1.default.event_types.ADMIN_CANCELLED_ORDER,
                orderId,
            },
        }),
        ((_a = order.driverDetails) === null || _a === void 0 ? void 0 : _a.uid) ? alert_1.default.send_push({
            title: 'Order cancelled!',
            body: `Your order has been cancelled by Waterlink${reason ? ' due to the reason: "' + reason + '".' : '.'}`,
            uid: order.driverDetails.uid,
            userType: 'driver',
            groupId: orderId,
            dataPayload: {
                eventType: alert_1.default.event_types.ADMIN_CANCELLED_ORDER,
                orderId,
            },
        })
            : Promise.resolve(),
    ]);
});
exports.markOrderArrived = cf_1.withAdmin((config, data, context) => driver_1.default.mark_order_arrived(config, data, context, context));
exports.markOrderCompleted = cf_1.withAdmin((config, data, context) => driver_1.default.mark_order_completed(config, data, context, context));
exports.submitOrderAmount = cf_1.withAdmin((config, data, context) => driver_1.default.submit_order_amount(config, data, context, context));
exports.broadcastOrder = cf_1.withAdmin((config, data, context) => customer_1.default.retry_order_broadcast(config, data, context, context));
