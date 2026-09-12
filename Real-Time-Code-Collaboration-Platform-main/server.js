import express from 'express';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import ACTIONS from './src/actions/Actions.js';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import http from 'http';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

const DATA_FILE = join(__dirname, 'rooms_data.json');
let roomFiles = {};

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            roomFiles = JSON.parse(data);
            console.log('Loaded room data from disk');
        }
    } catch (err) { roomFiles = {}; }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(roomFiles, null, 2));
    } catch (err) {}
}

loadData();

app.use(express.json());
app.use(cors());

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
        socketId,
        username: userSocketMap[socketId],
    }));
}

// Improved Request Utility (Supports HTTP and HTTPS)
function makeRequest(url, method, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestModule = url.startsWith('https') ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (url.startsWith('https') ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CodeAdd.It-IDE-NodeJS'
            },
            timeout: 8000
        };

        const req = requestModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ ok: false, status: res.statusCode, error: 'Invalid JSON' });
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

app.post('/api/execute', async (req, res) => {
    const { language, files, stdin } = req.body;
    const code = files[0].content;

    console.log(`[Proxy] Executing ${language}...`);

    // 1. Try OneCompiler
    try {
        const ocResult = await makeRequest('https://onecompiler.com/api/code/exec/all', 'POST', {
            name: language === 'cpp' ? 'cpp' : language,
            title: `main.${language === 'python3' ? 'py' : language}`,
            mode: language === 'python3' ? 'python' : language,
            code: code,
            extension: language === 'python3' ? 'py' : language,
            stdin: stdin || ''
        });
        if (ocResult.ok && (ocResult.data.stdout || ocResult.data.stderr)) {
            return res.json({ run: { output: (ocResult.data.stdout || "") + (ocResult.data.stderr || "") } });
        }
    } catch (err) {}

    // 2. Try Piston Instances (Local Docker Engine first!)
    const instances = [
        'http://localhost:2000/api/v2/execute', // Primary (Docker)
        'https://piston.mathix.ninja/api/v2/execute',
        'https://piston.shadydev.xyz/api/v2/execute',
        'https://piston.pythondiscord.com/api/v2/execute'
    ];

    for (const url of instances) {
        try {
            let executionBody = { ...req.body };
            
            // Map frontend names to local Piston names if using the local engine
            if (url.includes('localhost:2000')) {
                if (executionBody.language === 'python3') executionBody.language = 'python';
                if (executionBody.language === 'cpp') executionBody.language = 'gcc';
            }

            const result = await makeRequest(url, 'POST', executionBody);
            if (result.ok) {
                console.log(`[Proxy] Success from ${url}`);
                return res.json(result.data);
            }
        } catch (err) {
            console.warn(`[Proxy] Instance ${url} failed: ${err.message}`);
        }
    }

    res.status(500).json({ message: "Execution failed. If you just started Docker, wait 30s for languages to initialize." });
});

io.on('connection', (socket) => {
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        if (!roomFiles[roomId]) { roomFiles[roomId] = { 'main.js': '' }; saveData(); }
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, { clients, username, socketId: socket.id });
        });
        io.to(socket.id).emit(ACTIONS.FILES_SYNC, { files: roomFiles[roomId] });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, filename, code }) => {
        if (roomFiles[roomId] && filename) { roomFiles[roomId][filename] = code; saveData(); }
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { filename, code });
    });

    socket.on(ACTIONS.FILE_CREATE, ({ roomId, filename }) => {
        if (roomFiles[roomId]) { roomFiles[roomId][filename] = ''; saveData(); }
        socket.in(roomId).emit(ACTIONS.FILE_CREATE, { filename });
    });

    socket.on(ACTIONS.FILE_DELETE, ({ roomId, filename }) => {
        if (roomFiles[roomId]) { delete roomFiles[roomId][filename]; saveData(); }
        socket.in(roomId).emit(ACTIONS.FILE_DELETE, { filename });
    });

    socket.on(ACTIONS.FILE_RENAME, ({ roomId, oldName, newName }) => {
        const room = roomFiles[roomId];
        if (room && room[oldName] !== undefined && room[newName] === undefined) {
            room[newName] = room[oldName];
            delete room[oldName];
            saveData();
            socket.in(roomId).emit(ACTIONS.FILE_RENAME, { oldName, newName });
        }
    });

    socket.on(ACTIONS.CURSOR_MOVE, ({ roomId, filename, cursor }) => {
        socket.in(roomId).emit(ACTIONS.CURSOR_MOVE, { socketId: socket.id, username: userSocketMap[socket.id], filename, cursor });
    });

    socket.on(ACTIONS.CODE_EXECUTION, ({ roomId, output }) => {
        socket.in(roomId).emit(ACTIONS.CODE_EXECUTION, { output });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, lang }) => {
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { lang });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, { socketId: socket.id, username: userSocketMap[socket.id] });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

app.use(express.static('build'));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) { res.sendFile(join(__dirname, 'build', 'index.html')); }
});

const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const shutdown = () => { saveData(); server.close(() => process.exit(0)); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);