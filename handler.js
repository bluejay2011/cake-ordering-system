'use strict';

const orderManager = require('./orderManager');
const kinesisHelper = require('./kinesisHelper');
const cakeProducerManager = require('./cakeProducerManager');
const deliveryManager = require('./deliveryManager');

function createResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };

  return response;
}

module.exports.createOrder = async (event) => {

  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);

  return orderManager.placeNewOrder(order).then(() => {
    return createResponse(200, order);
  }).catch(error => {
    return createResponse(400, error);
  })
};

module.exports.orderFulfillment = async (event) => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const fulfillmentId = body.fulfillmentId;

  return orderManager.fulfillOrder(orderId, fulfillmentId).then(() => {
    return createResponse(200, `Order with orderId:${orderId} was sent to delivery`);
  }).catch(error => {
    return createResponse(400, error);
  })
};

module.exports.notifyExternalParties = async (event) => {
  const records = kinesisHelper.getRecords(event);

  const cakeProducerPromise = getCakeProducerPromise(records);
  const deliveryPromise = getDeliveryPromise(records);

  return Promise.all([cakeProducerPromise, deliveryPromise]).then(() => {
    return 'everything went well';
  }).catch(error => {
    return error;
  });

};

module.exports.notifyDeliveryCompany = async(event) => {
  // some http call
  console.log('Imagine calling delivery company');

  return 'done';
}

function getCakeProducerPromise(records) {
  const ordersPlaced = records.filter(r => r.eventType === 'order_placed');

  console.log('ordersPlaced: ' + ordersPlaced.length);
  if (ordersPlaced.length > 0) {
    return cakeProducerManager.handlePlacedOrders(ordersPlaced);
  } else {
    return null;
  }

  
}

function getDeliveryPromise(records) {
  const orderFulfilled = records.filter(r => r.eventType === 'order_fulfilled');

  if (orderFulfilled.length > 0) {
    return deliveryManager.deliveryOrder(orderFulfilled);
  } else {
    return null;
  }  
}

module.exports.orderDelivered = async(event) => {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const deliveryCompanyId = body.deliveryCompanyId;
  const orderReview = body.orderReview;

  return deliveryManager.fulfillOrderDelivery(orderId, deliveryCompanyId, orderReview).then(() => {
    return createResponse(200, `Order with orderId:${orderId} was successfully delivered by companyId ${deliveryCompanyId}`);
  }).catch(error => {
    return createResponse(400, error);
  });
}

module.exports.notifyCustomerService = async(event) => {
  console.log('imagine calling customer service endpoint ');

  return 'done';
}