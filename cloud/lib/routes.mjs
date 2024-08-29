export const routes = async() => {
    const routesMod = await import('../../web/routes.mjs')
    const routes = routesMod.default
    return routes
}