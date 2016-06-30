/********************************************************
 * Handles actual app specific logic
 ********************************************************/

module.exports = {
  receivedMessageHandler: function(message, marshal) {
    if (message.contents.text) {
      // If we receive a text message, check to see if it matches any special
      // keywords and send back the corresponding example. Otherwise, just echo
      // the text we received.
      switch (message.contents.text) {
        case 'image':
          marshal.sendImageMessage(message.senderID);
          break;

        case 'button':
          marshal.sendButtonMessage(message.senderID);
          break;

        case 'generic':
          marshal.sendGenericMessage(message.senderID);
          break;

        case 'receipt':
          marshal.sendReceiptMessage(message.senderID);
          break;

        default:
          marshal.sendTextMessage(message.senderID, message.contents.text);
      }
    } else if (message.contents.attachments) {
      marshal.sendTextMessage(message.senderID, "Message with attachment received");
    }
  },

  receivedPostbackHandler: function(message, marshal) {
    marshal.sendTextMessage(message.senderID, "Postback called");
  }
}
