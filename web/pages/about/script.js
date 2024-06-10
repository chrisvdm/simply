const contactForm = {
    fields: [{
        type: 'string',
        name: 'contact-name',
        label: 'Name'
    }, {
        type: 'email',
        name: 'contact-email',
        label: 'Email Address'
    }, {
        type: 'textarea',
        name: 'contact-message',
        label: 'Message'
    }],
    buttons: [
        {
            type: 'submit',
            label: 'Send Message',
            onClick: onContactFormSubmitButtonClick()
        }
    ]
}

const onContactFormSubmitButtonClick = async (ContactFormInput) => {
    services.sendEmail(ContactFormInput)
}