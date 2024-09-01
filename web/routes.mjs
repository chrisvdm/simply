const routes =  {
        '/about': {
            to: '/about',
            name: 'about',
                title: 'About'
            },
        '/': {
            to: '/',
            name: 'home',
            title: 'Home',
            // preload: async () => {
            //     const posts = await action.fetch.posts({ limit: 5 })
            //     context['posts'] = posts
            // }
        },
        '/contact-us': {
            to: '/contact-us',
            name: 'contactUs',
            title: 'Contact Us'
        }
        // '/:postId': {
        //     to: '/:postId',
        //     // title: context.posts(params.id).title,
        //     // preload: async () => {
        //     //     const post = await action.retrieve.post(id)
        //     //     context['post'] = post
        //     // }
        // }}
};

export default routes