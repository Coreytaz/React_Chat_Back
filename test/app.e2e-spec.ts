import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { Model, Types } from 'mongoose';
import type { Connection } from 'mongoose';
function once<T = { message: string; id: string }>(
  socket: Socket,
  event: string,
): Promise<[T]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, listener);
      reject(new Error('Timed out waiting for ' + event));
    }, 5000);
    const listener = (data: T) => {
      clearTimeout(timer);
      resolve([data]);
    };
    socket.once(event, listener);
  });
}
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { configureApp } from '../src/common/http';
import { AuthSocketAdapter } from '../src/chat/auth-socket.adapter';
import { ChatGateway } from '../src/chat/chat.gateway';

interface Session {
  id: string;
  cookie: string;
  login: string;
}
interface Ack {
  ok: boolean;
  data?: { id: string; [key: string]: unknown };
  error?: { code: string };
}
describe('HTTP and real Socket.IO with isolated MongoDB', () => {
  let mongo: MongoMemoryServer, app: INestApplication, base: string;
  const sockets: Socket[] = [];
  let alice: Session, bob: Session, eve: Session;
  let a: Socket, b: Socket, e: Socket;
  const cloud = {
    upload: jest.fn(),
    cleanup: jest.fn().mockResolvedValue(undefined),
    assertOwned: jest.fn().mockResolvedValue(undefined),
    removeFile: jest.fn(),
  };
  const http = () => request(app.getHttpServer());
  async function register(login: string): Promise<Session> {
    const response = await http()
      .post('/api/auth/register')
      .send({ email: `${login}@example.com`, login, password: 'test-password' })
      .expect(200);
    expect(response.body.user.password).toBeUndefined();
    const cookie = response.headers['set-cookie'][0].split(';')[0];
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).not.toContain('Secure');
    return { id: response.body.user._id, cookie, login };
  }
  async function connect(session: Session) {
    const socket = io(base, {
      autoConnect: false,
      extraHeaders: { Cookie: session.cookie },
      reconnection: false,
    });
    sockets.push(socket);
    const connected = once(socket, 'connect');
    socket.connect();
    await connected;
    return socket;
  }
  function emit(socket: Socket, event: string, payload: unknown): Promise<Ack> {
    return socket.timeout(5000).emitWithAck(event, payload);
  }
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    Object.assign(process.env, {
      MONGO_URL: mongo.getUri('isolated'),
      JWT_SECRET: 'test-secret-with-more-than-thirty-two-characters',
      CORS_ORIGINS: 'http://localhost:5173',
      COOKIE_SECURE: 'false',
      PORT: '0',
      CLOUDINARY_CLOUD_NAME: 'test',
      CLOUDINARY_API_KEY: 'test',
      CLOUDINARY_API_SECRET: 'test',
    });
    const { AppModule } = await import('../src/app.module.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CloudinaryService)
      .useValue(cloud)
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    app.useWebSocketAdapter(new AuthSocketAdapter(app));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    // Wait for unique indexes before concurrency scenarios.
    await Promise.all(
      ['User', 'Friend', 'FriendRequest'].map((name) =>
        app.get<Model<object>>(getModelToken(name)).init(),
      ),
    );
    alice = await register('alice');
    bob = await register('boris');
    eve = await register('eve');
    a = await connect(alice);
    b = await connect(bob);
    e = await connect(eve);
  });
  afterAll(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await app?.close();
    await mongo?.stop();
  });

  it('validates registration, login, cookie session, and profile updates', async () => {
    await http()
      .post('/api/auth/register')
      .send({ password: '123456' })
      .expect(400);
    await http()
      .post('/api/auth/login')
      .send({ EmailorLogin: alice.login, password: 'wrong' })
      .expect(401);
    await http()
      .post('/api/auth/login')
      .send({ EmailorLogin: { $ne: null }, password: 'wrong' })
      .expect(400);
    await http()
      .post('/api/auth/login')
      .send({ EmailorLogin: alice.login, password: 'test-password' })
      .expect(200);
    await http()
      .get('/api/auth/refresh')
      .set('Cookie', alice.cookie)
      .expect(200);
    await http().get('/api/auth/refresh').expect(401);
    const updated = await http()
      .patch('/api/user/me')
      .set('Cookie', alice.cookie)
      .send({ username: 'New Alice' })
      .expect(200);
    expect(updated.body.username).toBe('New Alice');
    expect(updated.body.email).toBe('alice@example.com');
    await http()
      .patch('/api/user/me')
      .set('Cookie', alice.cookie)
      .send({ email: 'boris@example.com' })
      .expect(409);
    const logout = await http()
      .get('/api/auth/logout')
      .set('Cookie', alice.cookie)
      .expect(200);
    expect(logout.headers['set-cookie'][0]).toContain('token=;');
    await http()
      .delete('/api/user/avatar')
      .set('Cookie', alice.cookie)
      .expect(200, { message: 'Аватар успешно удален', avatar: null });
  });

  it('rejects unauthenticated sockets, forbidden origins, expired tokens and room spoofing', async () => {
    for (const headers of [
      {},
      { Cookie: alice.cookie, Origin: 'https://untrusted.example' },
    ] as Record<string, string>[]) {
      const socket = io(base, {
        autoConnect: false,
        extraHeaders: headers,
        reconnection: false,
      });
      sockets.push(socket);
      const failed = once(socket, 'connect_error');
      socket.connect();
      expect((await failed)[0].message).toBe('Требуется авторизация');
      socket.disconnect();
    }
    expect((await emit(a, 'ADD-USER', bob.id)).error?.code).toBe('403');
    const expired = app
      .get(JwtService)
      .sign({ _id: alice.id }, { expiresIn: -1 });
    await http()
      .get('/api/auth/refresh')
      .set('Cookie', `token=${expired}`)
      .expect(401);
  });

  it('keeps presence until the last tab disconnects', async () => {
    const second = await connect(alice);
    const online = once<string[]>(b, 'ADD-USER-STATUS');
    second.disconnect();
    expect((await online)[0]).toContain(alice.id);
  });

  it('disconnects a connected client when its token is no longer valid', async () => {
    const socket = await connect(alice);
    const serverSocket = app
      .get(ChatGateway)
      .server.sockets.sockets.get(socket.id!);
    serverSocket!.data.token = app
      .get(JwtService)
      .sign({ _id: alice.id }, { expiresIn: -1 });
    const disconnected = once<string>(socket, 'disconnect');
    socket.emit('ADD-USER', alice.id);
    await disconnected;
    expect(socket.connected).toBe(false);
  });

  it('prevents impersonation, restricts changes and events, paginates and clears only own messages', async () => {
    const data = {
      from: alice.id,
      to: bob.id,
      message: 'hello',
      attachments: [],
    };
    expect((await emit(e, 'SEND-MESG', data)).error?.code).toBe('403');
    expect(
      (await emit(a, 'SEND-MESG', { ...data, message: '' })).error?.code,
    ).toBe('400');
    expect(
      (await emit(a, 'SEND-MESG', { ...data, attachments: null })).error?.code,
    ).toBe('400');
    expect(
      (await emit(a, 'SEND-MESG', { ...data, to: 'invalid' })).error?.code,
    ).toBe('400');
    const leaked = jest.fn();
    e.on('MESG-RECIEVE', leaked);
    e.on('message:update-RECIEVE', leaked);
    e.on('message:delete-RECIEVE', leaked);
    e.on('messages:clear-recieve', leaked);
    const received = once(b, 'MESG-RECIEVE');
    const sent = await emit(a, 'SEND-MESG', data);
    expect(sent.ok).toBe(true);
    expect((await received)[0].id).toBe(sent.data?.id);
    const id = sent.data!.id;
    expect(
      (
        await emit(e, 'message:update', {
          id,
          message: 'hacked',
          attachments: [],
        })
      ).error?.code,
    ).toBe('403');
    expect((await emit(b, 'message:delete', id)).error?.code).toBe('403');
    const updated = await emit(a, 'message:update', {
      id,
      message: 'edited',
      attachments: [],
    });
    expect(updated.ok).toBe(true);
    const history = await http()
      .post('/api/chat/getMessages?page=0&limit=1')
      .set('Cookie', bob.cookie)
      .send({ from: bob.id, to: alice.id })
      .expect(201);
    expect(history.body).toHaveLength(1);
    expect(history.body[0]).toMatchObject({
      message: 'edited',
      fromSelf: false,
    });
    await http()
      .post('/api/chat/getMessages')
      .set('Cookie', eve.cookie)
      .send({ from: alice.id, to: bob.id })
      .expect(403);
    await http()
      .post('/api/chat/getMessages?page=-1')
      .set('Cookie', alice.cookie)
      .send({ from: alice.id, to: bob.id })
      .expect(400);
    await http()
      .post('/api/chat/getMessages?limit=101')
      .set('Cookie', alice.cookie)
      .send({ from: alice.id, to: bob.id })
      .expect(400);
    const voice = await emit(b, 'SEND-MESG', {
      from: bob.id,
      to: alice.id,
      message: null,
      attachments: [],
      voiceMessage: 'https://example.com/audio.webm',
    });
    expect(voice.ok).toBe(true);
    const clear = await emit(a, 'messages:clear', {
      from: alice.id,
      to: bob.id,
    });
    expect(clear.ok).toBe(true);
    const remaining = await http()
      .post('/api/chat/getMessages')
      .set('Cookie', alice.cookie)
      .send({ from: alice.id, to: bob.id })
      .expect(201);
    expect(remaining.body).toHaveLength(1);
    expect(remaining.body[0].id).toBe(voice.data?.id);
    expect((await emit(a, 'message:delete', id)).error?.code).toBe('404');
    expect((await emit(b, 'message:delete', voice.data!.id)).ok).toBe(true);
    // Round trip through the third socket ensures any earlier broadcast would have arrived.
    await emit(e, 'ADD-USER', eve.id);
    expect(leaked).not.toHaveBeenCalled();
  });

  it('handles duplicate and concurrent friendships, rejects self requests and wrong actors', async () => {
    const dto = { sender: alice.id, taker: bob.id };
    expect((await emit(e, 'reguest:user', dto)).error?.code).toBe('403');
    expect(
      (await emit(a, 'reguest:user', { sender: alice.id, taker: alice.id }))
        .error?.code,
    ).toBe('400');
    const requested = await Promise.all(
      Array.from({ length: 4 }, () => emit(a, 'reguest:user', dto)),
    );
    expect(requested.every((r) => r.ok)).toBe(true);
    const requests = await http()
      .get('/api/user/getReguestUser')
      .set('Cookie', bob.cookie)
      .expect(200);
    expect(requests.body).toHaveLength(1);
    expect(
      (await emit(a, 'accept:user', { ...dto, accept: 1 })).error?.code,
    ).toBe('403');
    const accepted = await Promise.all(
      Array.from({ length: 4 }, () =>
        emit(b, 'accept:user', { ...dto, accept: 1 }),
      ),
    );
    expect(accepted.every((r) => r.ok)).toBe(true);
    const friends = await http()
      .get('/api/user/getFriends')
      .set('Cookie', alice.cookie)
      .expect(200);
    expect(friends.body).toHaveLength(1);
    const count = await app
      .get<Model<object>>(getModelToken('Friend'))
      .countDocuments();
    expect(count).toBe(1);
    await http()
      .get('/api/user/getReguestUser')
      .set('Cookie', bob.cookie)
      .expect(200, []);
    await http()
      .get('/api/user/getUser')
      .query({ _id: bob.id })
      .set('Cookie', alice.cookie)
      .expect(200);
    await http()
      .get('/api/user/getUser')
      .query({ _id: new Types.ObjectId().toString() })
      .set('Cookie', alice.cookie)
      .expect(404);
    const search = await http()
      .get('/api/user/search')
      .query({ username: '.*' })
      .set('Cookie', alice.cookie)
      .expect(200);
    expect(search.body.items).toEqual([]);
  });
  it('reads legacy references and accepts old friendship requests without rewriting collections', async () => {
    const db = app.get<Connection>(getConnectionToken()).db!;
    const oldMessage = await db.collection('Chat').insertOne({
      users: [new Types.ObjectId(eve.id), new Types.ObjectId(alice.id)],
      sender: new Types.ObjectId(eve.id),
      message: 'legacy',
      attachments: [],
      voiceMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const history = await http()
      .post('/api/chat/getMessages')
      .set('Cookie', eve.cookie)
      .send({ from: eve.id, to: alice.id })
      .expect(201);
    expect(history.body[0]).toMatchObject({
      message: 'legacy',
      fromSelf: true,
    });
    expect(
      (await emit(e, 'message:delete', String(oldMessage.insertedId))).ok,
    ).toBe(true);
    await db.collection('Reguests').insertOne({
      sender: [new Types.ObjectId(eve.id)],
      taker: [new Types.ObjectId(alice.id)],
      accept: 0,
    });
    const dto = { sender: eve.id, taker: alice.id, accept: 1 };
    expect((await emit(a, 'accept:user', dto)).ok).toBe(true);
    const friends = await http()
      .get('/api/user/getFriends')
      .set('Cookie', eve.cookie)
      .expect(200);
    expect(friends.body.map((u: { _id: string }) => u._id)).toEqual([alice.id]);
  });
});
