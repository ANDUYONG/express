import * as http from 'http';

// 1. 통신 처리기 타입 구조 정의
type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

// 2. 라우팅 테이블 구조 정의: Method 객체 안에 URL키를 갖는 구조
interface RouterTable {
    [method: string]: {
        [url: string]: RequestHandler;
    };
}

const routers: RouterTable = {
    GET: {},
    POST: {},
    PUT: {},
    PATCH: {},
    DELETE: {},
};


const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    // 모든 응답에 대한 타입 설정
    res.setHeader('Content-Type', 'text/plain; carset=utf-8');

    const method = req.method || 'GET';
    const url = req.url || '/';

    const handler = routers[method]?.[url];
    if (handler) {
        handler(req, res);
    } else {
        res.writeHead(404);
        res.end('404 Error: 페이지를 찾을 수 없습니다!!');
    }
});