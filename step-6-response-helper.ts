import * as http from 'http';

interface MyResponse extends http.ServerResponse {
    status: (statusCode: number) => this
    send: (body: any) => void
    json: (obj: any) => void
}

function setRes(res: http.ServerResponse): MyResponse {
    const myRes = res as MyResponse;

    // 상태 코드 설정 및 체이닝 가능하도록 구현
    myRes.status = function (statusCode: number): MyResponse {
        this.statusCode = statusCode;
        return this;
    };

    myRes.json = function (obj: any): void {
        this.setDefaultEncoding('utf-8');
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(obj));
    }

    // 문자열이나 버퍼 처리
    myRes.send = function (body: any): void {
        if (typeof body === 'object') {
            this.json(body);
        }
        if (!this.getHeader('Content-Type')) {
            this.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }

        this.end(body);
    };

    return myRes;
}


// 기존 req객체에 params 속성을 추가;
interface MyRequest extends http.IncomingMessage {
    params?: Record<string, string>
}

type RequestHandler = (req: MyRequest, res: http.ServerResponse) => void;

type RouteOptions = {
    path: string
    method: string
    regex?: RegExp
    paramNames?: string[]
}

interface Route {
    options: RouteOptions
    handler: RequestHandler
}

const routes: Route[] = []

function addRoute(options: RouteOptions, handler: RequestHandler) {
    options.paramNames = [];

    // '/users/:id' 에서 ':id' 부분을 추츨하여 키값 배열 Setting
    const regexPath = options.path.replace(/:([^\/]+)/g, (_, key) => {
        options.paramNames!.push(key)
        return '([^\\/]+)';
    });

    options.regex = new RegExp(`^${regexPath}$`);

    routes.push({ options, handler });
}


const server = http.createServer((req: MyRequest, res: http.ServerResponse) => {
    const myRes = setRes(res); // res 객체에 status, send, json 메서드 추가

    const method = req.method || 'GET';
    const fullUrl = req.url || '/';

    // 💡 개선점 2: 쿼리스트링 분리 (예: '/users/123?sort=desc' -> '/users/123')
    const path = fullUrl.split('?')[0] as string;

    // /users/:id/posts 등의 패턴이 인식 되도록 '/'가 아닌 것을 덩어리로 인식해서 검사
    const matchedRoute = routes.find(({ options }) => options.method === method && options.regex!.test(path));
    if (matchedRoute) {
        const match = path.match(matchedRoute.options.regex!);
        if (match) {
            req.params = {};
            matchedRoute.options.paramNames!.forEach((name: string, index: number) => {
                req.params![name] = match[index + 1] ?? '';
            });
        }

        matchedRoute.handler(req, res);

        // response helper적용
        myRes.status(200).json({ params: req.params }); // 상태 코드 설정
    } else {
        // response helper적용
        myRes.status(404).send('404 Not Found: 해당 API를 찾을 수 없습니다.');
    }
});

server.listen(3000, () => {
    console.log('서버가 http://localhost:3000 에서 실행 중입니다!');
});