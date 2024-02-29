import { config } from 'dotenv'; config();

import startServer from './server';

// if we were invoked start the server
if(__filename === process.argv?.[1] + '.js') {
    startServer();    
}