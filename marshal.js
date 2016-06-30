/********************************************************
 * Handles packaging and unpackaging of messages
 ********************************************************/
const handlers = require('./handlers'),
      request = require('request');
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

function sendMessage (messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
};

var marshal = {
  receivedMessage: function(event) {
    var message = {
      senderID: event.sender.id,
      recipientID: event.recipient.id,
      timestamp: event.timestamp,
      contents: event.message
    };

    console.log("Received message for user %d and page %d at %d with message:",
      message.senderID, message.recipientID, message.timestamp);
    console.log(JSON.stringify(message.contents));

    handlers.receivedMessageHandler(message, marshal);
  },

  receivedPostback: function(event) {
    var message = {
      senderID: event.sender.id,
      recipientID: event.recipient.id,
      timestamp: event.timestamp,
      payload: event.postback.payload
    };

    console.log("Received postback for user %d and page %d with payload '%s' " +
      "at %d", message.senderID, message.recipientID, message.payload, message.timestamp);

    handlers.receivedPostbackHandler(message, marshal);
  },

  sendTextMessage: function(recipientId, messageText) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    };

    sendMessage(messageData);
  },

  sendButtonMessage: function(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "This is test text",
            buttons:[{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Developer defined postback"
            }]
          }
        }
      }
    };

    sendMessage(messageData);
  },

  sendImageMessage: function(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: "http://i.imgur.com/zYIlgBl.png"
          }
        }
      }
    };

    sendMessage(messageData);
  },

  sendGenericMessage: function(recipientId) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [{
              title: "rift",
              subtitle: "Next-generation virtual reality",
              item_url: "https://www.oculus.com/en-us/rift/",
              image_url: "http://messengerdemo.parseapp.com/img/rift.png",
              buttons: [{
                type: "web_url",
                url: "https://www.oculus.com/en-us/rift/",
                title: "Open Web URL"
              }, {
                type: "postback",
                title: "Call Postback",
                payload: "Payload for first bubble",
              }],
            }, {
              title: "touch",
              subtitle: "Your Hands, Now in VR",
              item_url: "https://www.oculus.com/en-us/touch/",
              image_url: "http://messengerdemo.parseapp.com/img/touch.png",
              buttons: [{
                type: "web_url",
                url: "https://www.oculus.com/en-us/touch/",
                title: "Open Web URL"
              }, {
                type: "postback",
                title: "Call Postback",
                payload: "Payload for second bubble",
              }]
            }]
          }
        }
      }
    };

    sendMessage(messageData);
  },

  sendReceiptMessage: function(recipientId) {
    // Generate a random receipt ID as the API requires a unique ID
    var receiptId = "order" + Math.floor(Math.random()*1000);

    var messageData = {
      recipient: {
        id: recipientId
      },
      message:{
        attachment: {
          type: "template",
          payload: {
            template_type: "receipt",
            recipient_name: "Peter Chang",
            order_number: receiptId,
            currency: "USD",
            payment_method: "Visa 1234",
            timestamp: "1428444852",
            elements: [{
              title: "Oculus Rift",
              subtitle: "Includes: headset, sensor, remote",
              quantity: 1,
              price: 599.00,
              currency: "USD",
              image_url: "http://messengerdemo.parseapp.com/img/riftsq.png"
            }, {
              title: "Samsung Gear VR",
              subtitle: "Frost White",
              quantity: 1,
              price: 99.99,
              currency: "USD",
              image_url: "http://messengerdemo.parseapp.com/img/gearvrsq.png"
            }],
            address: {
              street_1: "1 Hacker Way",
              street_2: "",
              city: "Menlo Park",
              postal_code: "94025",
              state: "CA",
              country: "US"
            },
            summary: {
              subtotal: 698.99,
              shipping_cost: 20.00,
              total_tax: 57.67,
              total_cost: 626.66
            },
            adjustments: [{
              name: "New Customer Discount",
              amount: -50
            }, {
              name: "$100 Off Coupon",
              amount: -100
            }]
          }
        }
      }
    };

    sendMessage(messageData);
  }
};

module.exports = marshal;
