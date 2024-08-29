import config from '../../web/config.json' assert { type: 'json' };
import { routes } from './routes.mjs';

// Example additional global data
const globalData = {
    environment: process.env.NODE_ENV || 'development', // Can be used for environment-specific logic
    analyticsEnabled: true, // Example of a flag that could be toggled
    // You can add more global data here as needed
};

export const defineAppContext = async () => {
    const pageRoutes = await routes();
    return {
        site: { ...config },
        routes: { ...pageRoutes },
        global: { ...globalData } // Add any additional global data here
    };
};