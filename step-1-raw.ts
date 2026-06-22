import * as http from 'http';

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    // 모든 응답에 대한 타입 설정
    res.setHeader('Content-Type', 'text/plain; carset=utf-8');

    // 요청한 클라이언트의 url, method를 가져옴
    const url = req.url || '/';
    const method = req.method || 'GET';

    console.log(`Received ${method} request for ${url}`);

    // 라우팅
    if (url === '/' && method === 'GET') {
        res.writeHead(200);
        res.end('메인 페이지 입니다!!');
    } else if (url === '/login' && method === 'GET') {
        res.writeHead(200);
        res.end('로그인 페이지 입니다!!');
    } else if (url === 'users' && method === 'GET') {
        res.writeHead(200);
        res.end('사용자 페이지 입니다!!');
    } else {
        res.writeHead(404);
        res.end('페이지를 찾을 수 없습니다!!');
    }
});

server.listen(3000, () => {
    console.log('서버가 3000번 포트에서 실행 중입니다!!');
}); 