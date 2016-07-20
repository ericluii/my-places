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
      console.error(messageData);
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

  sendQuickResponse: function(recipientId, message, responses) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message,
        quick_replies: responses
      }
    };

    sendMessage(messageData);
  }
};

module.exports = marshal;
