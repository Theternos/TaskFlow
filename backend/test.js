var request = require('request');
var options = {
  'method': 'POST',
  'url': 'https://whats-api.rcsoft.in/api/create-message',
  'headers': {
  },
  formData: {
    'appkey': '4c9c97cd-9022-43e6-aa39-f43ac436bf7c',
    'authkey': 'Tsf8rjM4fLAgmDp3GXq4dN9bPXHJd6FFHgj8tnwytVGJwIgKDG',
    'to': '918072677947',
    'message': 'Test Message from Task Management Module'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
