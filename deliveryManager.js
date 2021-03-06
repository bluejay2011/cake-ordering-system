'use strict'

const orderManager = require('./orderManager');
const customerServiceManager = require('./customerServiceManager');

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    region: process.env.region
});

const DELIVERY_COMPANY_QUEUE = process.env.deliveryCompanyQueue;

module.exports.deliveryOrder = ordersFulfilled => {

    var orderFulfilledPromises = [];

    for (let order of ordersFulfilled) {
        const temp = orderManager.updateOrderForDelivery(order.orderId).then( updatedOrder => {
            return orderManager.saveOrder(updatedOrder).then(() => {
                console.log('delivery company was notified');
                return notifyDeliveryCompany(updateOrder);
            });
        });

        orderFulfilledPromises.push(temp);
    }

    return Promise.all(orderFulfilledPromises);
};

module.exports.fulfillOrderDelivery = (orderId, deliveryCompanyId, orderReview) => {
    return orderManager.updateFulfilledOrderForDelivery(orderId, deliveryCompanyId).then(updatedOrder => {
        return orderManager.saveOrder(updatedOrder).then(() => {
            return customerServiceManager.notifyCustomerServiceForReview(orderId, orderReview);
        });        
    });
};


function notifyDeliveryCompany(order) {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVERY_COMPANY_QUEUE
    };

    return sqs.sendMessage(params).promise();   
}