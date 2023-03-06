import axios, { AxiosRequestConfig } from 'axios';

type Response<T extends {}> = { succeeded: boolean; result: T };

export async function login(payload: { phoneNumber: string; password: string }, options?: AxiosRequestConfig) {
  const { data } = await axios.post<Response<{ access_token: string }>>(
    'https://youmed.vn/api/v4/auth/login/password/verify',
    payload,
    options
  );

  return data;
}
