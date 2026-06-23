import * as http from 'http';
import { MyApp } from './step-4-middleware.js';

// 기존 req객체에 params 속성을 추가;
interface MyRequest extends http.IncomingMessage {
    params?: Record<string, string>
    body?: object | string
}

type ValueType = string | number | boolean | null | undefined

const REQUEST_BODY_METHODS = ['POST', 'PUT', 'PATCH'];

const app = new MyApp();

const helper = {
    getValue: (val: string) => {
        let resultVal: ValueType = val;
        if (['true', 'false'].includes(val)) {
            const isTrue = val === 'true';
            resultVal = isTrue;
        } else if (!isNaN(val as unknown as number)) {
            resultVal = Number(val);
        }

        return resultVal;
    },

    convertQueryToObj: (queryString: string) => {
        let obj: { [x: string]: ValueType } = {};

        // 쿼리스트링을 객체로 변환하여 req.params에 추가
        const queryArr = queryString ? queryString.split('&') : [];
        queryArr.forEach((x) => {
            const [key, value] = x.split('=');
            if (key && value) {
                obj = obj || {};
                obj[key] = helper.getValue(decodeURIComponent(value));
            }
        })

        return obj;
    },
}

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

                // 💡 Content-Type을 확인하여 그에 맞게 파싱
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

app.use(parseBody);
