import SocketIOClient from 'socket.io-client';
import waitForExpect from 'wait-for-expect';

import { config } from '../../src/config';
import { getClientSocketConnection } from '../../src/utils/getClientSocketConnection';
import { log } from '../../src/utils/logger';
import { Server } from '../../src/server/Server';
import { socketMiddlewares } from '../../src/api/socket/middlewares';
import { ContextCreator } from '../../src/api/socket/ContextCreator';

describe('Server', () => {
    let server: Server;
    let clientSocket: SocketIOClient.Socket;

    beforeAll(async () => {
        server = Server.ofConfig(config);
        server.initSocket({
            middlewares: socketMiddlewares,
            contextCreator: ContextCreator.create,
        });
        await server.listen();
    });

    afterAll(async () => {
        await server.close();
    });

    beforeEach(async () => {
        clientSocket = await getClientSocketConnection(server.address);
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (clientSocket?.connected) clientSocket.disconnect();
    });

    describe('Socket', () => {
        describe('Security', () => {
            it('should disconnect clients who send nonexistent events', async () => {
                expect(clientSocket.connected).toEqual(true);

                // for checking that unexpected behaviour has logged
                const mockLogError = jest.fn();
                log.error = mockLogError;

                clientSocket.emit('Hello', 'World');

                await waitForExpect(() => {
                    expect(clientSocket.connected).toEqual(false);
                    expect(mockLogError.mock.calls[0][0]).toContain('Unexpected event');
                });
            });
        });
    });
});
