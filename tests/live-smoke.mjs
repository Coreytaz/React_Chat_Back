// Explicit live test: touches only newly created smoke users and their resources.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { io } from 'socket.io-client';
const require = createRequire(import.meta.url);
const { NestFactory } = require('@nestjs/core');
const { getModelToken } = require('@nestjs/mongoose');
const { AppModule } = require('../dist/app.module.js');
const { configureApp } = require('../dist/common/http.js');
const { AuthSocketAdapter } = require('../dist/chat/auth-socket.adapter.js');
const {
  CloudinaryService,
} = require('../dist/cloudinary/cloudinary.service.js');
const app = await NestFactory.create(AppModule, {
  logger: false,
  abortOnError: false,
});
configureApp(app);
app.useWebSocketAdapter(new AuthSocketAdapter(app));
const sessions = [],
  sockets = [];
const run = 'smoke_' + randomUUID().replaceAll('-', '');
const models = Object.fromEntries(
  ['User', 'Chat', 'Friend', 'FriendRequest', 'Upload'].map((name) => [
    name,
    app.get(getModelToken(name)),
  ]),
);
async function connect(session, base) {
  const socket = io(base, {
    autoConnect: false,
    extraHeaders: { Cookie: session.cookie, Origin: 'http://localhost:5173' },
    reconnection: false,
    timeout: 5000,
  });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
  return socket;
}
function wav() {
  const b = Buffer.alloc(44 + 4000);
  b.write('RIFF', 0);
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(4000, 40);
  return b;
}
let cleanupFailed = false;
try {
  await app.listen(process.env.SMOKE_FRONTEND_URL ? 5000 : 0, '127.0.0.1');
  const base = process.env.SMOKE_FRONTEND_URL || (await app.getUrl());
  async function http(path, session, body, method = body ? 'POST' : 'GET') {
    const form = body instanceof FormData;
    const res = await fetch(base + '/api/' + path, {
      method,
      headers: {
        ...(session ? { Cookie: session.cookie } : {}),
        ...(!form && body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: form ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    assert.ok(res.ok, `${method} ${path} returned ${res.status}`);
    return { data, res };
  }
  for (let i = 0; i < 3; i++) {
    const login = run + '_' + i;
    const { data, res } = await http('auth/register', null, {
      login,
      email: login + '@example.com',
      password: 'smoke-password',
    });
    sessions.push({
      id: data.user._id,
      cookie: res.headers.get('set-cookie').split(';')[0],
    });
  }
  const [alice, bob] = sessions;
  assert.equal((await http('auth/refresh', alice)).data.user._id, alice.id);
  const [a, b, e] = await Promise.all(sessions.map((s) => connect(s, base)));
  const payload = {
    from: alice.id,
    to: bob.id,
    message: 'live smoke',
    attachments: [],
  };
  assert.equal(
    (await e.timeout(5000).emitWithAck('SEND-MESG', payload)).ok,
    false,
  );
  const sent = await a.timeout(5000).emitWithAck('SEND-MESG', payload);
  assert.equal(sent.ok, true);
  assert.equal(
    (await http('chat/getMessages', bob, { from: bob.id, to: alice.id }))
      .data[0].message,
    'live smoke',
  );
  const friend = { sender: alice.id, taker: bob.id };
  assert.equal(
    (await a.timeout(5000).emitWithAck('reguest:user', friend)).ok,
    true,
  );
  assert.equal(
    (await b.timeout(5000).emitWithAck('accept:user', { ...friend, accept: 1 }))
      .ok,
    true,
  );
  assert.equal((await http('user/getFriends', alice)).data.length, 1);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
    'base64',
  );
  const upload = async (path, field, bytes, type, filename) => {
    const form = new FormData();
    form.set(field, new Blob([bytes], { type }), filename);
    return (await http(path, alice, form)).data;
  };
  await upload('user/avatar', 'avatar', png, 'image/png', 'smoke.png');
  const image = await upload(
    'chat/file',
    'file',
    png,
    'image/png',
    'smoke.png',
  );
  const voice = await upload(
    'chat/recordMessage',
    'recordMessage',
    wav(),
    'audio/wav',
    'smoke.wav',
  );
  assert.equal(
    (
      await a.timeout(10000).emitWithAck('SEND-MESG', {
        ...payload,
        message: null,
        attachments: [
          { id: 'image', url: image, status: 'done', name: 'smoke.png' },
        ],
      })
    ).ok,
    true,
  );
  assert.equal(
    (
      await a.timeout(10000).emitWithAck('SEND-MESG', {
        ...payload,
        message: null,
        voiceMessage: voice,
      })
    ).ok,
    true,
  );
  assert.equal(
    (
      await b.timeout(5000).emitWithAck('SEND-MESG', {
        from: bob.id,
        to: alice.id,
        message: 'preserved',
        attachments: [],
      })
    ).ok,
    true,
  );
  assert.equal(
    (
      await a
        .timeout(20000)
        .emitWithAck('messages:clear', { from: alice.id, to: bob.id })
    ).ok,
    true,
  );
  const remaining = (
    await http('chat/getMessages', alice, { from: alice.id, to: bob.id })
  ).data;
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].message, 'preserved');
  await http('user/avatar', alice, undefined, 'DELETE');
  console.log(
    'PASS: live MongoDB, cookie auth, authenticated Socket.IO, ownership, friends, Cloudinary image/avatar/audio, clear own messages.',
  );
} catch (error) {
  console.error(
    'FAIL:',
    error instanceof Error
      ? error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted]')
      : 'Live smoke failed',
  );
  process.exitCode = 1;
} finally {
  sockets.forEach((s) => s.disconnect());
  const ids = sessions.map((s) => s.id);
  try {
    // Also find a user whose registration response may have been interrupted.
    const created = await models.User.find({
      login: { $in: [0, 1, 2].map((i) => run + '_' + i) },
    })
      .select('_id')
      .lean();
    for (const user of created)
      if (!ids.includes(String(user._id))) ids.push(String(user._id));
    await models.Chat.deleteMany({ sender: { $in: ids } });
    await models.User.updateMany({ _id: { $in: ids } }, { avatar: null });
    for (const id of ids) {
      const uploads = await models.Upload.find({ owner: id });
      for (const upload of uploads)
        await app.get(CloudinaryService).removeOwned(upload.url, id);
    }
    await models.Friend.deleteMany({ id1: { $in: ids }, id2: { $in: ids } });
    await models.FriendRequest.deleteMany({
      sender: { $in: ids },
      taker: { $in: ids },
    });
    await models.User.deleteMany({ _id: { $in: ids } });
  } catch {
    cleanupFailed = true;
    console.error('Live cleanup needs attention. Test run:', run);
    process.exitCode = 1;
  }
  await app.close();
  if (!cleanupFailed)
    console.log(
      'Cleanup complete: only this run’s test users, messages, friendship records and uploaded resources were removed.',
    );
}
