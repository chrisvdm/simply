export default () => ({
        about: {
        to: '/about',
            preload: () => {

            }
        },
        home: {
            to: '/',
            title: 'Home',
            preload: async () => {
                const posts = await service.fetch.posts({ limit: 5 })
                context['posts'] = posts
            }
        },
        post: {
            to: '/:id',
            title: context.posts(params.id).title,
            preload: async () => {
                const post = await service.retrieve.post(id)
                context['post'] = post
            }
        }
    })
