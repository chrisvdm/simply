(payload => {
    // Third party code to send email
    const response = {
        statusCode: 200,
        headers: {
          'x-custom-header': 'My Header Value',
        },
        body: JSON.stringify({ message: 'Message sent' }),
      }
})()