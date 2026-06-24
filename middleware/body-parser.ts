import * as http from 'http';
import { helper, REQUEST_BODY_METHODS } from '../common/helper.js';
import type { MyRequest, MyResponse } from '../common/helper.js'

export function bodyParser(req: MyRequest, res: http.ServerResponse, next: () => void): void {
    if (REQUEST_BODY_METHODS.includes(req.method || '')) {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const totalBuffer = Buffer.concat(chunks);
                const bodyString = totalBuffer.toString('utf-8');

                if (!bodyString) {
                    req.body = {};
                    return next();
                }

                // Content-Type을 확인하여 그에 맞게 파싱
                const contentType = req.headers['content-type'] || '';

                if (contentType.includes('application/json')) {
                    req.body = JSON.parse(bodyString);
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    // 이전 단계에서 만드신 helper.convertQueryToObj를 재활용할 수 있습니다!
                    req.body = helper.convertQueryToObj(bodyString);
                } else {
                    // JSON이나 Form 데이터가 아니면 문자열 그대로 저장
                    req.body = bodyString;
                }

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