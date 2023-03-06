import { AxiosError, AxiosResponse } from 'axios';
import { get } from 'lodash';

class API {
  private _accessToken: string;

  set accessToken(value: string) {
    this._accessToken = value;
  }

  makeRequest = <Params extends any[], Data>(method: (...args: Params) => Promise<Data>, withAuth = true) => {
    let isCalling = false;
    const call = async (...args: Params): Promise<Data> => {
      const params = args;
      try {
        isCalling = true;
        if (withAuth) {
          if (!this._accessToken) throw new AxiosError('Unauthorized');
          else params.push({ headers: { Authorization: `Bearer ${this._accessToken}` } });
        }
        return await method.call(method, ...params);
      } catch (error) {
        const status = get(error, 'response.status');
        if (status === 401) {
          this.accessToken = undefined;
        }
        return Promise.reject(error);
      } finally {
        isCalling = false;
      }
    };

    return { call, isCalling };
  };
}

export const api = new API();
