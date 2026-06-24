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


