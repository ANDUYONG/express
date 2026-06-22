import * as http from 'http';
import { MyApp } from './step-4-middleware.js';

// 기존 req객체에 params 속성을 추가;
interface MyRequest extends http.IncomingMessage {
    params?: Record<string, string>
    body?: object
}

const REQUEST_BODY_METHODS = ['POST', 'PUT', 'PATCH'];

const app = new MyApp();

function parseBody(req: MyRequest, res: http.ServerResponse, next: () => void): void {
    if (REQUEST_BODY_METHODS.includes(req.method || '')) {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const totalBuffer = Buffer.concat(chunks);
                const bodyString = totalBuffer.toString('utf-8');
                req.body = bodyString ? JSON.parse(bodyString) : {};
                next();
            } catch (error) {
                res.statusCode = 400;
                res.end('Invalid JSON format');
            }
        });
    } else {
        next();
    }
}

app.use(parseBody);
