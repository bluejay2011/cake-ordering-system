'use strict';

function createResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }

  return response;
}

module.exports.createOrder = async (event) => {

  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);

  return orderManager.placeNewOrder(order).then(() => {
      return createResponse(200, order);
  }).catch(error => {
    return createResponse(400, error);
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Create order!',
      input: event,
    }),
  };
};

module.exports.orderFulfillment = async (event) {
  const body = JSON.parse(event.body);
  const orderId = body.orderId;
  const fulfillmentId = body.fulfillmentId;

  return orderManager.fulfillOrder(orderId, fulfillmentId).then(() => {
    return createResponse(200, 'Order with orderId:${orderId} was sent to deliver');
  }).catch(error => {
    return createResponse(400, error);
  });

};
