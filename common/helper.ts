import * as http from 'http';

// 기존 req객체에 params 속성을 추가;
type ValueType = string | number | boolean | null | undefined

type RequestHandler = (req: MyRequest, res: http.ServerResponse) => void;

type RouteOptions = {
    path: string
    method: string
    regex?: RegExp
    paramNames?: string[]
}

export type ObjType = { [x: string]: ValueType }

export type Middleware = (req: MyRequest, res: http.ServerResponse, next: () => void) => void;

export interface MyResponse extends http.ServerResponse {
    status: (statusCode: number) => this
    send: (body: any) => void
    json: (obj: any) => void
}

export interface MyRequest extends http.IncomingMessage {
    params?: Record<string, ValueType>
    query?: Record<string, ValueType>
    body?: ObjType | string
}

interface Route {
    options: RouteOptions
    handler: RequestHandler
}


const routes: Route[] = []

export const REQUEST_BODY_METHODS = ['POST', 'PUT', 'PATCH'];

export const helper = {
    beforeRoute: (req: MyRequest, res: http.ServerResponse) => {
        const myRes = helper.setRes(res); // res 객체에 status, send, json 메서드 추가

        const method = req.method || 'GET';
        const fullUrl = req.url || '/';

        // 💡 개선점 2: 쿼리스트링 분리 (예: '/users/123?sort=desc' -> '/users/123')
        const path = fullUrl.split('?')[0] as string;

        // 쿼리스트링을 객체로 변환
        const queryString = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';
        if (queryString)
            req.query = { ...helper.convertQueryToObj(queryString) }

        // /users/:id/posts 등의 패턴이 인식 되도록 '/'가 아닌 것을 덩어리로 인식해서 검사 후 매칭되는 라우터를 가져옴.
        const matchedRoute = helper.getMachedRoute(method, path);
        if (matchedRoute) {
            const match = path.match(matchedRoute.options.regex!);
            if (match) {
                // id 값 parameter로 변환
                req.params = { ...helper.convertToParams(path, matchedRoute) };
            }

            // 핸들러 실행
            matchedRoute.handler(req, myRes);
        } else {
            // response helper적용
            myRes.status(404).send('404 Not Found: 해당 API를 찾을 수 없습니다.');
        }
    },

    setRes: (res: http.ServerResponse): MyResponse => {
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
    },

    addRoute: (options: RouteOptions, handler: RequestHandler) => {
        options.paramNames = [];

        // '/users/:id' 에서 ':id' 부분을 추츨하여 키값 배열 Setting
        const regexPath = options.path.replace(/:([^\/]+)/g, (_, key) => {
            options.paramNames!.push(key)
            return '([^\\/]+)';
        });

        options.regex = new RegExp(`^${regexPath}$`);

        routes.push({ options, handler });
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

    convertToParams: (path: string, matchedRoute: Route) => {
        const match = path.match(matchedRoute.options.regex!);
        let params: { [x: string]: ValueType } = {};
        if (match) {
            // param object 만들기
            const makeParams = (name: string, index: number) => params[name] = helper.getValue(match[index + 1]!) ?? '';
            matchedRoute.options.paramNames!.forEach(makeParams);
        }

        return params;
    },

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

    getMachedRoute: (method: string, path: string) => routes.find(({ options }) => options.method === method && options.regex!.test(path)),
}