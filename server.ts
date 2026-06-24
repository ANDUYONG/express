import * as http from 'http';
import { MyApp } from './common/app.js'
import { bodyParser } from './middleware/body-parser.js'

const app = new MyApp();

// 1. 바디 파서
app.use(bodyParser);

// 2. 서버 실행
http.createServer((req, res) => app.handleRequest(req, res)).listen(3000);