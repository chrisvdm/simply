import config from '../../web/config.json' assert { type: 'json' };
import { routes } from './routes.mjs'

export const defineAppContext = async () => {
    const pageRoutes = await routes()
    return {
        site: {...config},
        routes: {...pageRoutes}
    }
}