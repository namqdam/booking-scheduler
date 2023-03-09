import axios, { AxiosRequestConfig } from 'axios';

type Response<T extends {}> = { succeeded: boolean; result: T };

export const apis = {
  login: async (payload: { phoneNumber: string; password: string }, options?: AxiosRequestConfig) => {
    const { data } = await axios.post<Response<{ access_token: string }>>(
      'https://youmed.vn/api/v4/auth/login/password/verify',
      {
        phoneNumber: payload.phoneNumber,
        password: payload.password,
      },
      options
    );

    return data;
  },

  order: async (payload: { patientId: string; serviceId: string; slotId: string }, options?: AxiosRequestConfig) => {
    const { data } = await axios.post<Response<{}>>(
      'https://youmed.vn/api/v4/orders',
      {
        appointments: [
          {
            prescription: [],
            platform: 'WEB',
            appointmentSlotId: payload.slotId,
            patientId: payload.patientId,
            serviceId: payload.serviceId,
            symptom: '',
            note: '',
          },
        ],
        orderType: 'APPOINTMENT',
        paymentGateway: 'PAY_AT_SERVICE',
        paymentPlatform: 'WEB',
        serviceId: payload.serviceId,
      },
      options
    );

    return data;
  },

  getInfo: async (options?: AxiosRequestConfig) => {
    const { data } = await axios.get<Response<{ primaryPatientId: string }>>(
      'https://youmed.vn/api/v4/users/info',
      options
    );

    return data;
  },

  getWorkingDays: async (
    query: { esDocId: string; startDate: string; endDate: string },
    options?: AxiosRequestConfig
  ) => {
    const { data } = await axios.get<Response<{ workingDates: { inactive: boolean; workingDate: string }[] }>>(
      'https://youmed.vn/api/v4/appointments/es-doc/working-dates',
      {
        ...options,
        params: {
          esDocType: 'doctor',
          slotStatus: 'USER_BOOKING',
          type: 'OFFLINE',
          ...query,
        },
      }
    );

    return data;
  },

  getWorkingSlots: async (query: { sId: string; date: string }, options?: AxiosRequestConfig) => {
    const { data } = await axios.get<
      Response<{
        slots: {
          appointmentSlots: {
            id: string;
            slotStatus: 'AVAILABLE' | 'FULL';
            timeslot: string;
          }[];
          datePart: string;
        }[];
      }>
    >(' https://youmed.vn/api/v4/appointments/slots', {
      ...options,
      params: {
        slotStatus: 'ALL',
        type: 'OFFLINE',
        ...query,
      },
    });

    return data;
  },
};
