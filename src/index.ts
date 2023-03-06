import { api } from './request';
import { login } from './youmed/api';

(async function main() {
  const data = process.env.DATA;
  if (!data) {
    console.log('missing base64 encoded DATA');
    return;
  }
  const jsonString = Buffer.from(data, 'base64').toString('ascii');

  const { phoneNumber, password } = JSON.parse(jsonString) as { phoneNumber: string; password: string };
  const { call: doLogin } = api.makeRequest(login, false);
  const {
    result: { access_token },
  } = await doLogin({ phoneNumber, password });
})();
