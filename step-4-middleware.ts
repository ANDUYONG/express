import * as http from 'http';

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

export type Middleware = (req: MyRequest, res: http.ServerResponse, next: () => void) => void;

export class MyApp {
    private middlewares: Middleware[] = [];

    constructor() {
        this.middlewares = [];
    }

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    handleRequest(req: MyRequest, res: http.ServerResponse) {
        let index = 0;

        const next = () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index];

                index++;

                if (middleware)
                    middleware(req, res, next);
            } else {
                if (!res.writableEnded) {
                    res.statusCode = 404;
                    res.end('404 Not Found');
                }
            }
        };

        next();
    }
}