import * as http from 'http';
import type { MyRequest, MyResponse, Middleware } from './helper.ts'
import { helper } from './helper.js'

export class MyApp {
    private middlewares: Middleware[] = [];

    constructor() {
        this.middlewares = [];
    }

    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        let index = 0;

        const next = () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index];

                index++;

                if (middleware)
                    middleware(req, res, next);
            } else {
                // 라우터로 넘겨주기 전 실행 로직
                helper.beforeRoute(req, res);
            }
        };

        next();
    }
}